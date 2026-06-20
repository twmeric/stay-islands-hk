import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { client } from '../api/client';

export default function Layout() {
  const { user, isAdmin, reset } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);

  async function handleLogout() {
    await client.auth.signOut();
    reset();
    navigate('/');
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/20">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="HK Islanders"
              className="w-9 h-9 rounded-full object-cover"
            />
            <span className="font-semibold text-[#0a4c6b] text-lg">HK Islanders</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/properties" className="text-gray-700 hover:text-[#0a4c6b] transition text-sm font-medium">度假物業</Link>
            <Link to="/invest" className="text-black hover:text-[#0a4c6b] transition text-sm font-medium">島主計劃</Link>
            <Link to="/guide" className="text-gray-700 hover:text-[#0a4c6b] transition text-sm font-medium">旅遊指南</Link>
            <Link to="/experiences" className="text-gray-700 hover:text-[#0a4c6b] transition text-sm font-medium">海島體驗</Link>
            <Link to="/retreats" className="text-gray-700 hover:text-[#0a4c6b] transition text-sm font-medium">主題 Retreats</Link>
            <Link to="/trip-planner" className="text-gray-700 hover:text-[#0a4c6b] transition text-sm font-medium">行程規劃</Link>
            {user ? (
              <div className="flex items-center gap-4">
                <Link to={isAdmin ? '/admin' : '/member'} className="text-gray-700 hover:text-[#0a4c6b] transition text-sm font-medium">
                  {isAdmin ? '管理中心' : '會員中心'}
                </Link>
                <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-600 transition">登出</button>
              </div>
            ) : (
              <Link to="/invest" className="bg-[#0a4c6b] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#083d56] transition">預約業主對話</Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenu ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-lg px-4 py-4 space-y-3">
            <Link to="/properties" onClick={() => setMobileMenu(false)} className="block text-gray-700 py-2">度假物業</Link>
            <Link to="/invest" onClick={() => setMobileMenu(false)} className="block text-black py-2">島主計劃</Link>
            <Link to="/guide" onClick={() => setMobileMenu(false)} className="block text-gray-700 py-2">旅遊指南</Link>
            <Link to="/experiences" onClick={() => setMobileMenu(false)} className="block text-gray-700 py-2">海島體驗</Link>
            <Link to="/retreats" onClick={() => setMobileMenu(false)} className="block text-gray-700 py-2">主題 Retreats</Link>
            <Link to="/trip-planner" onClick={() => setMobileMenu(false)} className="block text-gray-700 py-2">行程規劃</Link>
            {user ? (
              <>
                <Link to={isAdmin ? '/admin' : '/member'} onClick={() => setMobileMenu(false)} className="block text-gray-700 py-2">
                  {isAdmin ? '管理中心' : '會員中心'}
                </Link>
                <button onClick={() => { handleLogout(); setMobileMenu(false); }} className="block text-red-500 py-2">登出</button>
              </>
            ) : (
              <Link to="/invest" onClick={() => setMobileMenu(false)} className="block bg-[#0a4c6b] text-white px-4 py-2 rounded-lg text-center">預約業主對話</Link>
            )}
          </div>
        )}
      </header>

      {/* Main */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[#0d1b2a] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">HK Islanders</h3>
              <p className="text-gray-400 text-sm">專為香港旅客打造的馬爾代夫頂級度假體驗平台。</p>
            </div>
            <div>
              <h4 className="font-medium mb-3">快速連結</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <Link to="/properties" className="block hover:text-white transition">度假物業</Link>
                <Link to="/invest" className="block hover:text-white transition">海島業主計劃</Link>
                <Link to="/guide" className="block hover:text-white transition">旅遊指南</Link>
                <Link to="/experiences" className="block hover:text-white transition">海島體驗</Link>
                <Link to="/retreats" className="block hover:text-white transition">主題 Retreats</Link>
                <Link to="/trip-planner" className="block hover:text-white transition">行程規劃</Link>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">付款方式</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <p>Visa / Mastercard</p>
                <p>PayMe / FPS 轉數快</p>
                <p>AlipayHK / WeChat Pay HK</p>
                <p>Apple Pay / Google Pay</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">聯絡我們</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <p>WhatsApp: +852 9XXX XXXX</p>
                <p>Email: hello@stayislands.hk</p>
                <p>營業時間: 週一至週六 10:00-19:00</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>© 2026 HK Islanders. All rights reserved. 所有價格以港幣 (HKD) 結算。</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
