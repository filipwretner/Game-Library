import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import type { GameMetadata, PriceQuote } from '@game-tracker/shared';
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

describe('entries endpoints', () => {
  let app: Express;

  beforeEach(() => {
    app = createApp(buildTestHarness([game]).container);
  });

  it('adds a game to a list and lists it back', async () => {
    const created = await request(app).post('/api/entries').send({ igdbId: 1, status: 'PLAYED' });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe('PLAYED');
    expect(created.body.rank).toBe(1);
    expect(created.body.game.title).toBe('Hades');

    const list = await request(app).get('/api/entries?status=PLAYED');
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].game.igdbId).toBe(1);
  });

  it('rejects adding the same game twice with 409', async () => {
    await request(app).post('/api/entries').send({ igdbId: 1, status: 'BACKLOG' });
    const dup = await request(app).post('/api/entries').send({ igdbId: 1, status: 'WISHLIST' });

    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('CONFLICT');
  });

  it('updates an entry via PATCH', async () => {
    const created = await request(app).post('/api/entries').send({ igdbId: 1, status: 'BACKLOG' });
    const id = created.body.id as number;

    const patched = await request(app).patch(`/api/entries/${id}`).send({ notes: 'finish soon' });
    expect(patched.status).toBe(200);
    expect(patched.body.notes).toBe('finish soon');
  });

  it('deletes an entry', async () => {
    const created = await request(app).post('/api/entries').send({ igdbId: 1, status: 'BACKLOG' });
    const id = created.body.id as number;

    const del = await request(app).delete(`/api/entries/${id}`);
    expect(del.status).toBe(204);

    const list = await request(app).get('/api/entries?status=BACKLOG');
    expect(list.body).toHaveLength(0);
  });

  it('reorders the Played list via PUT /entries/rank', async () => {
    const game2: GameMetadata = { ...game, igdbId: 2, title: 'Celeste' };
    app = createApp(buildTestHarness([game, game2]).container);

    const first = await request(app).post('/api/entries').send({ igdbId: 1, status: 'PLAYED' });
    const second = await request(app).post('/api/entries').send({ igdbId: 2, status: 'PLAYED' });
    const a = first.body.id as number;
    const b = second.body.id as number;

    const res = await request(app)
      .put('/api/entries/rank')
      .send({ orderedEntryIds: [b, a] });

    expect(res.status).toBe(200);
    expect(res.body.map((e: { id: number; rank: number }) => [e.id, e.rank])).toEqual([
      [b, 1],
      [a, 2],
    ]);
  });

  it('fetches a PC wishlist price and exposes the wishlist total', async () => {
    const quote: PriceQuote = {
      price: 6.24,
      normalPrice: 24.99,
      discountPct: 75,
      currency: 'USD',
      store: 'Steam',
      dealUrl: 'https://www.cheapshark.com/redirect?dealID=xyz',
    };
    app = createApp(buildTestHarness([game], quote).container);
    const created = await request(app).post('/api/entries').send({ igdbId: 1, status: 'WISHLIST' });
    const id = created.body.id as number;

    const fetched = await request(app).post(`/api/entries/${id}/fetch-price`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.price).toBe(6.24);
    expect(fetched.body.discountPct).toBe(75);

    const total = await request(app).get('/api/wishlist/total');
    expect(total.status).toBe(200);
    expect(total.body).toEqual({ total: 6.24, currency: 'USD' });
  });

  it('rejects a bad status query and a missing body with 400', async () => {
    expect((await request(app).get('/api/entries?status=NOPE')).status).toBe(400);
    expect((await request(app).post('/api/entries').send({ igdbId: 1 })).status).toBe(400);
  });
});
