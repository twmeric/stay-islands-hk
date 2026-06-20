import { useState, useEffect } from 'react';
import { client } from '../api/client';
import { useAuthStore } from '../store/authStore';

interface AdminAccount {
  id: number;
  userId: string;
  email: string;
  role: string;
  createdAt: number;
}

export default function AdminPage() {
  const { adminRole } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'bookings' | 'inquiries' | 'properties' | 'accounts'>('bookings');
  const [bookings, setBookings] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replyId, setReplyId] = useState<number | null>(null);

  // Account management state
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'superadmin'>('admin');
  const [accountError, setAccountError] = useState('');
  const [accountSuccess, setAccountSuccess] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (activeTab === 'bookings') fetchBookings();
    else if (activeTab === 'inquiries') fetchInquiries();
    else if (activeTab === 'accounts') fetchAccounts();
  }, [activeTab]);

  async function fetchBookings() {
    setLoading(true);
    try {
      const res = await client.api.fetch('/api/admin/bookings');
      const data = await res.json();
      setBookings(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function fetchInquiries() {
    setLoading(true);
    try {
      const res = await client.api.fetch('/api/admin/inquiries');
      const data = await res.json();
      setInquiries(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function fetchAccounts() {
    setLoading(true);
    try {
      const res = await client.api.fetch('/api/admin/accounts');
      const data = await res.json();
      setAccounts(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function updateBookingStatus(id: number, status: string, paymentStatus: string) {
    try {
      await client.api.fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, paymentStatus }),
      });
      fetchBookings();
    } catch (err) { console.error(err); }
  }

  async function replyInquiry(id: number) {
    if (!replyText) return;
    try {
      await client.api.fetch(`/api/admin/inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminReply: replyText, status: 'replied' }),
      });
      setReplyText('');
      setReplyId(null);
      fetchInquiries();
    } catch (err) { console.error(err); }
  }

  async function addAdmin() {
    setAccountError('');
    setAccountSuccess('');
    if (!newEmail || !newEmail.includes('@')) {
      setAccountError('請輸入有效的電郵地址');
      return;
    }
    try {
      const res = await client.api.fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAccountError(data.error || '新增失敗');
        return;
      }
      setAccountSuccess(`已成功新增管理員：${newEmail}`);
      setNewEmail('');
      setNewRole('admin');
      fetchAccounts();
    } catch (err) {
      setAccountError('新增管理員時發生錯誤');
    }
  }

  async function deleteAdmin(id: number) {
    setAccountError('');
    setAccountSuccess('');
    try {
      const res = await client.api.fetch(`/api/admin/accounts/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setAccountError(data.error || '刪除失敗');
        setDeletingId(null);
        return;
      }
      setAccountSuccess('已成功移除管理員');
      setDeletingId(null);
      fetchAccounts();
    } catch (err) {
      setAccountError('刪除管理員時發生錯誤');
      setDeletingId(null);
    }
  }

  async function updateAdminRole(id: number, role: string) {
    setAccountError('');
    setAccountSuccess('');
    try {
      const res = await client.api.fetch(`/api/admin/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAccountError(data.error || '更新失敗');
        return;
      }
      setAccountSuccess('角色已更新');
      fetchAccounts();
    } catch (err) {
      setAccountError('更新角色時發生錯誤');
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-700',
  };

  const tabs = [
    { key: 'bookings', label: '訂單管理' },
    { key: 'inquiries', label: '旅客諮詢' },
    { key: 'properties', label: '房型庫存' },
    ...(adminRole === 'superadmin' ? [{ key: 'accounts', label: '帳戶管理' }] : []),
  ];

  return (
    <div className="pt-20 pb-16 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-[#0d1b2a] mb-2">後台管理</h1>
        <p className="text-sm text-gray-500 mb-6">角色：{adminRole === 'superadmin' ? '超級管理員' : '管理員'}</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${activeTab === tab.key ? 'bg-[#0a4c6b] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-[#0a4c6b] border-t-transparent rounded-full" /></div>
        ) : activeTab === 'bookings' ? (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">編號</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">入住/退房</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">人數</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">金額</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">狀態</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bookings.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">暫無訂單</td></tr>
                  ) : (
                    bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono">#{b.id}</td>
                        <td className="px-4 py-3">
                          <span>{new Date(b.checkIn * 1000).toLocaleDateString('zh-HK')}</span>
                          <span className="text-gray-400 mx-1">→</span>
                          <span>{new Date(b.checkOut * 1000).toLocaleDateString('zh-HK')}</span>
                        </td>
                        <td className="px-4 py-3">{b.guests}</td>
                        <td className="px-4 py-3 font-medium">HK${b.totalPrice?.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[b.status] || 'bg-gray-100'}`}>
                            {b.status === 'pending' ? '待處理' : b.status === 'confirmed' ? '已確認' : b.status === 'cancelled' ? '已取消' : '已完成'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {b.status === 'pending' && (
                            <div className="flex gap-2">
                              <button onClick={() => updateBookingStatus(b.id, 'confirmed', 'paid')} className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">確認</button>
                              <button onClick={() => updateBookingStatus(b.id, 'cancelled', 'refunded')} className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">拒絕</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'inquiries' ? (
          <div className="space-y-4">
            {inquiries.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center text-gray-500">暫無諮詢訊息</div>
            ) : (
              inquiries.map((inq) => (
                <div key={inq.id} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-[#0d1b2a]">{inq.subject}</h3>
                      <p className="text-sm text-gray-500">{inq.name} · {inq.email} {inq.phone && `· ${inq.phone}`}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inq.status === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {inq.status === 'new' ? '新訊息' : '已回覆'}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm mb-3">{inq.message}</p>
                  {inq.adminReply && (
                    <div className="bg-[#f0f9f7] rounded-lg p-3 mt-3">
                      <p className="text-xs text-gray-500 mb-1">管理員回覆：</p>
                      <p className="text-sm text-gray-700">{inq.adminReply}</p>
                    </div>
                  )}
                  {inq.status === 'new' && (
                    <div className="mt-3">
                      {replyId === inq.id ? (
                        <div className="space-y-2">
                          <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="輸入回覆..." />
                          <div className="flex gap-2">
                            <button onClick={() => replyInquiry(inq.id)} className="text-xs bg-[#0a4c6b] text-white px-3 py-1.5 rounded-lg hover:bg-[#083d56]">發送回覆</button>
                            <button onClick={() => { setReplyId(null); setReplyText(''); }} className="text-xs text-gray-500 hover:text-gray-700">取消</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setReplyId(inq.id)} className="text-xs text-[#0a4c6b] hover:underline">回覆</button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'accounts' ? (
          <div className="space-y-6">
            {/* Add new admin form */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-lg text-[#0d1b2a] mb-4">新增管理員</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="輸入管理員電郵地址"
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'admin' | 'superadmin')}
                  className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                >
                  <option value="admin">管理員</option>
                  <option value="superadmin">超級管理員</option>
                </select>
                <button
                  onClick={addAdmin}
                  className="bg-[#0a4c6b] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#083d56] transition whitespace-nowrap"
                >
                  新增
                </button>
              </div>
              {accountError && (
                <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{accountError}</p>
              )}
              {accountSuccess && (
                <p className="mt-3 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">{accountSuccess}</p>
              )}
            </div>

            {/* Admin accounts list */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h3 className="font-bold text-[#0d1b2a]">管理員帳戶列表</h3>
                <p className="text-xs text-gray-500 mt-1">共 {accounts.length} 個管理員帳戶</p>
              </div>
              <div className="divide-y">
                {accounts.length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-500">暫無管理員帳戶</div>
                ) : (
                  accounts.map((account) => (
                    <div key={account.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#0a4c6b]/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-[#0a4c6b]">
                              {account.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#0d1b2a] truncate">{account.email}</p>
                            <p className="text-xs text-gray-500">
                              新增於 {new Date(account.createdAt * 1000).toLocaleDateString('zh-HK')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <select
                          value={account.role}
                          onChange={(e) => updateAdminRole(account.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                        >
                          <option value="admin">管理員</option>
                          <option value="superadmin">超級管理員</option>
                        </select>
                        {deletingId === account.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => deleteAdmin(account.id)}
                              className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition"
                            >
                              確認刪除
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingId(account.id)}
                            className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                          >
                            移除
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4">房型庫存管理</h3>
            <p className="text-gray-500 text-sm mb-4">可透過 API 新增、修改房型庫存。當前系統已預設三個物業及五種房型。</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: '水上別墅', property: '御海閣', inventory: 5, price: 4800 },
                { name: '海灘別墅', property: '御海閣', inventory: 8, price: 3800 },
                { name: '皇家套房', property: '私享島嶼', inventory: 2, price: 12800 },
                { name: '花園客房', property: '碧海灣', inventory: 10, price: 2400 },
                { name: '珊瑚套房', property: '碧海灣', inventory: 4, price: 3200 },
              ].map((room, i) => (
                <div key={i} className="border rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#0d1b2a]">{room.name}</p>
                    <p className="text-xs text-gray-500">{room.property}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#0a4c6b]">HK${room.price.toLocaleString()}/晚</p>
                    <p className="text-xs text-gray-500">庫存: {room.inventory} 間</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
