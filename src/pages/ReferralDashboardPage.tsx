import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Copy, CheckCircle, Link as LinkIcon, CreditCard, Users } from 'lucide-react';
import { client } from '../api/client';

interface DashboardData {
  name: string;
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  pendingCommission: number;
  approvedCommission: number;
  paidCommission: number;
  recentOrders: Array<{
    bookingId: number;
    bookingToken: string | null;
    orderAmount: number;
    commissionAmount: number;
    status: string;
    createdAt: number;
  }>;
}

const statusMap: Record<string, string> = {
  pending: '待結算',
  approved: '已核准',
  paid: '已發放',
  cancelled: '已取消',
};

export default function ReferralDashboardPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('連結不完整');
      setLoading(false);
      return;
    }
    async function load() {
      try {
        const res = await client.api.fetch(`/api/referral/dashboard/${encodeURIComponent(token)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || '無法載入');
        setData(json.data || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '載入失敗');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  function copyLink() {
    if (!data?.referralLink) return;
    navigator.clipboard.writeText(data.referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="pt-32 pb-20 text-center text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
        <p>載入中…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="pt-32 pb-20 px-4 text-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <p className="text-red-500 font-medium mb-2">無法顯示資料</p>
          <p className="text-gray-600">{error || '連結無效或已過期。'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 px-4 bg-[#f8fafb] min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#0a4c6b] text-white p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-1">HK Maldivers 分享夥伴</h1>
            <p className="text-white/80">{data.name}，歡迎回來查看你的轉介結果。</p>
          </div>

          <div className="p-6 md:p-8 border-b border-gray-100">
            <label className="text-sm font-medium text-gray-700 mb-2 block">你的專屬分享連結</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 truncate flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-[#2ec4b6] shrink-0" />
                <span className="truncate">{data.referralLink}</span>
              </div>
              <button
                onClick={copyLink}
                className="bg-[#0a4c6b] hover:bg-[#083d56] text-white px-4 py-3 rounded-xl text-sm font-medium transition flex items-center gap-2"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? '已複製' : '複製'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">朋友透過此連結預約並付款後，你即可獲得回贈。</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 md:p-8 border-b border-gray-100">
            <div className="bg-[#f0f9f7] rounded-xl p-4 text-center">
              <Users className="w-5 h-5 text-[#2ec4b6] mx-auto mb-2" />
              <p className="text-xs text-gray-500">成交單數</p>
              <p className="text-xl font-bold text-[#0a4c6b]">{data.totalReferrals}</p>
            </div>
            <div className="bg-[#f0f9f7] rounded-xl p-4 text-center">
              <CreditCard className="w-5 h-5 text-[#2ec4b6] mx-auto mb-2" />
              <p className="text-xs text-gray-500">待結算回贈</p>
              <p className="text-xl font-bold text-[#0a4c6b]">HK${data.pendingCommission.toLocaleString()}</p>
            </div>
            <div className="bg-[#f0f9f7] rounded-xl p-4 text-center">
              <CreditCard className="w-5 h-5 text-[#2ec4b6] mx-auto mb-2" />
              <p className="text-xs text-gray-500">已核准回贈</p>
              <p className="text-xl font-bold text-[#0a4c6b]">HK${data.approvedCommission.toLocaleString()}</p>
            </div>
            <div className="bg-[#f0f9f7] rounded-xl p-4 text-center">
              <CreditCard className="w-5 h-5 text-[#2ec4b6] mx-auto mb-2" />
              <p className="text-xs text-gray-500">已發放回贈</p>
              <p className="text-xl font-bold text-[#0a4c6b]">HK${data.paidCommission.toLocaleString()}</p>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <h3 className="font-bold text-[#0d1b2a] mb-4">最近成交紀錄</h3>
            {data.recentOrders.length === 0 ? (
              <p className="text-sm text-gray-400">暫無成交紀錄</p>
            ) : (
              <div className="space-y-3">
                {data.recentOrders.map((o, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-[#0d1b2a]">訂單 #{o.bookingToken || o.bookingId}</p>
                      <p className="text-gray-500">{new Date(o.createdAt * 1000).toLocaleDateString('zh-HK')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-[#0a4c6b]">HK${o.commissionAmount.toLocaleString()}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        o.status === 'paid' ? 'bg-green-100 text-green-700' :
                        o.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                        o.status === 'cancelled' ? 'bg-gray-100 text-gray-600' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {statusMap[o.status] || o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-8">
          如有疑問，請 WhatsApp 我們或電郵 hello@hkmaldivers.com
        </p>
      </div>
    </div>
  );
}
