import { useEffect, useRef, useState } from 'react';
import { api, saveAuth } from './api.js';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Auth({ onAuth }) {
  const btnRef = useRef(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Nhận credential từ Google rồi gửi lên server
  async function handleCredential(resp) {
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.googleLogin(resp.credential);
      saveAuth(token, user);
      onAuth(user);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!CLIENT_ID) {
      setError('Chưa cấu hình VITE_GOOGLE_CLIENT_ID (xem hướng dẫn).');
      return;
    }

    function renderBtn() {
      if (!window.google?.accounts?.id || !btnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredential,
      });
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: 'filled_blue',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        locale: 'vi',
        width: 280,
      });
    }

    // Nạp thư viện Google Identity Services một lần
    if (document.getElementById('gsi-script')) {
      renderBtn();
    } else {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.defer = true;
      s.id = 'gsi-script';
      s.onload = renderBtn;
      document.head.appendChild(s);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>🗓️ TKB</h1>
        <p className="subtitle">Lịch việc trong ngày của bạn</p>

        <div className="google-btn-wrap" ref={btnRef} />

        {loading && (
          <p className="muted" style={{ textAlign: 'center' }}>
            Đang đăng nhập…
          </p>
        )}
        {error && <div className="error">{error}</div>}

        <p className="hint">
          🔒 Không cần mật khẩu. Bạn chỉ cần đang đăng nhập Gmail trên thiết bị
          này là vào được — người khác không có quyền vào Gmail đó thì không đăng
          nhập được.
        </p>
      </div>
    </div>
  );
}
