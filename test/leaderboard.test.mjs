import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  getDatabase,
  handleGetLeaderboard,
  handleSaveScore,
  validateScorePayload,
} from '../server/leaderboard.js';

function createD1Stub({ rows = [], onRun = () => {} } = {}) {
  return {
    prepare(query) {
      return {
        bind(...values) {
          return {
            async run() {
              onRun({ query, values });
              return { success: true, meta: { changes: 1 } };
            },
          };
        },
        async all() {
          return { success: true, results: rows };
        },
      };
    },
  };
}

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

  it('reads the D1 database from Cloudflare environment bindings', () => {
    const db = createD1Stub();
    assert.equal(getDatabase({ DB: db }), db);
  });

  it('saves scores through the provided D1 database binding', async () => {
    const calls = [];
    const response = await handleSaveScore(
      new Request('https://example.com/api/saveScore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: '  Alice  ', time_used: 42 }),
      }),
      {},
      createD1Stub({ onRun: (call) => calls.push(call) }),
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true });
    assert.deepEqual(calls[0].values, ['Alice', 42]);
  });

  it('returns leaderboard rows from the database', async () => {
    const rows = [{ id: 1, username: 'Alice', time_used: 42, created_at: '2026-06-23T00:00:00Z' }];
    const response = await handleGetLeaderboard(
      {},
      createD1Stub({ rows }),
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), rows);
  });
});
