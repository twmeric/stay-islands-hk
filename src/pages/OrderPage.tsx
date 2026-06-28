import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Calendar, Users, CreditCard, CheckCircle, XCircle, Clock, Hotel, DoorOpen } from 'lucide-react';
import { client } from '../api/client';

interface Payment {
  id: number;
  gateway: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: number;
}

interface OrderData {
  id: number;
  checkIn: number;
  checkOut: number;
  guests: number;
  totalAmount: number;
  currency: string;
  status: string;
  paymentStatus: string;
  supplierStatus: string;
  voucherCode: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  paidAt: number | null;
  confirmedAt: number | null;
  cancelledAt: number | null;
  customer?: {
    name: string | null;
    email: string;
    phone: string | null;
  } | null;
  property?: {
    nameZh: string;
    name: string;
    imageUrl: string | null;
    location: string | null;
  } | null;
  roomType?: {
    nameZh: string;
    name: string;
  } | null;
  payments?: Payment[];
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

const supplierStatusMap: Record<string, string> = {
  pending: '待確認',
  confirmed: '已確認',
  rejected: '已拒絕',
};

export default function OrderPage() {
  const { token } = useParams<{ token: string }>();
  const [order, setOrder] = useState<OrderData | null>(null);
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
        const res = await client.api.fetch(`/api/public/bookings/token/${encodeURIComponent(token)}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || '無法載入訂單');
        }
        const json = await res.json();
        setOrder(json.data || null);
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

  if (error || !order) {
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

  const nights = Math.max(1, Math.round((order.checkOut - order.checkIn) / 86400));

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
              <span className="text-white/80 text-sm">你的專屬訂單</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">訂單 #{order.id}</h1>
            <p className="text-white/70 text-sm">請妥善保存這條專屬連結，隨時回來查看訂單狀態。</p>
          </div>

          {/* Property */}
          {order.property && (
            <div className="p-6 md:p-8 border-b border-gray-100">
              <div className="flex flex-col md:flex-row gap-5">
                {order.property.imageUrl && (
                  <img
                    src={order.property.imageUrl}
                    alt={order.property.nameZh}
                    className="w-full md:w-40 h-32 object-cover rounded-2xl"
                  />
                )}
                <div>
                  <p className="text-sm text-[#B8902F] font-medium mb-1">{order.property.name}</p>
                  <h2 className="text-xl font-bold text-[#0d1b2a]">{order.property.nameZh}</h2>
                  {order.property.location && <p className="text-sm text-gray-500 mt-1">{order.property.location}</p>}
                  {order.roomType && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                      <DoorOpen className="w-4 h-4 text-[#2ec4b6]" />
                      <span>{order.roomType.nameZh}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Dates & Guests */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 md:p-8 border-b border-gray-100">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-[#2ec4b6] mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">入住日期</p>
                <p className="font-medium text-[#0d1b2a]">{new Date(order.checkIn * 1000).toLocaleDateString('zh-HK')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-[#2ec4b6] mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">退房日期</p>
                <p className="font-medium text-[#0d1b2a]">{new Date(order.checkOut * 1000).toLocaleDateString('zh-HK')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-[#2ec4b6] mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">人數 / 晚數</p>
                <p className="font-medium text-[#0d1b2a]">{order.guests} 位旅客 · {nights} 晚</p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="p-6 md:p-8 border-b border-gray-100">
            <h3 className="font-bold text-[#0d1b2a] mb-4">訂單狀態</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#f0f9f7] rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">訂單</p>
                <p className="font-bold text-[#0a4c6b]">{statusMap[order.status] || order.status}</p>
              </div>
              <div className="bg-[#f0f9f7] rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">付款</p>
                <p className="font-bold text-[#0a4c6b]">{paymentStatusMap[order.paymentStatus] || order.paymentStatus}</p>
              </div>
              <div className="bg-[#f0f9f7] rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">供應商</p>
                <p className="font-bold text-[#0a4c6b]">{supplierStatusMap[order.supplierStatus] || order.supplierStatus}</p>
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="p-6 md:p-8 border-b border-gray-100">
            <h3 className="font-bold text-[#0d1b2a] mb-4">聯絡資料</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">姓名：</span>{order.customer?.name || '—'}</p>
              <p><span className="text-gray-500">電郵：</span>{order.customer?.email || '—'}</p>
              <p><span className="text-gray-500">電話：</span>{order.customer?.phone || '—'}</p>
            </div>
          </div>

          {/* Payment summary */}
          <div className="p-6 md:p-8">
            <h3 className="font-bold text-[#0d1b2a] mb-4">款項摘要</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">訂單總額</span>
              <span className="text-xl font-bold text-[#0a4c6b]">HK${order.totalAmount.toLocaleString()}</span>
            </div>
            {order.paymentMethod && (
              <p className="text-sm text-gray-500 mb-4">付款方式：{order.paymentMethod}</p>
            )}
            {order.payments && order.payments.length > 0 && (
              <div className="space-y-2 mt-4">
                {order.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#2ec4b6]" />
                      <span>{new Date(p.createdAt * 1000).toLocaleDateString('zh-HK')}</span>
                    </div>
                    <span className="font-medium">HK${p.amount.toLocaleString()} · {p.status}</span>
                  </div>
                ))}
              </div>
            )}
            {order.voucherCode && (
              <div className="mt-4 p-4 bg-gradient-to-r from-[#0a4c6b] to-[#2ec4b6] rounded-xl text-white text-center">
                <p className="text-white/80 text-sm">電子憑證</p>
                <p className="text-2xl font-mono font-bold mt-1">{order.voucherCode}</p>
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
