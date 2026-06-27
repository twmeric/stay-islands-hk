import { useEffect, useState } from 'react';
import { client } from '../../api/client';

interface DashboardData {
  totalInquiries: number;
  totalLeads: number;
  totalBookings: number;
  totalCustomers: number;
  totalRevenue: number;
  pendingInquiries: number;
  upcomingCheckIns: number;
  recentActivities: {
    id: number;
    adminId: number | null;
    action: string;
    targetTable: string;
    targetId: string | null;
    createdAt: number;
  }[];
}

export default function DashboardSection() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    setLoading(true);
    try {
      const res = await client.api.fetch('/api/admin/dashboard');
      const json = await res.json();
      setData(json.data || null);
    } catch (err) {
      setError('載入儀表板資料失敗');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-[#0a4c6b] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !data) {
    return <div className="bg-white rounded-2xl p-12 text-center text-red-500">{error || '無法載入資料'}</div>;
  }

  const stats = [
    { label: '總訂單', value: data.totalBookings, color: 'text-[#0a4c6b]' },
    { label: '總客戶', value: data.totalCustomers, color: 'text-[#2ec4b6]' },
    { label: '總諮詢', value: data.totalInquiries, color: 'text-[#B8902F]' },
    { label: '總潛在客', value: data.totalLeads, color: 'text-purple-600' },
    { label: '累積營業額', value: `HK$${data.totalRevenue.toLocaleString()}`, color: 'text-green-600' },
    { label: '待處理諮詢', value: data.pendingInquiries, color: 'text-red-500' },
    { label: '即將入住', value: data.upcomingCheckIns, color: 'text-blue-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="font-bold text-[#0d1b2a]">最近後台活動</h3>
        </div>
        <div className="divide-y">
          {data.recentActivities.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">暫無活動記錄</div>
          ) : (
            data.recentActivities.map((a) => (
              <div key={a.id} className="px-6 py-3 flex items-center justify-between text-sm hover:bg-gray-50">
                <div>
                  <span className="font-medium text-[#0d1b2a]">{a.action}</span>
                  <span className="text-gray-500 ml-2">{a.targetTable}{a.targetId ? ` #${a.targetId}` : ''}</span>
                </div>
                <span className="text-gray-400 text-xs">{new Date(a.createdAt * 1000).toLocaleString('zh-HK')}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
