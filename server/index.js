import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { OAuth2Client } from 'google-auth-library';
import { query, init } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'doi-chuoi-bi-mat-nay-khi-deploy';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '..', 'client', 'dist');

app.use(cors());
app.use(express.json());

// ---------- Helpers ----------
function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: '30d',
  });
}

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Chưa đăng nhập' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ' });
  }
}

// Bọc handler async để lỗi tự trả về 500 thay vì làm sập app
const wrap = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((err) => {
    console.error(err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  });

// Thứ trong tuần (0=CN..6=T7) của một chuỗi YYYY-MM-DD
function dow(dateStr) {
  return new Date(dateStr + 'T00:00:00').getDay();
}

// ---------- Auth: Đăng nhập bằng Google ----------
app.post(
  '/api/auth/google',
  wrap(async (req, res) => {
    if (!GOOGLE_CLIENT_ID)
      return res
        .status(500)
        .json({ error: 'Máy chủ chưa cấu hình GOOGLE_CLIENT_ID' });

    const { credential } = req.body;
    if (!credential)
      return res
        .status(400)
        .json({ error: 'Thiếu thông tin đăng nhập Google' });

    // Xác thực token Google gửi lên
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ error: 'Đăng nhập Google không hợp lệ' });
    }

    const email = (payload.email || '').toLowerCase();
    const googleId = payload.sub;
    if (!email)
      return res.status(400).json({ error: 'Không lấy được email từ Google' });

    // Tìm tài khoản; chưa có thì tạo mới (đăng nhập = đăng ký luôn)
    const found = await query('SELECT id, email FROM users WHERE email = $1', [
      email,
    ]);
    let user = found.rows[0];
    if (!user) {
      const ins = await query(
        'INSERT INTO users (email, google_id) VALUES ($1, $2) RETURNING id, email',
        [email, googleId]
      );
      user = ins.rows[0];
    } else {
      await query(
        'UPDATE users SET google_id = $1 WHERE id = $2 AND google_id IS NULL',
        [googleId, user.id]
      );
    }

    res.json({ token: signToken(user), user });
  })
);

// ---------- Task routes ----------
app.get(
  '/api/tasks',
  auth,
  wrap(async (req, res) => {
    const date = req.query.date;
    if (!date) return res.status(400).json({ error: 'Thiếu tham số date' });

    const { rows } = await query(
      `SELECT * FROM tasks
       WHERE user_id = $1
         AND ( (repeat = 'none'  AND date = $2)
            OR (repeat != 'none' AND date <= $2) )`,
      [req.user.id, date]
    );

    const comp = await query(
      'SELECT task_id FROM completions WHERE user_id = $1 AND date = $2',
      [req.user.id, date]
    );
    const completed = new Set(comp.rows.map((r) => r.task_id));
    const targetDow = dow(date);

    const result = rows
      .filter((t) => {
        if (t.repeat === 'none') return true;
        if (t.repeat === 'daily') return true;
        if (t.repeat === 'weekly') return dow(t.date) === targetDow;
        return true;
      })
      .map((t) => ({ ...t, done: completed.has(t.id) }))
      .sort((a, b) => a.position - b.position || a.id - b.id);

    res.json(result);
  })
);

app.post(
  '/api/tasks',
  auth,
  wrap(async (req, res) => {
    const { date, title } = req.body;
    if (!date || !title?.trim())
      return res.status(400).json({ error: 'Thiếu ngày hoặc tên việc' });

    const max = await query(
      'SELECT COALESCE(MAX(position), 0) AS m FROM tasks WHERE user_id = $1',
      [req.user.id]
    );

    const { rows } = await query(
      `INSERT INTO tasks
        (user_id, date, title, start_time, end_time, note, color, repeat, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        req.user.id,
        date,
        title.trim(),
        req.body.start_time || null,
        req.body.end_time || null,
        req.body.note || null,
        req.body.color || 'indigo',
        req.body.repeat || 'none',
        Number(max.rows[0].m) + 1,
      ]
    );
    res.json({ ...rows[0], done: false });
  })
);

// Sắp xếp lại thứ tự — phải đặt TRƯỚC route '/api/tasks/:id'
app.patch(
  '/api/tasks/reorder',
  auth,
  wrap(async (req, res) => {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    for (let i = 0; i < ids.length; i++) {
      await query(
        'UPDATE tasks SET position = $1 WHERE id = $2 AND user_id = $3',
        [i, Number(ids[i]), req.user.id]
      );
    }
    res.json({ ok: true });
  })
);

// Tick / bỏ tick hoàn thành cho một ngày cụ thể
app.post(
  '/api/tasks/:id/toggle',
  auth,
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    const date = req.body.date;
    if (!date) return res.status(400).json({ error: 'Thiếu ngày' });

    const task = await query(
      'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (!task.rows.length)
      return res.status(404).json({ error: 'Không tìm thấy việc' });

    const exists = await query(
      'SELECT 1 FROM completions WHERE task_id = $1 AND date = $2',
      [id, date]
    );

    if (exists.rows.length) {
      await query('DELETE FROM completions WHERE task_id = $1 AND date = $2', [
        id,
        date,
      ]);
      res.json({ done: false });
    } else {
      await query(
        'INSERT INTO completions (user_id, task_id, date) VALUES ($1, $2, $3)',
        [req.user.id, id, date]
      );
      res.json({ done: true });
    }
  })
);

app.patch(
  '/api/tasks/:id',
  auth,
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    const found = await query(
      'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (!found.rows.length)
      return res.status(404).json({ error: 'Không tìm thấy việc' });

    const fields = [
      'title',
      'start_time',
      'end_time',
      'note',
      'color',
      'repeat',
      'date',
    ];
    const updates = [];
    const values = [];
    let n = 1;
    for (const f of fields) {
      if (f in req.body) {
        updates.push(`${f} = $${n++}`);
        values.push(req.body[f]);
      }
    }
    if (!updates.length) {
      const cur = await query('SELECT * FROM tasks WHERE id = $1', [id]);
      return res.json(cur.rows[0]);
    }
    values.push(id, req.user.id);
    const { rows } = await query(
      `UPDATE tasks SET ${updates.join(', ')}
       WHERE id = $${n++} AND user_id = $${n}
       RETURNING *`,
      values
    );
    res.json(rows[0]);
  })
);

app.delete(
  '/api/tasks/:id',
  auth,
  wrap(async (req, res) => {
    await query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [
      Number(req.params.id),
      req.user.id,
    ]);
    res.json({ ok: true });
  })
);

// ---------- Phục vụ frontend đã build (khi deploy) ----------
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res) => {
    if (req.path.startsWith('/api'))
      return res.status(404).json({ error: 'Không tìm thấy' });
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ---------- Khởi động ----------
init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server chạy tại http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Không kết nối được database:', err.message);
    process.exit(1);
  });
