import { useState } from 'react';
import { colorHex, repeatLabel } from './constants.js';

// Danh sách việc, hỗ trợ kéo-thả để sắp xếp lại thứ tự.
export default function ListView({ tasks, onToggle, onEdit, onDelete, onReorder }) {
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);

  function handleDrop(targetId) {
    if (dragId == null || dragId === targetId) return cleanup();
    const ids = tasks.map((t) => t.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    onReorder(ids);
    cleanup();
  }

  function cleanup() {
    setDragId(null);
    setOverId(null);
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <li
          key={task.id}
          className={[
            'task',
            task.done ? 'done' : '',
            dragId === task.id ? 'dragging' : '',
            overId === task.id ? 'drag-over' : '',
          ].join(' ')}
          style={{ '--accent': colorHex(task.color) }}
          draggable
          onDragStart={() => setDragId(task.id)}
          onDragOver={(e) => {
            e.preventDefault();
            setOverId(task.id);
          }}
          onDrop={() => handleDrop(task.id)}
          onDragEnd={cleanup}
        >
          <span className="drag-handle" title="Kéo để sắp xếp">
            ⠿
          </span>
          <input
            type="checkbox"
            checked={task.done}
            onChange={() => onToggle(task)}
          />
          <div className="task-body" onClick={() => onEdit(task)}>
            <div className="task-title">{task.title}</div>
            <div className="task-meta">
              {(task.start_time || task.end_time) && (
                <span className="task-time">
                  🕒 {task.start_time || '…'}
                  {task.end_time ? ` – ${task.end_time}` : ''}
                </span>
              )}
              {task.repeat !== 'none' && (
                <span className="badge">🔁 {repeatLabel(task.repeat)}</span>
              )}
              {task.note && <span className="task-note">📝 {task.note}</span>}
            </div>
          </div>
          <button
            className="btn-del"
            onClick={() => onDelete(task)}
            title="Xoá"
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}
