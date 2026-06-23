import { handleSaveScore } from '../../server/leaderboard.js';

export async function onRequest(context) {
  return handleSaveScore(context.request, context.env);
}
