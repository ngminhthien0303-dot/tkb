// Kết nối Postgres (dùng được cả Neon trên cloud lẫn Postgres local).
import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    '❌ Thiếu biến môi trường DATABASE_URL. Hãy tạo file server/.env (xem .env.example).'
  );
  process.exit(1);
}

// Neon / Render cần SSL; Postgres chạy localhost thì không.
const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);

const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

// Neon đóng kết nối rảnh sau một lúc; bắt lỗi này để server không bị crash.
pool.on('error', (err) => {
  console.error('⚠️  Kết nối Postgres rảnh bị đóng (sẽ tự kết nối lại):', err.message);
});

export const query = (text, params) => pool.query(text, params);

// Tạo bảng nếu chưa có (chạy lúc khởi động).
export async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date        TEXT NOT NULL,
      title       TEXT NOT NULL,
      start_time  TEXT,
      end_time    TEXT,
      note        TEXT,
      color       TEXT NOT NULL DEFAULT 'indigo',
      repeat      TEXT NOT NULL DEFAULT 'none',
      position    INTEGER NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS completions (
      user_id INTEGER NOT NULL,
      task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      date    TEXT NOT NULL,
      PRIMARY KEY (task_id, date)
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_user_date   ON tasks(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_tasks_user_repeat ON tasks(user_id, repeat);
  `);
}

export default pool;
