import { useState, useEffect } from 'react';
import { client } from '../api/client';
import { useAuthStore } from '../store/authStore';

interface Booking {
  id: number;
  propertyId: number;
  roomTypeId: number;
  checkIn: number;
  checkOut: number;
  guests: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  voucherCode: string | null;
  createdAt: number;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bookings' | 'vouchers'>('bookings');

  useEffect(() => { fetchBookings(); }, []);

  async function fetchBookings() {
    try {
      const res = await client.api.fetch('/api/bookings');
      const data = await res.json();
      setBookings(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function cancelBooking(id: number) {
    if (!confirm('確定要取消此預訂嗎？')) return;
    try {
      await client.api.fetch(`/api/bookings/${id}/cancel`, { method: 'PATCH' });
      fetchBookings();
    } catch (err) { console.error(err); }
  }

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '待處理', color: 'bg-yellow-100 text-yellow-700' },
    confirmed: { label: '已確認', color: 'bg-green-100 text-green-700' },
    cancelled: { label: '已取消', color: 'bg-red-100 text-red-700' },
    completed: { label: '已完成', color: 'bg-blue-100 text-blue-700' },
  };

  const paymentStatusMap: Record<string, { label: string; color: string }> = {
    unpaid: { label: '待付款', color: 'bg-orange-100 text-orange-700' },
    paid: { label: '已付款', color: 'bg-green-100 text-green-700' },
    refunded: { label: '已退款', color: 'bg-gray-100 text-gray-700' },
  };

  return (
    <div className="pt-20 pb-16 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0a4c6b] to-[#2ec4b6] flex items-center justify-center text-white text-xl font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0d1b2a]">{user?.name || '會員'}</h1>
              <p className="text-gray-500 text-sm">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab('bookings')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'bookings' ? 'bg-[#0a4c6b] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
            我的預訂
          </button>
          <button onClick={() => setActiveTab('vouchers')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'vouchers' ? 'bg-[#0a4c6b] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
            電子憑證
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-[#0a4c6b] border-t-transparent rounded-full" /></div>
        ) : activeTab === 'bookings' ? (
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center">
                <p className="text-gray-500 text-lg">暫時沒有預訂記錄</p>
                <p className="text-gray-400 text-sm mt-2">立即探索我們的度假物業，開始您的海島之旅！</p>
              </div>
            ) : (
              bookings.map((b) => {
                const status = statusMap[b.status] || { label: b.status, color: 'bg-gray-100 text-gray-700' };
                const payStatus = paymentStatusMap[b.paymentStatus] || { label: b.paymentStatus, color: 'bg-gray-100 text-gray-700' };
                return (
                  <div key={b.id} className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${payStatus.color}`}>{payStatus.label}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          入住: {new Date(b.checkIn * 1000).toLocaleDateString('zh-HK')} → 退房: {new Date(b.checkOut * 1000).toLocaleDateString('zh-HK')}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">旅客: {b.guests} 位 · 預訂編號: #{b.id}</p>
                        {b.voucherCode && <p className="text-sm text-[#2ec4b6] font-mono mt-1">憑證: {b.voucherCode}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-[#0a4c6b]">HK${b.totalPrice.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-1">建立於 {new Date(b.createdAt * 1000).toLocaleDateString('zh-HK')}</p>
                        {b.status === 'pending' && (
                          <button onClick={() => cancelBooking(b.id)} className="mt-2 text-xs text-red-500 hover:text-red-600">取消預訂</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.filter(b => b.voucherCode).length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center">
                <p className="text-gray-500">暫時沒有電子憑證</p>
              </div>
            ) : (
              bookings.filter(b => b.voucherCode).map((b) => (
                <div key={b.id} className="bg-gradient-to-r from-[#0a4c6b] to-[#2ec4b6] rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-sm">電子憑證</p>
                      <p className="text-2xl font-mono font-bold mt-1">{b.voucherCode}</p>
                      <p className="text-white/80 text-sm mt-2">
                        {new Date(b.checkIn * 1000).toLocaleDateString('zh-HK')} - {new Date(b.checkOut * 1000).toLocaleDateString('zh-HK')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold">HK${b.totalPrice.toLocaleString()}</p>
                      <p className="text-white/70 text-sm mt-1">預訂 #{b.id}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
