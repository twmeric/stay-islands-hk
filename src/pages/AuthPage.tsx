import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { client } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, isAdmin, setUser, setAdminStatus } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate(isAdmin ? '/admin' : '/member');
  }, [user, isAdmin]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('請輸入電郵地址和密碼');
      return;
    }
    setLoading(true);
    try {
      const res = await client.api.fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok || !data.data) {
        setError(data.error || '登入失敗，請檢查電郵和密碼');
        return;
      }

      const { accessToken, refreshToken, admin } = data.data;
      localStorage.setItem('admin_access_token', accessToken);
      if (refreshToken) localStorage.setItem('admin_refresh_token', refreshToken);
      localStorage.setItem(
        'stayislands_user',
        JSON.stringify({ id: String(admin.id), email: admin.email, name: admin.name || '' })
      );

      setUser({ id: String(admin.id), email: admin.email, name: admin.name || '' });

      const adminRes = await client.api.fetch('/api/admin/check');
      const adminData = await adminRes.json();
      setAdminStatus(adminData.isAdmin, adminData.role);

      navigate(adminData.isAdmin ? '/admin' : '/member');
    } catch (err) {
      console.error(err);
      setError('登入時發生錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center pt-16 pb-16 bg-gradient-to-br from-[#f0f9f7] to-white px-4">
      <div className="w-full max-w-[420px]">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-[#0d1b2a] mb-1">歡迎回來</h1>
          <p className="text-sm text-gray-500 mb-6">登入以繼續管理後台</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">帳號</label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="輸入您的帳號"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="輸入您的密碼"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b]"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0a4c6b] text-white py-2.5 rounded-lg font-medium hover:bg-[#083d56] transition disabled:opacity-60"
            >
              {loading ? '登入中...' : '登入'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
