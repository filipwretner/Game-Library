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

  it('rejects a bad status query and a missing body with 400', async () => {
    expect((await request(app).get('/api/entries?status=NOPE')).status).toBe(400);
    expect((await request(app).post('/api/entries').send({ igdbId: 1 })).status).toBe(400);
  });
});
