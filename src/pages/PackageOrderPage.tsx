import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Calendar, Users, CreditCard, CheckCircle, XCircle, Clock, MapPin, Briefcase } from 'lucide-react';
import { client } from '../api/client';

interface PricingOption {
  type: 'shared' | 'single';
  label: string;
  price: number;
  currency: string;
}

interface Package {
  id: number;
  name: string;
  nameZh: string;
  slug: string;
  description: string | null;
  descriptionZh: string | null;
  duration: string | null;
  location: string | null;
  audience: string | null;
  inclusions: string[];
  itinerary: { day: string; title: string; desc: string }[];
  pricingOptions: PricingOption[];
  terms: string | null;
  imageUrl: string | null;
  gallery: string[];
  sortOrder: number;
  status: 'active' | 'inactive';
}

interface PackageBooking {
  id: number;
  packageId: number;
  package?: Package;
  customerName: string | null;
  customerEmail: string;
  customerPhone: string | null;
  checkIn: number;
  occupancy: 'shared' | 'single';
  guests: number;
  totalAmount: number;
  currency: string;
  status: string;
  paymentStatus: string;
  referralCode: string | null;
  token: string;
  createdAt: number;
}

const statusMap: Record<string, string> = {
  pending: '待處理',
  confirmed: '已確認',
  cancelled: '已取消',
  completed: '已完成',
};

const paymentStatusMap: Record<string, string> = {
  unpaid: '未付款',
  partial: '部分付款',
  paid: '已付款',
  refunded: '已退款',
};

export default function PackageOrderPage() {
  const { token } = useParams<{ token: string }>();
  const [booking, setBooking] = useState<PackageBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('連結不完整');
      setLoading(false);
      return;
    }
    async function load() {
      try {
        const res = await client.api.fetch(`/api/public/package-bookings/token/${encodeURIComponent(token)}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || '無法載入訂單');
        }
        const json = await res.json();
        setBooking(json.data || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '載入失敗');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  if (loading) {
    return (
      <div className="pt-32 pb-20 text-center text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
        <p>載入訂單中…</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="pt-32 pb-20 px-4 text-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[#0d1b2a] mb-2">無法顯示訂單</h1>
          <p className="text-gray-600">{error || '找不到這個訂單，請確認連結是否正確。'}</p>
        </div>
      </div>
    );
  }

  const pkg = booking.package;

  return (
    <div className="pt-24 pb-16 px-4 bg-[#f8fafb] min-h-screen">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#0a4c6b] text-white p-6 md:p-8">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-[#B8902F]" />
              <span className="text-white/80 text-sm">你的度假套餐訂單</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">訂單 #{booking.id}</h1>
            <p className="text-white/70 text-sm">請妥善保存這條專屬連結，隨時回來查看訂單狀態。</p>
          </div>

          {/* Package */}
          {pkg && (
            <div className="p-6 md:p-8 border-b border-gray-100">
              <div className="flex flex-col md:flex-row gap-5">
                {pkg.imageUrl && (
                  <img
                    src={pkg.imageUrl}
                    alt={pkg.nameZh}
                    className="w-full md:w-40 h-32 object-cover rounded-2xl"
                  />
                )}
                <div>
                  <p className="text-sm text-[#B8902F] font-medium mb-1">{pkg.name}</p>
                  <h2 className="text-xl font-bold text-[#0d1b2a]">{pkg.nameZh}</h2>
                  {pkg.location && <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {pkg.location}</p>}
                  {pkg.duration && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                      <Clock className="w-4 h-4 text-[#2ec4b6]" />
                      <span>{pkg.duration}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Dates & Occupancy */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 md:p-8 border-b border-gray-100">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-[#2ec4b6] mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">出發日期</p>
                <p className="font-medium text-[#0d1b2a]">{new Date(booking.checkIn * 1000).toLocaleDateString('zh-HK')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-[#2ec4b6] mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">房型</p>
                <p className="font-medium text-[#0d1b2a]">
                  {booking.occupancy === 'shared' ? '二人同房' : '單人房'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-[#2ec4b6] mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">人數</p>
                <p className="font-medium text-[#0d1b2a]">{booking.guests} 位旅客</p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="p-6 md:p-8 border-b border-gray-100">
            <h3 className="font-bold text-[#0d1b2a] mb-4">訂單狀態</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#f0f9f7] rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">訂單</p>
                <p className="font-bold text-[#0a4c6b]">{statusMap[booking.status] || booking.status}</p>
              </div>
              <div className="bg-[#f0f9f7] rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">付款</p>
                <p className="font-bold text-[#0a4c6b]">{paymentStatusMap[booking.paymentStatus] || booking.paymentStatus}</p>
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="p-6 md:p-8 border-b border-gray-100">
            <h3 className="font-bold text-[#0d1b2a] mb-4">聯絡資料</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">姓名：</span>{booking.customerName || '—'}</p>
              <p><span className="text-gray-500">電郵：</span>{booking.customerEmail || '—'}</p>
              <p><span className="text-gray-500">電話：</span>{booking.customerPhone || '—'}</p>
            </div>
          </div>

          {/* Payment summary */}
          <div className="p-6 md:p-8">
            <h3 className="font-bold text-[#0d1b2a] mb-4">款項摘要</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">訂單總額</span>
              <span className="text-xl font-bold text-[#0a4c6b]">
                {booking.currency === 'HKD' ? 'HK$' : booking.currency}{booking.totalAmount.toLocaleString()}
              </span>
            </div>
            {booking.referralCode && (
              <div className="mt-4 p-4 bg-gradient-to-r from-[#0a4c6b] to-[#2ec4b6] rounded-xl text-white text-center">
                <p className="text-white/80 text-sm">推薦碼</p>
                <p className="text-2xl font-mono font-bold mt-1">{booking.referralCode}</p>
              </div>
            )}
          </div>
        </motion.div>

        <p className="text-center text-gray-400 text-xs mt-8">
          如有疑問，請 WhatsApp 我們或電郵 hello@hkmaldivers.com
        </p>
      </div>
    </div>
  );
}
