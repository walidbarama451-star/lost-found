import { describe, expect, it } from 'vitest';
import { escapeRegex } from '../src/shared/utils/escapeRegex.js';
import { buildPaginationMeta, MAX_LIMIT, parsePagination } from '../src/shared/utils/pagination.js';
import { sniffImageType } from '../src/middleware/upload.js';

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
