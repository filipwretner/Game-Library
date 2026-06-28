import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { buildTestHarness } from '../test/fakes.js';

function testApp() {
  return createApp(buildTestHarness().container);
}

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(testApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns 404 with an error envelope for unknown routes', async () => {
    const res = await request(testApp()).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
