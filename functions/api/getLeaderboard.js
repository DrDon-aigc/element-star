import { handleGetLeaderboard } from '../../server/leaderboard.js';

export async function onRequest(context) {
  return handleGetLeaderboard(context.env);
}
