import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from './api.js';
import ListView from './ListView.jsx';
import TimelineView from './TimelineView.jsx';
import TaskModal from './TaskModal.jsx';

function todayStr() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

function prettyDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function Planner() {
  const [date, setDate] = useState(todayStr());
  const [view, setView] = useState(
    () => localStorage.getItem('tkb_view') || 'list'
  );
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // null | {} (mới) | task (sửa)
  const [now, setNow] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });
  const [notifOn, setNotifOn] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );
  const notified = useRef(new Set());

  const isToday = date === todayStr();

  useEffect(() => {
    localStorage.setItem('tkb_view', view);
  }, [view]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setTasks(await api.listTasks(date));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  // Đồng hồ phút: cập nhật vạch "bây giờ" + kiểm tra nhắc nhở
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow(d.getHours() * 60 + d.getMinutes());
    };
    const id = setInterval(tick, 20000);
    return () => clearInterval(id);
  }, []);

  // Nhắc nhở: khi đến giờ bắt đầu của việc hôm nay
  useEffect(() => {
    if (!notifOn || !isToday) return;
    const cur = `${String(Math.floor(now / 60)).padStart(2, '0')}:${String(
      now % 60
    ).padStart(2, '0')}`;
    for (const t of tasks) {
      if (t.start_time === cur && !t.done && !notified.current.has(t.id + cur)) {
        notified.current.add(t.id + cur);
        try {
          new Notification('🔔 Đến giờ rồi!', {
            body: `${t.title} (${t.start_time}${
              t.end_time ? ' – ' + t.end_time : ''
            })`,
          });
        } catch {
          /* trình duyệt không hỗ trợ */
        }
      }
    }
  }, [now, tasks, notifOn, isToday]);

  async function enableNotif() {
    if (typeof Notification === 'undefined')
      return setError('Trình duyệt không hỗ trợ thông báo');
    const perm = await Notification.requestPermission();
    setNotifOn(perm === 'granted');
  }

  async function handleSave(data) {
    try {
      if (modal?.id) {
        await api.updateTask(modal.id, data);
      } else {
        await api.createTask({ ...data, date });
      }
      setModal(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleDone(task) {
    setTasks((ts) =>
      ts.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t))
    );
    try {
      await api.toggleTask(task.id, date);
    } catch {
      load();
    }
  }

  async function remove(task) {
    const msg =
      task.repeat !== 'none'
        ? `Việc lặp lại "${task.title}" sẽ bị xoá ở MỌI ngày. Tiếp tục?`
        : `Xoá việc "${task.title}"?`;
    if (!confirm(msg)) return;
    setTasks((ts) => ts.filter((t) => t.id !== task.id));
    try {
      await api.deleteTask(task.id);
    } catch {
      load();
    }
  }

  async function reorder(ids) {
    const map = new Map(tasks.map((t) => [t.id, t]));
    setTasks(ids.map((id) => map.get(id)).filter(Boolean));
    try {
      await api.reorderTasks(ids);
    } catch {
      load();
    }
  }

  function sortByTime() {
    const sorted = [...tasks].sort((a, b) => {
      const x = a.start_time || '99:99';
      const y = b.start_time || '99:99';
      return x < y ? -1 : x > y ? 1 : 0;
    });
    reorder(sorted.map((t) => t.id));
  }

  const doneCount = tasks.filter((t) => t.done).length;
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <main className="planner">
      <div className="date-nav">
        <button className="btn-ghost" onClick={() => setDate(addDays(date, -1))}>
          ←
        </button>
        <div className="date-center">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <div className="date-label">{prettyDate(date)}</div>
          {!isToday && (
            <button className="link" onClick={() => setDate(todayStr())}>
              Về hôm nay
            </button>
          )}
        </div>
        <button className="btn-ghost" onClick={() => setDate(addDays(date, 1))}>
          →
        </button>
      </div>

      <div className="toolbar">
        <div className="view-switch">
          <button
            className={view === 'list' ? 'active' : ''}
            onClick={() => setView('list')}
          >
            ☰ Danh sách
          </button>
          <button
            className={view === 'timeline' ? 'active' : ''}
            onClick={() => setView('timeline')}
          >
            🕐 Khung giờ
          </button>
        </div>
        <div className="toolbar-right">
          {view === 'list' && tasks.length > 1 && (
            <button className="btn-ghost small" onClick={sortByTime}>
              ⇅ Theo giờ
            </button>
          )}
          {!notifOn && (
            <button className="btn-ghost small" onClick={enableNotif}>
              🔔 Bật nhắc
            </button>
          )}
          <button className="btn-primary small" onClick={() => setModal({})}>
            + Thêm việc
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {tasks.length > 0 && (
        <div className="progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="progress-text">
            {doneCount}/{tasks.length} việc ({pct}%)
          </span>
        </div>
      )}

      {loading ? (
        <p className="muted">Đang tải…</p>
      ) : tasks.length === 0 ? (
        <div className="empty">
          <div className="empty-emoji">🌤️</div>
          <p>Chưa có việc nào cho ngày này.</p>
          <button className="btn-primary" onClick={() => setModal({})}>
            + Thêm việc đầu tiên
          </button>
        </div>
      ) : view === 'list' ? (
        <ListView
          tasks={tasks}
          onToggle={toggleDone}
          onEdit={(t) => setModal(t)}
          onDelete={remove}
          onReorder={reorder}
        />
      ) : (
        <TimelineView
          tasks={tasks}
          onToggle={toggleDone}
          onEdit={(t) => setModal(t)}
          onDelete={remove}
          isToday={isToday}
          nowMinutes={now}
        />
      )}

      {modal && (
        <TaskModal
          initial={modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </main>
  );
}
