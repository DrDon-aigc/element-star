import { neon } from '@neondatabase/serverless';

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
  });
}

export function getDatabaseUrl(env = {}) {
  const databaseUrl = env.DATABASE_URL;

  if (typeof databaseUrl !== 'string' || databaseUrl.trim() === '') {
    throw new Error('Missing DATABASE_URL environment variable.');
  }

  return databaseUrl.trim();
}

export function validateScorePayload(payload) {
  const normalizedUsername = typeof payload?.username === 'string' ? payload.username.trim() : '';
  const normalizedTimeUsed = Number(payload?.time_used);

  if (!normalizedUsername) {
    return {
      ok: false,
      status: 400,
      error: 'Username is required.',
    };
  }

  if (normalizedUsername.length > 24) {
    return {
      ok: false,
      status: 400,
      error: 'Username must be 24 characters or fewer.',
    };
  }

  if (!Number.isInteger(normalizedTimeUsed) || normalizedTimeUsed <= 0) {
    return {
      ok: false,
      status: 400,
      error: 'time_used must be a positive integer.',
    };
  }

  return {
    ok: true,
    value: {
      username: normalizedUsername,
      timeUsed: normalizedTimeUsed,
    },
  };
}

export async function handleGetLeaderboard(env, createSql = neon) {
  try {
    const sql = createSql(getDatabaseUrl(env));

    const leaderboard = await sql`
      SELECT id, username, time_used, created_at
      FROM leaderboard
      ORDER BY time_used ASC, created_at ASC, id ASC
      LIMIT 20
    `;

    return jsonResponse(leaderboard);
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

export async function handleSaveScore(request, env, createSql = neon) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    let payload;
    try {
      payload = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body.' }, 400);
    }

    const validation = validateScorePayload(payload);
    if (!validation.ok) {
      return jsonResponse({ error: validation.error }, validation.status);
    }

    const sql = createSql(getDatabaseUrl(env));
    await sql`
      INSERT INTO leaderboard (username, time_used)
      VALUES (${validation.value.username}, ${validation.value.timeUsed})
    `;

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}
