import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { client } from '../api/client';
import { getRefCode } from '../lib/referral';

export default function HomePage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [retreats, setRetreats] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [leadEmail, setLeadEmail] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadError, setLeadError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [propsRes, expRes, retRes] = await Promise.all([
          client.api.fetch('/api/public/properties'),
          client.api.fetch('/api/public/experiences'),
          client.api.fetch('/api/public/retreats'),
        ]);
        const propsJson = await propsRes.json().catch(() => ({ data: [] }));
        const expJson = await expRes.json().catch(() => ({ data: [] }));
        const retJson = await retRes.json().catch(() => ({ data: [] }));
        setProperties(Array.isArray(propsJson.data) ? propsJson.data : []);
        setExperiences(Array.isArray(expJson.data) ? expJson.data : []);
        setRetreats(Array.isArray(retJson.data) ? retJson.data : []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setDataLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLeadError('');
    if (!leadEmail.trim().includes('@')) {
      setLeadError('請輸入有效的電郵地址');
      return;
    }
    try {
      const res = await client.api.fetch('/api/public/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: leadEmail.trim(),
          lead_type: 'inspiration_guide',
          source: 'homepage',
          referral_code: getRefCode(),
        }),
      });
      if (res.ok) {
        setLeadSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setLeadError(data.error || '提交失敗，請稍後再試');
      }
    } catch (err) {
      console.error(err);
      setLeadError('提交時發生錯誤');
    }
  }

  const activeProperties = properties.filter((p: any) => p.status === 'active').slice(0, 3);
  const activeExperiences = experiences.filter((e: any) => e.status === 'active');
  const activeRetreats = retreats.filter((r: any) => r.status === 'active');
  const featuredExperiences = [...activeExperiences, ...activeRetreats].slice(0, 3);

  return (
    <div>
      {/* Hero Section - Immersive */}
      <section className="relative min-h-screen flex flex-col overflow-hidden bg-[#0d1b2a] md:flex md:items-center md:justify-end">
        {/* Desktop background */}
        <div className="absolute inset-0 hidden md:block">
          <img
            src="https://images.unsplash.com/photo-1540202404-a2f29016b523?w=1920&q=80"
            alt="Maldives ocean"
            className="w-full h-full object-cover object-[35%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a4c6b]/50 via-[#0a4c6b]/20 to-[#0d1b2a]/70" />
          <div className="absolute inset-0 bg-gradient-to-l from-[#0d1b2a]/90 via-[#0a4c6b]/30 to-transparent" />
        </div>

        {/* Mobile top image */}
        <div className="relative w-full h-[55vh] md:hidden">
          <img
            src="https://images.unsplash.com/photo-1540202404-a2f29016b523?w=1920&q=80"
            alt="Maldives ocean"
            className="w-full h-full object-cover object-[50%_35%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a4c6b]/40 via-transparent to-[#0d1b2a]" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center w-full px-6 sm:px-8 md:mx-0 md:ml-auto md:mr-0 md:max-w-xl lg:max-w-2xl md:pl-8 md:pr-12 lg:pr-20 py-12 md:py-0 text-center md:text-right text-white bg-[#0d1b2a] md:bg-transparent">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-lg md:text-xl text-white/80 mb-4 tracking-widest uppercase"
          >
            專為香港旅客設計的海島假期
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-snug md:leading-tight"
          >
            <span className="md:hidden">你的馬爾代夫<br />從這裡開始</span>
            <span className="hidden md:inline">你的馬爾代夫<br />從這裡開始</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto md:mx-0"
          >
            <span className="block text-[#B8902F] font-semibold mb-1">精選度假村、私人海島體驗、主題 Retreats</span>
            <span className="block">一次為你而設的假期</span>
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center md:justify-end"
          >
            <Link
              to="/properties"
              className="bg-white text-[#0a4c6b] px-8 py-3 rounded-full font-semibold hover:bg-white/90 transition shadow-lg"
            >
              🏝️ 預訂你的島嶼假期
            </Link>
            <Link
              to="/experiences"
              className="bg-[#B8902F] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#9a7a28] transition shadow-lg"
            >
              ✨ 探索海島體驗
            </Link>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mt-4 text-sm text-white/70"
          >
            你預訂的每一晚，都是一次值得回來的開始。
          </motion.p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 flex flex-col items-center gap-2">
          <span className="text-xs tracking-wider">向下滾動探索</span>
          <div className="w-5 h-8 border-2 border-white/50 rounded-full flex items-start justify-center pt-1">
            <div className="w-1 h-2 bg-white/70 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* 開始規劃你的海島假期 — Travel CTA */}
      <section className="bg-[#0a4c6b] py-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-[#B8902F] font-medium mb-2 tracking-widest uppercase text-sm">屬於你的第一步</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">開始規劃你的海島假期</h2>
            <p className="text-white/70 mb-6">告訴我們你想怎麼度過這趟旅程，我們的管家會為你設計專屬行程。</p>
            <Link
              to="/plan"
              className="inline-block bg-[#B8902F] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#9a7a28] transition"
            >
              聯繫管家
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="bg-[#0d1b2a] py-4 px-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 text-white/90 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-[#B8902F] font-bold text-lg">1,240+</span>
            <span>組香港旅客已預約島嶼體驗</span>
          </div>
          <div className="hidden md:block w-px h-6 bg-white/20" />
          <div className="flex items-center gap-2">
            <span className="text-[#B8902F] font-bold text-lg">38%</span>
            <span>香港旅客選擇再次回來</span>
          </div>
          <div className="hidden md:block w-px h-6 bg-white/20" />
          <div className="flex items-center gap-2">
            <span className="text-[#B8902F] font-bold text-lg">4.9/5</span>
            <span>旅客願意再次回來</span>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-[#2ec4b6] font-medium mb-2">歡迎來到海島生活</p>
            <h2 className="text-4xl md:text-5xl font-bold text-[#0d1b2a] mb-6">HK Maldivers - 香港人的馬爾代夫假期管家</h2>
            <p className="text-gray-600 max-w-3xl mx-auto text-lg">
              我們相信，最好的假期不是去過多少地方，而是找到一個讓你願意一再回來的地方。
              HK Maldivers 為你預留每一次值得回來的假期。
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '✈️', title: '專屬行程定制', desc: '根據你的喜好量身打造每一段旅程' },
              { icon: '🏝️', title: '全程無憂管理', desc: '從機場接送到水上飛機，一切細節由我們處理' },
              { icon: '🤝', title: '本地資源網絡', desc: '連接最優質的體驗、夥伴和目的地' },
              { icon: '⭐', title: '值得信賴', desc: '對品質、透明度和溫暖的承諾贏得旅客信任' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6 rounded-2xl hover:bg-gray-50 transition"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-semibold text-lg mb-2 text-[#0d1b2a]">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Authority Endorsement */}
      <section className="py-20 px-4 bg-[#f8fafb]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-[#B8902F] font-medium mb-2">你的海島假期團隊</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0d1b2a]">從你出發那一刻起，就有人照顧你</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: '馬爾代夫島嶼管家', desc: '超過 15 年當地度假村管理經驗，記得你喜歡的咖啡與枕頭' },
              { title: '香港旅程顧問', desc: '從航班、水上飛機到私人接駁，為你安排好每一程' },
              { title: '專屬假期顧問', desc: '一對一陪伴你，從第一次諮詢到每一次出發，讓每趟旅程都順心' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0a4c6b] to-[#2ec4b6] mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white text-2xl">{['🏝️', '⚖️', '🤝'][i]}</span>
                </div>
                <h3 className="font-bold text-lg text-[#0d1b2a] mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Properties Preview */}
      <section className="py-24 px-4 bg-[#f8fafb]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#2ec4b6] font-medium mb-2">精選海島假期</p>
            <h2 className="text-4xl md:text-5xl font-bold text-[#0d1b2a] mb-4">選擇你的海島假期</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">先住進來，感受這個地方如何回應你。正確的假期會告訴你答案。</p>
          </div>
          {dataLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">載入住宿中…</p>
            </div>
          ) : activeProperties.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">暫無精選住宿。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {activeProperties.map((item: any, i: number) => (
                <motion.div
                  key={item.id || i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="group cursor-pointer"
                >
                  <div className="relative overflow-hidden rounded-2xl aspect-[4/3] mb-4">
                    <img src={item.imageUrl} alt={item.nameZh} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <p className="text-sm text-white/80">{item.name}</p>
                      <h3 className="text-xl font-bold">{item.nameZh}</h3>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-2">
                    <span className="text-sm text-gray-500">每晚起</span>
                    <span className="text-lg font-bold text-[#0a4c6b]">HK${Number(item.pricePerNight).toLocaleString()}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          <div className="text-center mt-12">
            <Link to="/properties" className="inline-flex items-center gap-2 bg-[#0a4c6b] text-white px-8 py-3 rounded-full font-medium hover:bg-[#083d56] transition">
              查看所有住宿
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Reciprocity: Free Inspiration Guide CTA */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-[#0a4c6b] to-[#0d1b2a] rounded-3xl p-8 md:p-12 text-white text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#B8902F]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <p className="text-[#B8902F] font-medium mb-2 tracking-widest uppercase text-sm">免費專屬資源</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">《馬爾代夫假期靈感指南》</h2>
              <p className="text-white/80 max-w-2xl mx-auto mb-8">
                不是旅遊攻略，而是一本幫你找到理想海島假期的靈感集。
                無需任何費用，寄送到你的電郵。
              </p>
              {leadSubmitted ? (
                <p className="text-white font-medium">我們已收到你的資料，靈感集將在 1 個工作天內寄出。</p>
              ) : (
                <form onSubmit={handleLeadSubmit} className="flex flex-col sm:flex-row gap-4 justify-center">
                  <input
                    type="email"
                    required
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="輸入您的電郵"
                    className="px-6 py-3 rounded-full text-gray-900 w-full sm:w-72 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8902F]"
                  />
                  <button type="submit" className="bg-[#B8902F] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#9a7a28] transition">
                    獲取免費靈感集
                  </button>
                </form>
              )}
              {leadError && <p className="text-red-200 text-xs mt-3">{leadError}</p>}
              <p className="text-white/50 text-xs mt-4">已有超過 800 位香港旅客收到這本靈感集</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Experiences Preview */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#2ec4b6] font-medium mb-2">深入海洋與島嶼文化</p>
            <h2 className="text-4xl md:text-5xl font-bold text-[#0d1b2a] mb-4">精選海島體驗</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">從單日海島體驗到多天主題靜修，每一項都由當地團隊客製安排。</p>
          </div>
          {dataLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">載入體驗中…</p>
            </div>
          ) : featuredExperiences.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">暫無精選體驗。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredExperiences.map((item: any, i: number) => (
                <motion.div
                  key={item.id || i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="group cursor-pointer"
                >
                  <div className="relative overflow-hidden rounded-2xl aspect-[4/3] mb-4">
                    <img src={item.imageUrl} alt={item.nameZh} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <p className="text-sm text-white/80">{item.nameZh || item.name}</p>
                      <h3 className="text-xl font-bold">{item.nameZh || item.name}</h3>
                    </div>
                  </div>
                  <div className="px-2">
                    <p className="text-sm text-[#B8902F] font-medium mb-1">{item.duration}</p>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.descriptionZh || item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          <div className="text-center mt-12">
            <Link to="/experiences" className="inline-flex items-center gap-2 bg-[#0a4c6b] text-white px-8 py-3 rounded-full font-medium hover:bg-[#083d56] transition">
              探索所有海島體驗
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 px-4 bg-[#f8fafb]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#2ec4b6] font-medium mb-2">專屬旅遊服務</p>
            <h2 className="text-4xl md:text-5xl font-bold text-[#0d1b2a]">一站式海島服務</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: '機場接送', desc: '由專人迎接，無縫銜接快艇或水上飛機', icon: '🚐' },
              { title: '水上飛機體驗', desc: '俯瞰珊瑚礁群島，享受視覺盛宴', icon: '✈️' },
              { title: '蜜月佈置', desc: '浪漫私人沙灘晚餐與特別驚喜', icon: '💕' },
              { title: '深海釣魚', desc: '在當地嚮導帶領下體驗傳統釣魚', icon: '🎣' },
              { title: '文化導覽', desc: '深入了解馬爾代夫的歷史與傳統', icon: '🏛️' },
              { title: '浮潛與潛水', desc: '探索色彩斑斕的珊瑚礁和海洋生物', icon: '🤿' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl border border-gray-100 hover:border-[#2ec4b6]/30 hover:shadow-lg transition"
              >
                <span className="text-3xl mb-4 block">{item.icon}</span>
                <h3 className="font-semibold text-lg mb-2 text-[#0d1b2a]">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof: Owner Stories */}
      <section className="py-24 px-4 bg-[#f8fafb]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-[#B8902F] font-medium mb-2">旅客真實故事</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0d1b2a]">他們本來只想度假，後來一再回來</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: '第三天早上，我坐在露台上，看著海龜從下面游過。那一刻我知道，我一定會再回來。',
                name: '陳先生',
                title: '45 歲，中環基金經理',
                unit: '御海閣常客',
                returnRate: '已回訪 4 次',
              },
              {
                quote: '我本來只打算度假。但當管家記得我女兒不吃芒果時，我感覺這裡已經像是我的家了。',
                name: '林女士',
                title: '52 歲，家族辦公室成員',
                unit: '私享島嶼常客',
                returnRate: '已回訪 6 次',
              },
              {
                quote: '整個過程沒有壓力，像禮賓服務一樣自然。到最後，我問的是：我什麼時候可以再回來？',
                name: '張先生',
                title: '38 歲，科技創業家',
                unit: '碧海灣常客',
                returnRate: '已回訪 3 次',
              },
            ].map((story, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
              >
                <p className="text-[#0a4c6b] font-medium text-lg mb-6 leading-relaxed">「{story.quote}」</p>
                <div className="border-t border-gray-100 pt-6">
                  <p className="font-bold text-[#0d1b2a]">{story.name}</p>
                  <p className="text-sm text-gray-500">{story.title}</p>
                  <p className="text-sm text-[#B8902F] font-medium mt-2">{story.unit}</p>
                  <p className="text-xs text-gray-400 mt-1">{story.returnRate}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Scarcity Banner */}
      <section className="py-6 px-4 bg-[#B8902F]">
        <div className="max-w-6xl mx-auto text-center text-white">
          <p className="text-sm md:text-base font-medium">
            這一季，<span className="font-bold text-lg">你的海島假期</span> 還在名單上 —
            <Link to="/properties" className="underline ml-1 hover:text-white/80">先來體驗一次</Link>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1920&q=80" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[#0a4c6b]/80" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">你的海島假期在等你</h2>
          <p className="text-lg text-white/80 mb-8">先住進來，感受這裡。感覺對了，你會想一再回來。所有價格以港幣結算，支援本地支付方式。</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/properties" className="bg-white text-[#0a4c6b] px-8 py-3 rounded-full font-semibold hover:bg-white/90 transition">
              選擇我的海島假期
            </Link>
            <Link to="/trip-planner" className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white/10 transition">
              規劃我的海島假期
            </Link>
          </div>

          {/* Travel agency license */}
          <div className="mt-12 flex flex-col items-center">
            <img
              src="/happy-day-logo.png"
              alt="HAPPY:DAY 悅假期"
              className="h-12 w-auto mb-3"
            />
            <p className="text-white/70 text-sm">由持牌旅行社 HAPPY:DAY 悅假期 為你安排</p>
            <p className="text-white/50 text-xs mt-1">旅行社牌照號碼：354018</p>
          </div>
        </div>
      </section>
    </div>
  );
}
