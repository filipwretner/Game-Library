import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import type { GameMetadata } from '@game-tracker/shared';
import { createApp } from '../app.js';
import { buildTestHarness } from '../test/fakes.js';

const game: GameMetadata = {
  igdbId: 1,
  title: 'Hades',
  coverUrl: null,
  summary: null,
  releaseDate: null,
  platforms: [6],
  igdbRating: null,
};
const game2: GameMetadata = { ...game, igdbId: 2, title: 'Celeste' };

describe('custom list endpoints', () => {
  let app: Express;

  beforeEach(() => {
    app = createApp(buildTestHarness([game, game2]).container);
  });

  it('creates a list, adds games, lists and reorders them', async () => {
    const created = await request(app).post('/api/lists').send({ title: 'Top 10 of 2024' });
    expect(created.status).toBe(201);
    const listId = created.body.id as number;

    const fetched = await request(app).get(`/api/lists/${listId}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.title).toBe('Top 10 of 2024');

    const a = await request(app).post(`/api/lists/${listId}/entries`).send({ igdbId: 1 });
    const b = await request(app).post(`/api/lists/${listId}/entries`).send({ igdbId: 2 });
    expect(a.status).toBe(201);

    const reordered = await request(app)
      .put(`/api/lists/${listId}/rank`)
      .send({ orderedEntryIds: [b.body.id, a.body.id] });
    expect(reordered.status).toBe(200);
    expect(reordered.body.map((e: { game: { title: string } }) => e.game.title)).toEqual([
      'Celeste',
      'Hades',
    ]);
  });

  it('rejects an empty title and a duplicate game', async () => {
    expect((await request(app).post('/api/lists').send({ title: '  ' })).status).toBe(400);

    const list = await request(app).post('/api/lists').send({ title: 'Favourites' });
    const id = list.body.id as number;
    await request(app).post(`/api/lists/${id}/entries`).send({ igdbId: 1 });
    const dup = await request(app).post(`/api/lists/${id}/entries`).send({ igdbId: 1 });
    expect(dup.status).toBe(409);
  });

  it('removes an entry and deletes a list', async () => {
    const list = await request(app).post('/api/lists').send({ title: 'Favourites' });
    const id = list.body.id as number;
    const entry = await request(app).post(`/api/lists/${id}/entries`).send({ igdbId: 1 });

    const del = await request(app).delete(`/api/lists/${id}/entries/${entry.body.id as number}`);
    expect(del.status).toBe(204);

    expect((await request(app).delete(`/api/lists/${id}`)).status).toBe(204);
    expect((await request(app).get('/api/lists')).body).toHaveLength(0);
  });
});
