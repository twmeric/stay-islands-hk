import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, Users, Check, ChevronDown, ChevronUp, Heart, Leaf, Waves, Fish, Sparkles, X } from 'lucide-react';
import { client } from '../api/client';

interface Retreat {
  id: string;
  name: string;
  nameZh: string;
  duration: string;
  location: string;
  audience: string;
  description: string;
  itinerary: { day: string; title: string; desc: string }[];
  priceNote: string;
  image: string;
  icon: React.ReactNode;
}

const retreats: Retreat[] = [
  {
    id: 'yoga-adventure',
    name: 'Yoga & Adventure Retreat',
    nameZh: '瑜伽與冒險靜修',
    duration: '8 天 7 晚',
    location: 'North Malé Atoll',
    audience: '瑜伽練習者、想要身心平衡的旅客',
    description: '每日晨間瑜伽、冥想，下午安排浮潛、無人島探險，晚上享受星空下的放鬆。',
    itinerary: [
      { day: 'Day 1', title: '抵達', desc: '迎賓晚餐、日落冥想' },
      { day: 'Day 2-6', title: '瑜伽與冒險', desc: '晨間瑜伽、活動體驗、自由時間' },
      { day: 'Day 7', title: '文化與告別', desc: '文化導覽、告別晚宴' },
      { day: 'Day 8', title: '離島', desc: '帶著平靜的心啟程' },
    ],
    priceNote: '按人數與房型報價',
    image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80',
    icon: <Leaf className="w-5 h-5" />,
  },
  {
    id: 'surf',
    name: 'Surf Retreat',
    nameZh: '衝浪靜修',
    duration: '8 天 7 晚',
    location: 'South Malé / Central Atolls',
    audience: '初學者到中級衝浪者',
    description: '由經驗豐富的衝浪教練帶領，前往馬爾代夫最佳浪點，學習、練習、享受海浪。',
    itinerary: [
      { day: 'Day 1', title: '適應日', desc: '抵達、浪況介紹、歡迎晚餐' },
      { day: 'Day 2-4', title: '浪點探索', desc: '每日兩次衝浪、教練指導' },
      { day: 'Day 5-6', title: '影片分析', desc: '動作檢討、自由衝浪' },
      { day: 'Day 7', title: '告別派對', desc: '最後一浪、海灘派對' },
      { day: 'Day 8', title: '離島', desc: '帶著新技巧回家' },
    ],
    priceNote: '按人數與房型報價',
    image: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&q=80',
    icon: <Waves className="w-5 h-5" />,
  },
  {
    id: 'couple',
    name: 'Couple Getaway',
    nameZh: '浪漫雙人假期',
    duration: '8 天 7 晚',
    location: 'North Malé Atoll',
    audience: '情侶、蜜月、週年紀念',
    description: '私人沙洲晚餐、雙人 SPA、日落巡航、無人島野餐，為兩人創造專屬回憶。',
    itinerary: [
      { day: 'Day 1', title: '浪漫抵達', desc: '房型浪漫布置、迎賓香檳' },
      { day: 'Day 2', title: '沙洲燭光晚餐', desc: '私人沙洲、專屬廚師' },
      { day: 'Day 3', title: '浮潛共游', desc: '與海龜和熱帶魚共游' },
      { day: 'Day 4', title: '雙人 SPA', desc: '海邊療程、放鬆身心' },
      { day: 'Day 5', title: '日落巡航', desc: '私人遊艇、海豚相伴' },
      { day: 'Day 6-7', title: '自由時光', desc: '無人島野餐、星空電影' },
      { day: 'Day 8', title: '離島', desc: '帶著回憶啟程' },
    ],
    priceNote: '按房型與服務報價',
    image: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&q=80',
    icon: <Heart className="w-5 h-5" />,
  },
  {
    id: 'fishing',
    name: 'Fishing Package',
    nameZh: '釣魚主題套餐',
    duration: '10 天 9 晚',
    location: '多個環礁',
    audience: '釣魚愛好者、團體',
    description: '從傳統夜釣到專業海釣，由當地漁夫帶領前往最佳釣點，體驗馬爾代夫的海洋文化。',
    itinerary: [
      { day: 'Day 1-2', title: '夜釣體驗', desc: '傳統釣法、船上晚餐' },
      { day: 'Day 3-5', title: '礁釣', desc: '環礁釣點、多樣魚種' },
      { day: 'Day 6-8', title: '深海釣', desc: '大魚挑戰、專業裝備' },
      { day: 'Day 9', title: '魚獲烹飪', desc: '主廚料理、本地島嶼探訪' },
      { day: 'Day 10', title: '離島', desc: '滿載回憶與故事' },
    ],
    priceNote: '按人數與釣點報價',
    image: 'https://images.unsplash.com/photo-1500514966906-fe245eea9344?w=800&q=80',
    icon: <Fish className="w-5 h-5" />,
  },
];

