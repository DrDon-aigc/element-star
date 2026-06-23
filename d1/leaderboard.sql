CREATE TABLE IF NOT EXISTS leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  time_used INTEGER NOT NULL CHECK (time_used > 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_time
  ON leaderboard (time_used ASC, created_at ASC);

SELECT id, username, time_used, created_at
FROM leaderboard
ORDER BY time_used ASC, created_at ASC, id ASC;

-- Delete a specific row by id when you want to remove a leaderboard entry.
-- DELETE FROM leaderboard WHERE id = <record_id>;
