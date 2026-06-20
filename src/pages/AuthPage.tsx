import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { client } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function AuthPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const authRenderedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const { user, setUser, setAdminStatus } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) { navigate('/dashboard'); return; }
    client.auth.getSession().then(session => {
      if (session.data?.user) {
        setUser({ id: session.data.user.id, email: session.data.user.email, name: session.data.user.name || '' });
        navigate('/dashboard');
      } else {
        setIsReady(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!isReady || authRenderedRef.current || !containerRef.current) return;
    authRenderedRef.current = true;
    client.auth.renderAuthUI(containerRef.current, {
      redirectTo: '/dashboard',
      labels: {
        signIn: {
          title: '歡迎回來',
          subtitle: '登入以繼續',
          emailPlaceholder: '輸入您的電郵地址',
          passwordPlaceholder: '輸入您的密碼',
          loginButton: '登入',
          forgotPassword: '忘記密碼？',
          signUpPrompt: '還沒有帳戶？',
          toggleToSignUp: '立即註冊',
        },
        signUp: {
          title: '建立帳戶',
          subtitle: '註冊以開始使用',
          signUpButton: '註冊',
          toggleToSignIn: '已有帳戶？',
        },
      },
      onLogin: async (user) => {
        setUser({ id: user.id, email: user.email, name: user.name || '' });
        // Check admin status after login
        try {
          const res = await client.api.fetch('/api/admin/check');
          const adminData = await res.json();
          setAdminStatus(adminData.isAdmin, adminData.role);
        } catch (err) {
          setAdminStatus(false, null);
        }
      },
    });
  }, [isReady]);

  if (!isReady) {
    return <div className="min-h-screen flex items-center justify-center pt-16"><div className="animate-spin w-8 h-8 border-2 border-[#0a4c6b] border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center pt-16 pb-16 bg-gradient-to-br from-[#f0f9f7] to-white px-4">
      <div className="w-full max-w-[420px]">
        <div ref={containerRef} />
      </div>
    </div>
  );
}
