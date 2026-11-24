import { afterEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  stored: [] as string[],
  deleted: [] as string[],
  failing: new Set<string>(),
  embeddings: new Map<string, number[]>(),
}));

vi.mock('../src/config/imageStorage.js', () => ({
  storeImage: vi.fn(async (buffer: Buffer) => {
    const key = buffer.toString();
    if (state.failing.has(key)) throw new Error(`store failed: ${key}`);
    const publicId = `id-${key}`;
    state.stored.push(publicId);
    return { url: `/uploads/${publicId}`, publicId };
  }),
  deleteImage: vi.fn(async (publicId: string) => {
    state.deleted.push(publicId);
  }),
}));

vi.mock('../src/config/imageEmbedding.js', () => ({
  embedImage: vi.fn(async (buffer: Buffer) => state.embeddings.get(buffer.toString()) ?? null),
}));

import { storeImagesWithEmbeddings } from '../src/shared/utils/storeImagesWithEmbeddings.js';

function file(contents: string): Express.Multer.File {
  return {
    buffer: Buffer.from(contents),
    mimetype: 'image/png',
    originalname: 'photo.png',
  } as Express.Multer.File;
}

afterEach(() => {
  state.stored.length = 0;
  state.deleted.length = 0;
  state.failing.clear();
  state.embeddings.clear();
});

describe('storeImagesWithEmbeddings', () => {
  it('stores images and normalizes their embeddings', async () => {
    state.embeddings.set('a', [3, 4]);

    const [image] = await storeImagesWithEmbeddings([file('a')]);

    expect(image?.publicId).toBe('id-a');
    expect(image?.embedding?.[0]).toBeCloseTo(0.6);
    expect(image?.embedding?.[1]).toBeCloseTo(0.8);
  });

  it('deletes successful uploads when another file fails', async () => {
    state.failing.add('b');

    await expect(
      storeImagesWithEmbeddings([file('a'), file('b'), file('c')], 2),
    ).rejects.toThrow('store failed: b');

    expect(state.stored.length).toBeGreaterThan(0);
    expect(new Set(state.deleted)).toEqual(new Set(state.stored));
  });
});
