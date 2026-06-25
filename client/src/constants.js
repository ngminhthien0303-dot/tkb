// Bảng màu kiêm phân loại việc. key lưu vào DB, hex để hiển thị.
export const COLORS = [
  { key: 'indigo', label: 'Mặc định', hex: '#6366f1' },
  { key: 'rose', label: 'Quan trọng', hex: '#f43f5e' },
  { key: 'amber', label: 'Ưu tiên', hex: '#f59e0b' },
  { key: 'emerald', label: 'Cá nhân', hex: '#10b981' },
  { key: 'sky', label: 'Công việc', hex: '#0ea5e9' },
  { key: 'violet', label: 'Học tập', hex: '#8b5cf6' },
];

export function colorHex(key) {
  return (COLORS.find((c) => c.key === key) || COLORS[0]).hex;
}

export const REPEATS = [
  { key: 'none', label: 'Không lặp' },
  { key: 'daily', label: 'Hằng ngày' },
  { key: 'weekly', label: 'Hằng tuần' },
];

export function repeatLabel(key) {
  return (REPEATS.find((r) => r.key === key) || REPEATS[0]).label;
}
