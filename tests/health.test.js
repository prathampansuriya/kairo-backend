import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Health & Error Handling Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  it('GET /api/v1/health should return 200 with service health payload', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('statusCode', 200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('status');
    expect(res.body.data).toHaveProperty('uptimeSeconds');
    expect(res.body.data).toHaveProperty('database');
    expect(res.body.data).toHaveProperty('memory');
  });

  it('GET /api/v1/health/ready should return 503 when database is disconnected', async () => {
    // In this unit/integration test without an active DB connection, readiness probe must strictly return 503
    const res = await request(app).get('/api/v1/health/ready');

    expect(res.status).toBe(503);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('statusCode', 503);
    expect(res.body.error).toHaveProperty('code', 'DATABASE_NOT_READY');
  });

  it('GET /api/v1/non-existent-route should return 404 with standardized error envelope', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error).toHaveProperty('code', 'ENDPOINT_NOT_FOUND');
    expect(res.body.error).toHaveProperty('message');
  });
});