interface InquiryFormData {
  name: string;
  email: string;
  phone: string;
  retreat: string;
  checkIn: string;
  guests: number;
  notes: string;
}

function InquiryForm({
  retreat,
  onClose,
}: {
  retreat: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState<InquiryFormData>({
    name: '',
    email: '',
    phone: '',
    retreat,
    checkIn: '',
    guests: 2,
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await client.api.fetch('/api/public/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: null,
          name: form.name,
          email: form.email,
          phone: form.phone,
          message: `對 ${form.retreat} 有興趣，預計 ${form.checkIn || '未定'} 出發，${form.guests} 人。${form.notes ? `備註：${form.notes}` : ''}`,
          check_in: form.checkIn || null,
          guests: form.guests,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || '提交失敗，請稍後再試');
      }
    } catch (err) {
      console.error('Inquiry submit error:', err);
      setError('提交時發生錯誤，請檢查網絡連線');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#f0f9f7] rounded-2xl p-6 text-center"
      >
        <div className="w-12 h-12 rounded-full bg-[#2ec4b6] text-white flex items-center justify-center mx-auto mb-3">
          <Check className="w-6 h-6" />
        </div>
        <h4 className="text-lg font-bold text-[#0d1b2a] mb-1">我們已收到你的 Retreat 諮詢</h4>
        <p className="text-sm text-gray-600">專屬管家會在 24 小時內聯繫你。</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 text-sm text-[#0a4c6b] font-medium hover:underline"
        >
          關閉
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-[#0d1b2a]">諮詢此 Retreat</h4>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition"
          aria-label="關閉"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">感興趣的 Retreat</label>
        <input
          type="text"
          value={form.retreat}
          readOnly
          className="w-full border rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-600"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
          <input
            required
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a4c6b]"
            placeholder="您的姓名"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a4c6b]"
            placeholder="name@example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">電話／WhatsApp</label>
          <input
            required
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a4c6b]"
            placeholder="+852"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">預計日期</label>
          <input
            type="date"
            value={form.checkIn}
            onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
            className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a4c6b]"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">人數</label>
        <input
          required
          type="number"
          min={1}
          max={20}
          value={form.guests}
          onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })}
          className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a4c6b]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">備註（選填）</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a4c6b]"
          placeholder="請告訴我們你的特別需求或問題..."
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#B8902F] text-white py-3 rounded-xl font-semibold hover:bg-[#9a7a28] transition disabled:opacity-60"
      >
        {submitting ? '提交中...' : '送出諮詢'}
      </button>
    </form>
  );
}

