import { colorHex, repeatLabel } from './constants.js';

const HOUR_H = 56; // chiều cao mỗi giờ (px)

function toMin(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// Tính vị trí & chia cột cho các việc bị trùng giờ
function layout(tasks) {
  const items = tasks
    .filter((t) => t.start_time)
    .map((t) => {
      const s = toMin(t.start_time);
      let e = t.end_time ? toMin(t.end_time) : s + 30;
      if (e <= s) e = s + 30;
      return { task: t, s, e, col: 0, cols: 1 };
    })
    .sort((a, b) => a.s - b.s || a.e - b.e);

  let i = 0;
  while (i < items.length) {
    const cluster = [items[i]];
    let maxEnd = items[i].e;
    let j = i + 1;
    while (j < items.length && items[j].s < maxEnd) {
      cluster.push(items[j]);
      maxEnd = Math.max(maxEnd, items[j].e);
      j++;
    }
    const colEnds = [];
    for (const it of cluster) {
      let placed = false;
      for (let c = 0; c < colEnds.length; c++) {
        if (colEnds[c] <= it.s) {
          it.col = c;
          colEnds[c] = it.e;
          placed = true;
          break;
        }
      }
      if (!placed) {
        it.col = colEnds.length;
        colEnds.push(it.e);
      }
    }
    cluster.forEach((it) => (it.cols = colEnds.length));
    i = j;
  }
  return items;
}

export default function TimelineView({
  tasks,
  onToggle,
  onEdit,
  onDelete,
  isToday,
  nowMinutes,
}) {
  const events = layout(tasks);
  const untimed = tasks.filter((t) => !t.start_time);

  return (
    <div className="timeline-wrap">
      {untimed.length > 0 && (
        <div className="untimed">
          <div className="untimed-label">Không đặt giờ</div>
          {untimed.map((t) => (
            <button
              key={t.id}
              className={`untimed-chip${t.done ? ' done' : ''}`}
              style={{ '--accent': colorHex(t.color) }}
              onClick={() => onEdit(t)}
            >
              {t.title}
            </button>
          ))}
        </div>
      )}

      <div className="timeline" style={{ height: 24 * HOUR_H }}>
        {Array.from({ length: 24 }, (_, h) => (
          <div className="hour-row" key={h} style={{ height: HOUR_H }}>
            <span className="hour-label">{String(h).padStart(2, '0')}:00</span>
          </div>
        ))}

        {isToday && (
          <div
            className="now-line"
            style={{ top: (nowMinutes / 60) * HOUR_H }}
          >
            <span className="now-dot" />
          </div>
        )}

        <div className="tl-events">
          {events.map(({ task, s, e, col, cols }) => (
            <div
              key={task.id}
              className={`tl-event${task.done ? ' done' : ''}`}
              style={{
                top: (s / 60) * HOUR_H,
                height: Math.max(((e - s) / 60) * HOUR_H - 3, 20),
                left: `calc(${(col / cols) * 100}% + 2px)`,
                width: `calc(${(1 / cols) * 100}% - 4px)`,
                '--accent': colorHex(task.color),
              }}
              onClick={() => onEdit(task)}
              title={`${task.title} (${task.start_time}${
                task.end_time ? ' – ' + task.end_time : ''
              })`}
            >
              <div className="tl-event-head">
                <input
                  type="checkbox"
                  checked={task.done}
                  onClick={(ev) => ev.stopPropagation()}
                  onChange={() => onToggle(task)}
                />
                <span className="tl-title">{task.title}</span>
              </div>
              <div className="tl-time">
                {task.start_time}
                {task.end_time ? ` – ${task.end_time}` : ''}
                {task.repeat !== 'none' && ` · 🔁 ${repeatLabel(task.repeat)}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
