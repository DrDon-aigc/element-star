import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  getDatabaseUrl,
  handleGetLeaderboard,
  handleSaveScore,
  validateScorePayload,
} from '../server/leaderboard.js';

describe('leaderboard service', () => {
  it('normalizes a valid score payload', () => {
    assert.deepEqual(validateScorePayload({ username: '  星旅者  ', time_used: '17' }), {
      ok: true,
      value: { username: '星旅者', timeUsed: 17 },
    });
  });

  it('rejects invalid score payloads before writing to the database', () => {
    assert.deepEqual(validateScorePayload({ username: '   ', time_used: 17 }), {
      ok: false,
      status: 400,
      error: 'Username is required.',
    });

    assert.deepEqual(validateScorePayload({ username: '星旅者', time_used: 0 }), {
      ok: false,
      status: 400,
      error: 'time_used must be a positive integer.',
    });
  });

  it('reads the database URL from Cloudflare environment bindings', () => {
    assert.equal(getDatabaseUrl({ DATABASE_URL: 'postgres://cloudflare' }), 'postgres://cloudflare');
  });

  it('saves scores through the provided Neon client factory', async () => {
    let databaseUrl = '';
    const calls = [];
    const response = await handleSaveScore(
      new Request('https://example.com/api/saveScore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: '  Alice  ', time_used: 42 }),
      }),
      { DATABASE_URL: 'postgres://test' },
      (url) => {
        databaseUrl = url;
        return async (strings, ...values) => {
          calls.push({ strings: [...strings], values });
          return [];
        };
      },
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true });
    assert.equal(databaseUrl, 'postgres://test');
    assert.deepEqual(calls[0].values, ['Alice', 42]);
  });

  it('returns leaderboard rows from the database', async () => {
    const rows = [{ id: 1, username: 'Alice', time_used: 42, created_at: '2026-06-23T00:00:00Z' }];
    const response = await handleGetLeaderboard(
      { DATABASE_URL: 'postgres://test' },
      () => async () => rows,
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), rows);
  });
});
