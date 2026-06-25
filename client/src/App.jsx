import { useEffect, useState } from 'react';
import { getUser, clearAuth } from './api.js';
import Auth from './Auth.jsx';
import Planner from './Planner.jsx';

export default function App() {
  const [user, setUser] = useState(getUser());
  const [theme, setTheme] = useState(
    () => localStorage.getItem('tkb_theme') || 'dark'
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('tkb_theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  function handleLogout() {
    clearAuth();
    setUser(null);
  }

  if (!user) {
    return (
      <>
        <ThemeButton theme={theme} onToggle={toggleTheme} floating />
        <Auth onAuth={setUser} />
      </>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>🗓️ Lịch việc trong ngày</h1>
        <div className="user-box">
          <ThemeButton theme={theme} onToggle={toggleTheme} />
          <span className="email">{user.email}</span>
          <button className="btn-ghost" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </header>
      <Planner />
    </div>
  );
}

function ThemeButton({ theme, onToggle, floating }) {
  return (
    <button
      className={`theme-btn${floating ? ' floating' : ''}`}
      onClick={onToggle}
      title={theme === 'dark' ? 'Chuyển sáng' : 'Chuyển tối'}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
