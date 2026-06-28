import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, MapPin, Users, Check, ChevronDown, ChevronUp, Loader2, XCircle, Calendar, CreditCard, Phone, Mail, User } from 'lucide-react';
import { client } from '../api/client';
import { normalizeHKPhone } from '../lib/phone';
import { getRefCode } from '../lib/referral';

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

export default function PackageDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking form state
  const [checkIn, setCheckIn] = useState('');
  const [occupancy, setOccupancy] = useState<'shared' | 'single'>('shared');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [bookingResult, setBookingResult] = useState<{ id: number; token: string } | null>(null);
  const [expandedItinerary, setExpandedItinerary] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!slug) {
        setError('連結不完整');
        setLoading(false);
        return;
      }
      try {
        const res = await client.api.fetch(`/api/public/packages/${encodeURIComponent(slug)}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || '無法載入套餐');
        }
        const json = await res.json();
        if (mounted) setPkg(json.data || null);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : '載入失敗');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [slug]);

  const selectedOption = useMemo(() => {
    return pkg?.pricingOptions?.find((o) => o.type === occupancy) || pkg?.pricingOptions?.[0];
  }, [pkg, occupancy]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pkg) return;
    setSubmitError('');
    setSubmitting(true);

    try {
      const normalizedPhone = normalizeHKPhone(phone);
      if (normalizedPhone.replace(/\D/g, '').length < 8) {
        throw new Error('請輸入有效的電話號碼');
      }
      if (!checkIn) throw new Error('請選擇出發日期');
      if (!name.trim() || !email.trim()) throw new Error('請填寫姓名與電郵');

      const checkInTs = Math.floor(new Date(checkIn).getTime() / 1000);
      const body = {
        package_id: pkg.id,
        check_in: checkInTs,
        occupancy,
        name: name.trim(),
        email: email.trim(),
        phone: normalizedPhone,
        referral_code: getRefCode(),
      };

      const res = await client.api.fetch('/api/public/package-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '提交失敗');
      setBookingResult(data.data || null);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '提交時發生錯誤');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="pt-32 pb-20 text-center text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
        <p>載入套餐中…</p>
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="pt-32 pb-20 px-4 text-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[#0d1b2a] mb-2">無法顯示套餐</h1>
          <p className="text-gray-600">{error || '找不到這個套餐，請確認連結是否正確。'}</p>
        </div>
      </div>
    );
  }

  const allImages = [pkg.imageUrl, ...pkg.gallery].filter(Boolean) as string[];
  const fallbackImage = 'https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?w=1920&q=80';

  return (
    <div className="pt-20 pb-16 bg-[#f8fafb]">
      {/* Hero */}
      <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        <img
          src={pkg.imageUrl || fallbackImage}
          alt={pkg.nameZh}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a4c6b]/90 via-[#0a4c6b]/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-6xl mx-auto text-white">
            <p className="text-[#B8902F] font-medium mb-2 tracking-widest uppercase text-sm">Vacation Package</p>
            <h1 className="text-3xl md:text-5xl font-bold mb-3">{pkg.nameZh}</h1>
            {pkg.nameZh !== pkg.name && <p className="text-white/80 text-lg mb-2">{pkg.name}</p>}
            <div className="flex flex-wrap gap-4 text-sm text-white/80">
              {pkg.duration && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> {pkg.duration}
                </span>
              )}
              {pkg.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> {pkg.location}
                </span>
              )}
              {pkg.audience && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> {pkg.audience}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100"
            >
              <h2 className="text-xl font-bold text-[#0d1b2a] mb-4">套餐介紹</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {pkg.descriptionZh || pkg.description || '暫無介紹'}
              </p>
            </motion.div>

            {/* Gallery */}
            {allImages.length > 1 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-[#0d1b2a] mb-4">圖片集</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {allImages.slice(1).map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`${pkg.nameZh} ${idx + 2}`}
                      className="w-full h-32 md:h-40 object-cover rounded-xl"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Inclusions */}
            {pkg.inclusions && pkg.inclusions.length > 0 && (
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-[#0d1b2a] mb-4">包含項目</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pkg.inclusions.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-gray-600">
                      <Check className="w-4 h-4 text-[#2ec4b6] mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Itinerary */}
            {pkg.itinerary && pkg.itinerary.length > 0 && (
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
                <button
                  onClick={() => setExpandedItinerary(!expandedItinerary)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h2 className="text-xl font-bold text-[#0d1b2a]">行程概覽</h2>
                  {expandedItinerary ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                {expandedItinerary && (
                  <div className="mt-4 space-y-4">
                    {pkg.itinerary.map((item, idx) => (
                      <div key={idx} className="flex gap-4 border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                        <span className="font-bold text-[#B8902F] min-w-[4.5rem]">{item.day}</span>
                        <div>
                          <p className="font-medium text-[#0d1b2a]">{item.title}</p>
                          <p className="text-gray-500 text-sm mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Terms */}
            {pkg.terms && (
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-[#0d1b2a] mb-4">條款與細則</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">{pkg.terms}</p>
              </div>
            )}
          </div>

          {/* Booking form sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                {bookingResult ? (
                  <div className="text-center py-6">
                    <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                      <Check className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold text-[#0d1b2a] mb-2">預訂已送出</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      訂單編號 #{bookingResult.id}<br />
                      我們會盡快確認並以電郵聯繫你。
                    </p>
                    <button
                      onClick={() => navigate(`/package-order/${bookingResult.token}`)}
                      className="w-full bg-[#0a4c6b] text-white py-3 rounded-xl font-semibold hover:bg-[#083d56] transition"
                    >
                      查看訂單
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="text-lg font-bold text-[#0d1b2a] mb-1">預訂此套餐</h3>
                    <p className="text-sm text-gray-500 mb-4">填寫資料，專屬管家會在 24 小時內聯繫你。</p>

                    {/* Check-in */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">出發日期</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="date"
                          value={checkIn}
                          onChange={(e) => setCheckIn(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a4c6b]"
                        />
                      </div>
                    </div>

                    {/* Occupancy */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">房型選擇</label>
                      <div className="space-y-2">
                        {pkg.pricingOptions?.map((opt) => (
                          <label
                            key={opt.type}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                              occupancy === opt.type
                                ? 'border-[#0a4c6b] bg-[#0a4c6b]/5'
                                : 'border-gray-200 hover:border-[#2ec4b6]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="occupancy"
                                value={opt.type}
                                checked={occupancy === opt.type}
                                onChange={(e) => setOccupancy(e.target.value as 'shared' | 'single')}
                              />
                              <span className="text-sm font-medium text-[#0d1b2a]">{opt.label}</span>
                            </div>
                            <span className="text-sm font-bold text-[#0a4c6b]">
                              {opt.currency === 'HKD' ? 'HK$' : opt.currency}{opt.price.toLocaleString()}
                            </span>
                          </label>
                        ))}
                        {(!pkg.pricingOptions || pkg.pricingOptions.length === 0) && (
                          <p className="text-sm text-gray-400">尚未設定價格選項</p>
                        )}
                      </div>
                    </div>

                    {/* Live total */}
                    {selectedOption && (
                      <div className="flex items-center justify-between bg-[#f0f9f7] rounded-xl px-4 py-3">
                        <span className="text-sm text-gray-600">套餐總額</span>
                        <span className="text-lg font-bold text-[#0a4c6b]">
                          {selectedOption.currency === 'HKD' ? 'HK$' : selectedOption.currency}
                          {selectedOption.price.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Contact */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          required
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a4c6b]"
                          placeholder="你的姓名"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">電郵</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          required
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a4c6b]"
                          placeholder="name@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">電話 / WhatsApp</label>
                      <div className="relative flex">
                        <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">
                          +852
                        </span>
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            required
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full border border-gray-200 rounded-r-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a4c6b]"
                            placeholder="98765432"
                          />
                        </div>
                      </div>
                    </div>

                    {submitError && <p className="text-sm text-red-600">{submitError}</p>}

                    <button
                      type="submit"
                      disabled={submitting || !selectedOption}
                      className="w-full bg-[#B8902F] text-white py-3 rounded-xl font-semibold hover:bg-[#9a7a28] transition disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      {submitting ? '提交中…' : '送出預訂'}
                    </button>

                    <p className="text-xs text-gray-400 text-center">
                      提交後會先產生待確認訂單，無需立即付款。
                    </p>
                  </form>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
