// Lớp gọi API + lưu token đăng nhập trong localStorage.

const TOKEN_KEY = 'tkb_token';
const USER_KEY = 'tkb_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Có lỗi xảy ra');
  return data;
}

export const api = {
  register: (email, password) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  login: (email, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  listTasks: (date) => request(`/api/tasks?date=${date}`),

  createTask: (task) =>
    request('/api/tasks', { method: 'POST', body: JSON.stringify(task) }),

  updateTask: (id, patch) =>
    request(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  toggleTask: (id, date) =>
    request(`/api/tasks/${id}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ date }),
    }),

  reorderTasks: (ids) =>
    request('/api/tasks/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ ids }),
    }),

  deleteTask: (id) => request(`/api/tasks/${id}`, { method: 'DELETE' }),
};