export default function RetreatsPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expandedItinerary, setExpandedItinerary] = useState<string | null>(null);

  return (
    <div className="pt-20 pb-16">
      {/* Hero — Desktop */}
      <div className="relative hidden md:flex md:min-h-[600px] md:h-[75vh] items-end justify-center overflow-hidden pb-16">
        <img
          src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1920&q=80"
          alt="Maldives retreat and yoga"
          className="absolute inset-0 w-full h-full object-cover object-[35%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a4c6b]/95 via-[#0a4c6b]/40 to-[#0a4c6b]/10" />
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <p className="text-[#B8902F] font-medium mb-2 tracking-widest uppercase text-sm">Curated Retreats</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">主題靜修</h1>
          <p className="text-xl md:text-2xl text-white/90 mb-3">為自己、為愛人、為熱愛，設計一場專屬海島旅程。</p>
          <p className="text-white/70 max-w-2xl mx-auto">瑜伽、衝浪、浪漫、釣魚——每一個 Retreat 都是一次深度生活體驗。</p>
        </div>
      </div>

      {/* Hero — Mobile */}
      <section className="md:hidden min-h-screen flex flex-col bg-[#0d1b2a]">
        <div className="relative h-[55vh] w-full">
          <img
            src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1920&q=80"
            alt="Maldives retreat and yoga"
            className="w-full h-full object-cover object-[50%_35%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a4c6b]/40 via-transparent to-[#0d1b2a]" />
        </div>
        <div className="flex-1 flex items-center justify-center px-6 py-10 text-center text-white">
          <div className="max-w-xl">
            <p className="text-[#B8902F] font-medium mb-2 tracking-widest uppercase text-sm">Curated Retreats</p>
            <h1 className="text-4xl font-bold mb-4">主題靜修</h1>
            <p className="text-lg text-white/90 mb-3">為自己、為愛人、為熱愛，設計一場專屬海島旅程。</p>
            <p className="text-white/70">瑜伽、衝浪、浪漫、釣魚——每一個 Retreat 都是一次深度生活體驗。</p>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-[#2ec4b6] font-medium mb-2">深度，不只是天數</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0d1b2a] mb-6">把假期變成一場生活體驗</h2>
            <p className="text-gray-600 leading-relaxed">
              每一個 Retreat 都是為特定心情設計的旅程。你可以選擇在清晨瑜伽中醒來，
              也可以追逐最好的浪，或與愛人共享無人島的日落。我們會為你安排一切。
            </p>
          </motion.div>
        </div>
      </section>

      {/* Retreats Grid */}
      <section className="py-16 px-4 bg-[#f8fafb]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {retreats.map((retreat, i) => (
              <motion.div
                key={retreat.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img
                    src={retreat.image}
                    alt={retreat.nameZh}
                    className="w-full h-full object-cover hover:scale-105 transition duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute top-4 left-4 bg-[#B8902F] text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                    {retreat.icon}
                    <span>{retreat.name}</span>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-medium text-[#0a4c6b]">
                    {retreat.priceNote}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-[#0d1b2a] mb-2">{retreat.nameZh}</h3>
                  <p className="text-sm text-gray-500 mb-1">{retreat.name}</p>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4 text-[#2ec4b6]" />
                      <span>{retreat.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-[#2ec4b6]" />
                      <span>{retreat.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4 text-[#2ec4b6]" />
                      <span>適合：{retreat.audience}</span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mt-4 leading-relaxed">{retreat.description}</p>

                  {/* Collapsible Itinerary */}
                  <div className="mt-5 border-t border-gray-100 pt-4">
                    <button
                      onClick={() => setExpandedItinerary(expandedItinerary === retreat.id ? null : retreat.id)}
                      className="flex items-center gap-2 text-sm font-medium text-[#0a4c6b] hover:text-[#083d56] transition"
                    >
                      {expandedItinerary === retreat.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      每日行程概覽
                    </button>
                    <AnimatePresence>
                      {expandedItinerary === retreat.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 space-y-3">
                            {retreat.itinerary.map((item, idx) => (
                              <div key={idx} className="flex gap-3 text-sm">
                                <span className="font-semibold text-[#B8902F] min-w-[4.5rem]">{item.day}</span>
                                <div>
                                  <p className="font-medium text-[#0d1b2a]">{item.title}</p>
                                  <p className="text-gray-500 text-xs">{item.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    onClick={() => setActiveId(activeId === retreat.id ? null : retreat.id)}
                    className="w-full mt-6 bg-[#0a4c6b] text-white py-3 rounded-xl font-semibold hover:bg-[#083d56] transition"
                  >
                    {activeId === retreat.id ? '收起表單' : '諮詢此 Retreat'}
                  </button>

                  <AnimatePresence>
                    {activeId === retreat.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-6">
                          <InquiryForm retreat={retreat.name} onClose={() => setActiveId(null)} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / CTA */}
      <section className="py-16 px-4 bg-[#0d1b2a]">
        <div className="max-w-5xl mx-auto text-center text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              { icon: <Leaf className="w-8 h-8" />, title: '主題設計', desc: '每一個 Retreat 都有清晰的主題與節奏' },
              { icon: <Sparkles className="w-8 h-8" />, title: '彈性調整', desc: '依照你的體能與興趣微調行程' },
              { icon: <Heart className="w-8 h-8" />, title: '全程陪伴', desc: '從諮詢到離島，專屬管家隨行' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-[#B8902F] mb-3 flex justify-center">{item.icon}</div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-white/70 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          <p className="text-white/60 text-sm max-w-2xl mx-auto">
            Retreat 為客製化主題行程，實際天數、內容與價格會依照出發日期、人數與房型調整。
            我們會在收到諮詢後提供專屬方案。
          </p>
        </div>
      </section>
    </div>
  );
}
