import { useEffect, useState } from 'react';
import { COLORS, REPEATS } from './constants.js';

// Form thêm hoặc sửa việc, hiển thị trong cửa sổ nổi (modal).
export default function TaskModal({ initial, onSave, onClose }) {
  const isEdit = !!initial?.id;
  const [title, setTitle] = useState(initial?.title || '');
  const [start, setStart] = useState(initial?.start_time || '');
  const [end, setEnd] = useState(initial?.end_time || '');
  const [note, setNote] = useState(initial?.note || '');
  const [color, setColor] = useState(initial?.color || 'indigo');
  const [repeat, setRepeat] = useState(initial?.repeat || 'none');
  const [error, setError] = useState('');

  // Đóng bằng phím Esc
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function submit(e) {
    e.preventDefault();
    if (!title.trim()) return setError('Hãy nhập tên việc');
    if (start && end && end < start)
      return setError('Giờ kết thúc phải sau giờ bắt đầu');
    onSave({
      title: title.trim(),
      start_time: start || null,
      end_time: end || null,
      note: note.trim() || null,
      color,
      repeat,
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <div className="modal-head">
          <h2>{isEdit ? 'Sửa việc' : 'Thêm việc mới'}</h2>
          <button type="button" className="btn-del" onClick={onClose}>
            ✕
          </button>
        </div>

        <label>Tên việc</label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Vd: Họp nhóm, Học tiếng Anh…"
        />

        <div className="row">
          <div className="col">
            <label>Bắt đầu</label>
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div className="col">
            <label>Kết thúc</label>
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
        </div>

        <label>Phân loại / màu</label>
        <div className="color-picker">
          {COLORS.map((c) => (
            <button
              type="button"
              key={c.key}
              className={`color-dot${color === c.key ? ' active' : ''}`}
              style={{ background: c.hex }}
              title={c.label}
              onClick={() => setColor(c.key)}
            />
          ))}
          <span className="color-name">
            {COLORS.find((c) => c.key === color)?.label}
          </span>
        </div>

        <label>Lặp lại</label>
        <div className="repeat-picker">
          {REPEATS.map((r) => (
            <button
              type="button"
              key={r.key}
              className={`chip${repeat === r.key ? ' active' : ''}`}
              onClick={() => setRepeat(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>

        <label>Ghi chú</label>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Tuỳ chọn…"
        />

        {error && <div className="error">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Huỷ
          </button>
          <button className="btn-primary">{isEdit ? 'Lưu' : 'Thêm'}</button>
        </div>
      </form>
    </div>
  );
}
