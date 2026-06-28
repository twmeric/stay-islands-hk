import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { client } from '../api/client';

export default function InvestPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', vibe: '', property: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await client.api.fetch('/api/public/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          lead_type: 'island_owner_talk',
          source: 'plan_page',
          metadata: {
            vibe: form.vibe,
            property: form.property,
            message: form.message,
          },
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        console.error('Lead submit failed:', await res.text());
      }
    } catch (err) {
      console.error('Lead submit error:', err);
    }
  }

  return (
    <div className="pt-16">
      {/* Hero — Desktop */}
      <section className="relative hidden md:block h-screen overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1688949078626-a358f500e063?w=1920&q=80"
            alt="Maldives private island"
            className="w-full h-full object-cover object-[70%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a4c6b]/95 via-[#0a4c6b]/40 to-transparent" />
        </div>
        <div className="relative z-10 h-full flex items-end px-6 lg:px-16 pb-16 lg:pb-24">
          <div className="max-w-2xl text-left text-white">
            <p className="text-[#B8902F] font-medium mb-2 tracking-widest uppercase text-sm">為你的海島假期，找到最適合的節奏</p>
            <h1 className="text-5xl lg:text-6xl font-bold mb-6">規劃你的專屬海島假期</h1>
            <p className="text-lg lg:text-xl text-white/90 max-w-xl mb-8">
              無論是第一次探索馬爾代夫，還是想為下一次旅程找到更私密的節奏，
              HK Maldivers 都陪你從一次對話開始，設計專屬行程。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-start">
              <Link
                to="/properties"
                className="bg-white text-[#0a4c6b] px-8 py-3 rounded-full font-semibold hover:bg-white/90 transition"
              >
                選擇我的海島假期
              </Link>
              <a
                href="#consultation"
                className="bg-[#B8902F] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#9a7a28] transition"
              >
                我想先聊聊
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Hero — Mobile */}
      <section className="md:hidden min-h-screen flex flex-col bg-[#0d1b2a]">
        <div className="h-[58vh] w-full relative">
          <img
            src="https://images.unsplash.com/photo-1688949078626-a358f500e063?w=1920&q=80"
            alt="Maldives private island"
            className="w-full h-full object-cover object-[50%_35%]"
          />
        </div>
        <div className="flex-1 flex items-center justify-center px-6 py-10 text-center text-white">
          <div className="max-w-xl">
            <p className="text-[#B8902F] font-medium mb-2 tracking-widest uppercase text-sm">為你的海島假期，找到最適合的節奏</p>
            <h1 className="text-4xl font-bold mb-6">規劃你的專屬海島假期</h1>
            <p className="text-lg text-white/90 mb-8">
              無論是第一次探索馬爾代夫，還是想為下一次旅程找到更私密的節奏，
              HK Maldivers 都陪你從一次對話開始，設計專屬行程。
            </p>
            <div className="flex flex-col gap-4">
              <Link
                to="/properties"
                className="bg-white text-[#0a4c6b] px-8 py-3 rounded-full font-semibold hover:bg-white/90 transition"
              >
                選擇我的海島假期
              </Link>
              <a
                href="#consultation"
                className="bg-[#B8902F] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#9a7a28] transition"
              >
                我想先聊聊
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Authority Bar */}
      <section className="bg-[#0d1b2a] py-6 px-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
          <div>
            <p className="text-2xl font-bold text-[#B8902F]">1,240+</p>
            <p className="text-sm text-white/70">組香港旅客已透過 HK Maldivers 體驗馬爾代夫</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#B8902F]">8+</p>
            <p className="text-sm text-white/70">年當地管家與營運經驗</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#B8902F]">15+ 年</p>
            <p className="text-sm text-white/70">當地度假村與管家經驗</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#B8902F]">全年</p>
            <p className="text-sm text-white/70">我們為你安排海島假期</p>
          </div>
        </div>
      </section>

      {/* Rental Proof / Demand Evidence */}
      <section className="bg-[#B8902F] py-10 px-4">
        <div className="max-w-5xl mx-auto text-center text-white">
          <p className="text-white/80 text-sm tracking-widest uppercase mb-4">旅客口碑</p>
          <h2 className="text-2xl md:text-3xl font-bold mb-8">持續被選擇，持續被記得</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="text-4xl md:text-5xl font-bold mb-2">73%</p>
              <p className="text-white/90 text-sm">過去 12 個月精選住宿平均入住率</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold mb-2">1,240+</p>
              <p className="text-white/90 text-sm">組香港旅客透過本平台展開海島假期</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold mb-2">4.9/5</p>
              <p className="text-white/90 text-sm">體驗住客願意再次回來並推薦</p>
            </div>
          </div>
          <p className="mt-8 text-white/80 text-sm max-w-2xl mx-auto">
            每一晚的預訂，都是這片海真實吸引力的證明。HK Maldivers 不只幫你找到合適的住宿，更陪你設計一段值得一再回來的假期。
          </p>
        </div>
      </section>

      {/* Why Invest */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#2ec4b6] font-medium mb-2">為什麼選擇我們</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0d1b2a]">為什麼香港旅客選擇 HK Maldivers？</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🏝️', title: '每次都像回家', desc: '回到同一個地方，管家記得你的名字、你的習慣、你喜歡的角落。' },
              { icon: '📅', title: '每次回來，都被記得', desc: '專屬管家記得你的名字、你的習慣、你喜歡的角落，讓每次旅程都更順心。' },
              { icon: '💎', title: '從假期到專屬回憶', desc: '當你開始想念這片海，我們會幫你計劃下一次更貼近你的旅程。' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl border border-gray-100 hover:border-[#0a4c6b]/20 hover:shadow-lg transition"
              >
                <span className="text-4xl mb-4 block">{item.icon}</span>
                <h3 className="font-bold text-xl mb-3 text-[#0d1b2a]">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 px-4 bg-[#f8fafb]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#B8902F] font-medium mb-2">海島假期設計之路</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0d1b2a]">四步，設計你的海島假期</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: '住進來', desc: '選一間讓你心动的住宿，真實感受這個地方如何回應你。' },
              { step: '02', title: '聊聊看', desc: '如果你開始想再次回來，我們會陪你聊聊有哪些客製化方式。' },
              { step: '03', title: '了解細節', desc: '感覺對了之後，我們會一起規劃行程、體驗與下一次的可能性。' },
              { step: '04', title: '決定你的節奏', desc: '無論是輕鬆度假，還是深入探索，我們都陪你找到最適合的節奏。' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-4xl font-bold text-[#0a4c6b]/20 mb-4">{item.step}</p>
                <h3 className="font-bold text-lg text-[#0d1b2a] mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Consultation Form */}
      <section id="consultation" className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-[#B8902F] font-medium mb-2">輕鬆對話</p>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0d1b2a] mb-6">預約一次輕鬆的海島諮詢</h2>
              <p className="text-gray-600 mb-8">
                不是推銷。我們只是想聽聽你理想的海島假期是什麼樣子，
                然後告訴你有哪些方式可以讓它發生。
              </p>
              <div className="bg-[#f8fafb] rounded-2xl p-6 border border-gray-100 mb-8">
                <h3 className="font-bold text-[#0d1b2a] mb-4">對話內容可能是</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2"><span className="text-[#2ec4b6]">✓</span> 你理想的海島假期節奏：熱鬧、私密、還是兩者兼具？</li>
                  <li className="flex items-start gap-2"><span className="text-[#2ec4b6]">✓</span> 你想停留多久？一個人、兩個人，還是一家人？</li>
                  <li className="flex items-start gap-2"><span className="text-[#2ec4b6]">✓</span> 如果你喜歡這裡，有哪些更深度的體驗方式？</li>
                  <li className="flex items-start gap-2"><span className="text-[#2ec4b6]">✓</span> 如何安排一次體驗，讓感覺帶領你的下一次旅程</li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-[#2ec4b6] text-white flex items-center justify-center text-2xl mx-auto mb-4">✓</div>
                  <h3 className="text-2xl font-bold text-[#0d1b2a] mb-2">諮詢邀請已收到</h3>
                  <p className="text-gray-600">我們的海島假期顧問將在 1 個工作天內與你聯絡，先聽聽你的海島假期想像。</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                    <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a4c6b]" placeholder="您的姓名" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">電郵</label>
                    <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a4c6b]" placeholder="name@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">電話</label>
                    <input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a4c6b]" placeholder="+852" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">你理想的海島假期氛圍</label>
                    <select value={form.vibe} onChange={(e) => setForm({ ...form, vibe: e.target.value })} className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a4c6b]">
                      <option value="">請選擇</option>
                      <option value="private">完全私密，只與家人好友共享</option>
                      <option value="active">活動豐富，浮潛、釣魚、出海</option>
                      <option value="quiet">什麼都不做，只看海和睡覺</option>
                      <option value="family">適合全家，孩子也能盡情玩</option>
                      <option value="undecided">還不確定，想先體驗看看</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">有興趣的住宿</label>
                    <select value={form.property} onChange={(e) => setForm({ ...form, property: e.target.value })} className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a4c6b]">
                      <option value="">請選擇</option>
                      <option value="mikado">Mikado</option>
                      <option value="private-island">Private Island</option>
                      <option value="madivaru">Madivaru</option>
                      <option value="undecided">尚未決定，希望獲得建議</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">留言（選填）</label>
                    <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a4c6b]" placeholder="請簡述您的海島假期想像或疑問..." />
                  </div>
                  <button type="submit" className="w-full bg-[#B8902F] text-white py-3 rounded-xl font-semibold hover:bg-[#9a7a28] transition">
                    預約海島諮詢
                  </button>
                  <p className="text-xs text-gray-500 text-center">無任何費用 · 你的資訊將保密處理</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 px-4 bg-[#f8fafb]">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <p className="text-xs text-gray-500">
            HK Maldivers 提供馬爾代夫旅遊規劃與諮詢服務，所有行程與價格會依照實際供應情況調整。
            我們會在收到諮詢後與你確認最新可用方案。
          </p>
        </div>
      </section>
    </div>
  );
}
