import { describe, expect, it, vi } from 'vitest';
import { escapeRegex } from '../src/shared/utils/escapeRegex.js';
import { buildPaginationMeta, MAX_LIMIT, parsePagination } from '../src/shared/utils/pagination.js';
import { sniffImageType } from '../src/middleware/upload.js';
import { cosineSimilarity, dotProduct, isNormalized, normalizeVector, textOverlap, textSimilarity } from '../src/shared/utils/similarity.js';

describe('parsePagination', () => {
  it('applies defaults', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 12 });
  });

  it('clamps the limit to the documented maximum', () => {
    expect(parsePagination({ page: 2, limit: 500 })).toEqual({ page: 2, limit: MAX_LIMIT });
  });

  it('rejects non-positive and non-integer input', () => {
    expect(() => parsePagination({ page: 0 })).toThrow();
    expect(() => parsePagination({ page: -1 })).toThrow();
    expect(() => parsePagination({ page: 1.5 })).toThrow();
    expect(() => parsePagination({ limit: 0 })).toThrow();
  });
});

describe('buildPaginationMeta', () => {
  it('computes total pages', () => {
    expect(buildPaginationMeta(1, 12, 0)).toEqual({ page: 1, limit: 12, total: 0, totalPages: 0 });
    expect(buildPaginationMeta(2, 12, 13)).toEqual({ page: 2, limit: 12, total: 13, totalPages: 2 });
    expect(buildPaginationMeta(3, 12, 25)).toEqual({ page: 3, limit: 12, total: 25, totalPages: 3 });
  });
});

describe('escapeRegex', () => {
  it('neutralises regex metacharacters', () => {
    expect(new RegExp(escapeRegex('a+b*c')).test('a+b*c')).toBe(true);
    expect(new RegExp(escapeRegex('.*')).test('anything')).toBe(false);
    expect(new RegExp(escapeRegex('.*')).test('.*')).toBe(true);
    expect(new RegExp(escapeRegex('(x)')).test('(x)')).toBe(true);
  });
});

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors and 0 for orthogonal ones', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it('is scale invariant and handles degenerate input', () => {
    expect(cosineSimilarity([2, 2], [5, 5])).toBeCloseTo(1);
    expect(cosineSimilarity([], [])).toBe(0);
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });
});

describe('normalizeVector', () => {
  it('returns a unit-length vector and preserves direction', () => {
    const normalized = normalizeVector([3, 4]);
    expect(normalized[0]).toBeCloseTo(0.6);
    expect(normalized[1]).toBeCloseTo(0.8);
    expect(isNormalized(normalized)).toBe(true);
  });

  it('handles zero and degenerate vectors', () => {
    expect(normalizeVector([])).toEqual([]);
    expect(normalizeVector([0, 0])).toEqual([0, 0]);
    expect(isNormalized([0, 0])).toBe(false);
  });
});

describe('dotProduct', () => {
  it('equals cosine similarity for normalized vectors', () => {
    const a = normalizeVector([2, 2, 1]);
    const b = normalizeVector([1, 3, 2]);
    expect(dotProduct(a, b)).toBeCloseTo(cosineSimilarity(a, b));
  });

  it('handles mismatched and empty vectors', () => {
    expect(dotProduct([], [])).toBe(0);
    expect(dotProduct([1, 2], [1, 2, 3])).toBe(0);
  });
});

describe('textOverlap', () => {
  it('scores identical wording as 1 and ignores stopwords', () => {
    const text = 'Black leather wallet found near the library entrance';
    expect(textOverlap(text, text)).toBe(1);
  });

  it('scores disjoint wording as 0', () => {
    expect(textOverlap('silver keys ring', 'blue backpack strap')).toBe(0);
    expect(textOverlap('', 'anything here')).toBe(0);
  });
});

describe('textSimilarity', () => {
  it('scores identical wording as 1', () => {
    const text = 'Black leather wallet found near the library entrance';
    expect(textSimilarity(text, text)).toBe(1);
  });

  it('rewards partial wording overlap between paraphrases', () => {
    const score = textSimilarity(
      'Lost a black wallet with a card holder near the library',
      'Black wallet found in the library cafe',
    );
    expect(score).toBeGreaterThan(0.4);
    expect(score).toBeLessThan(1);
  });

  it('scores disjoint wording as 0 and stems simple plurals', () => {
    expect(textSimilarity('silver keys ring', 'blue backpack strap')).toBe(0);
    expect(textSimilarity('silver keys on a ring', 'silver key ring')).toBeGreaterThan(0);
  });
});

describe('sniffImageType', () => {
  it('detects real image formats from magic bytes', () => {
    expect(sniffImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]))).toBe('image/jpeg');
    expect(sniffImageType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('image/png');
    expect(sniffImageType(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP')]))).toBe(
      'image/webp',
    );
  });

  it('rejects everything else', () => {
    expect(sniffImageType(Buffer.from('%PDF-1.7'))).toBeNull();
    expect(sniffImageType(Buffer.alloc(0))).toBeNull();
    expect(sniffImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBeNull();
  });
});

describe('authUserCache', () => {
  it('caches findUserById lookups and supports invalidation', async () => {
    const { User } = await import('../src/modules/users/user.model.js');
    const { findUserById, getAuthUserCacheSize, invalidateAuthUserCache } = await import(
      '../src/modules/users/user.service.js'
    );
    const { Types } = await import('mongoose');

    const fakeId = new Types.ObjectId().toString();
    const fakeUser = {
      _id: new Types.ObjectId(fakeId),
      username: 'cachetest',
      email: 'cache@example.com',
      role: 'USER',
    };

    const spy = vi.spyOn(User, 'findById').mockReturnValue({
      select: () => ({
        lean: () => Promise.resolve(fakeUser),
      }),
    } as unknown as ReturnType<typeof User.findById>);

    try {
      invalidateAuthUserCache();
      expect(getAuthUserCacheSize()).toBe(0);

      // First call hits the mock
      const user1 = await findUserById(fakeId, 5000);
      expect(user1).toEqual(fakeUser);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(getAuthUserCacheSize()).toBe(1);

      // Second call hits in-memory cache without calling User.findById
      const user2 = await findUserById(fakeId, 5000);
      expect(user2).toEqual(fakeUser);
      expect(spy).toHaveBeenCalledTimes(1);

      // Invalidation evicts from cache
      invalidateAuthUserCache(fakeId);
      expect(getAuthUserCacheSize()).toBe(0);

      // Third call hits DB query again
      const user3 = await findUserById(fakeId, 5000);
      expect(user3).toEqual(fakeUser);
      expect(spy).toHaveBeenCalledTimes(2);
    } finally {
      spy.mockRestore();
      invalidateAuthUserCache();
    }
  });
});
