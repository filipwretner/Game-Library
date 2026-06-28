import { describe, expect, it, vi } from 'vitest';
import { IgdbMetadataProvider } from './igdbMetadataProvider.js';
import type { IgdbClient } from './igdbClient.js';

function fakeClient(rows: unknown): IgdbClient {
  return { query: vi.fn().mockResolvedValue(rows) };
}

describe('IgdbMetadataProvider.search', () => {
  it('maps IGDB rows onto the port shape', async () => {
    const client = fakeClient([
      {
        id: 1942,
        name: 'The Witcher 3',
        cover: { url: '//images.igdb.com/igdb/image/upload/t_thumb/abc.jpg' },
        platforms: [6, 167],
      },
    ]);
    const result = await new IgdbMetadataProvider(client).search('witcher');

    expect(result).toEqual([
      {
        igdbId: 1942,
        title: 'The Witcher 3',
        coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/abc.jpg',
        platforms: [6, 167],
      },
    ]);
  });

  it('defaults missing cover and platforms', async () => {
    const client = fakeClient([{ id: 7, name: 'No Art Game' }]);
    const [row] = await new IgdbMetadataProvider(client).search('x');

    expect(row).toEqual({ igdbId: 7, title: 'No Art Game', coverUrl: null, platforms: [] });
  });

  it('escapes quotes in the search term', async () => {
    const client = fakeClient([]);
    await new IgdbMetadataProvider(client).search('say "hi"');

    const body = (client.query as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as string;
    expect(body).toContain('search "say \\"hi\\"";');
  });
});
