import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function InvestPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', vibe: '', property: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire to backend consultation endpoint after Cloudflare migration
    setSubmitted(true);
  }

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1688949078626-a358f500e063?w=1920&q=80"
            alt="Maldives private island"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#0a4c6b]/80" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
          <p className="text-[#B8902F] font-medium mb-2 tracking-widest uppercase text-sm">島主計劃</p>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">先體驗，後決定是否留下來。</h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8">
            成為島主，不是從簽約開始，而是從你第一次以島主的身份住進來開始。
            Stay Islands 為你預留一片海，讓感覺帶領你。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/properties"
              className="bg-white text-[#0a4c6b] px-8 py-3 rounded-full font-semibold hover:bg-white/90 transition"
            >
              選擇我的島嶼
            </Link>
            <a
              href="#consultation"
              className="bg-[#B8902F] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#9a7a28] transition"
            >
              我想先聊聊
            </a>
          </div>
        </div>
      </section>

      {/* Social Proof / Authority Bar */}
      <section className="bg-[#0d1b2a] py-6 px-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
          <div>
            <p className="text-2xl font-bold text-[#B8902F]">1,240+</p>
            <p className="text-sm text-white/70">組香港旅客已體驗島主生活</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#B8902F]">38</p>
            <p className="text-sm text-white/70">位香港島主已經留下來</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#B8902F]">15+ 年</p>
            <p className="text-sm text-white/70">當地島嶼管家經驗</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#B8902F]">全年</p>
            <p className="text-sm text-white/70">我們會照顧你的島嶼</p>
          </div>
        </div>
      </section>

      {/* Why Invest */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#2ec4b6] font-medium mb-2">島主視角</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0d1b2a]">擁有一座島嶼，是什麼感覺？</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🏝️', title: '這裡永遠是你的', desc: '每年回到同一個地方，管家記得你的名字、你的習慣、你喜歡的角落。' },
              { icon: '📈', title: '你不在時，它在為你工作', desc: '專業團隊代為管理與出租，讓你的島嶼在空閒時也持續被照顧。' },
              { icon: '💎', title: '留給下一代的資產', desc: '一片海、一個回憶、一個可以傳給家人的地方。' },
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
            <p className="text-[#B8902F] font-medium mb-2">島主之路</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0d1b2a]">四步，從旅客變成島主</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: '住進來', desc: '以島主的身份入住，感受這個地方如何回應你。' },
              { step: '02', title: '聊聊看', desc: '如果你開始想「每年回來」，我們會陪你聊聊這意味著什麼。' },
              { step: '03', title: '了解細節', desc: '只有在感覺對了之後，我們才會談結構、稅務與持有方式。' },
              { step: '04', title: '決定留下來', desc: '由專業團隊代為管理，你只需決定每年想回來多久。' },
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
              <h2 className="text-3xl md:text-4xl font-bold text-[#0d1b2a] mb-6">預約一次輕鬆的島主對話</h2>
              <p className="text-gray-600 mb-8">
                不是推銷，不是財務分析。我們只是想聽聽你理想的島嶼生活是什麼樣子，
                然後告訴你有哪些方式可以讓它發生。
              </p>
              <div className="bg-[#f8fafb] rounded-2xl p-6 border border-gray-100 mb-8">
                <h3 className="font-bold text-[#0d1b2a] mb-4">對話內容可能是</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2"><span className="text-[#2ec4b6]">✓</span> 你理想的島嶼節奏：熱鬧、私密、還是兩者兼具？</li>
                  <li className="flex items-start gap-2"><span className="text-[#2ec4b6]">✓</span> 你每年想回來多久？一個人、兩個人，還是一家人？</li>
                  <li className="flex items-start gap-2"><span className="text-[#2ec4b6]">✓</span> 如果你喜歡這裡，成為島主有哪些可能的路徑？</li>
                  <li className="flex items-start gap-2"><span className="text-[#2ec4b6]">✓</span> 如何安排一次島主體驗，讓感覺帶領你決定</li>
                </ul>
              </div>
              <div className="bg-[#0a4c6b] text-white rounded-2xl p-6">
                <p className="text-white/80 text-sm mb-1">本季開放對話名額</p>
                <p className="text-3xl font-bold">12 個</p>
                <p className="text-white/60 text-xs mt-2">本月已有 18 位香港旅客預約了島主對話</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-[#2ec4b6] text-white flex items-center justify-center text-2xl mx-auto mb-4">✓</div>
                  <h3 className="text-2xl font-bold text-[#0d1b2a] mb-2">對話邀請已收到</h3>
                  <p className="text-gray-600">我們的島主關係經理將在 1 個工作天內與你聯絡，先聽聽你的島嶼想像。</p>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">你理想的島嶼氛圍</label>
                    <select value={form.vibe} onChange={(e) => setForm({ ...form, vibe: e.target.value })} className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a4c6b]">
                      <option value="">請選擇</option>
                      <option value="private">完全私密，只屬於我和家人</option>
                      <option value="active">活動豐富，浮潛、釣魚、出海</option>
                      <option value="quiet">什麼都不做，只看海和睡覺</option>
                      <option value="family">適合全家，孩子也能盡情玩</option>
                      <option value="undecided">還不確定，想先體驗看看</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">有興趣的物業</label>
                    <select value={form.property} onChange={(e) => setForm({ ...form, property: e.target.value })} className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a4c6b]">
                      <option value="">請選擇</option>
                      <option value="mikado">御海閣 Stay Mikado</option>
                      <option value="private-island">私享島嶼 Private Island</option>
                      <option value="madivaru">碧海灣 Stay Madivaru</option>
                      <option value="undecided">尚未決定，希望獲得建議</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">留言（選填）</label>
                    <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a4c6b]" placeholder="請簡述您的投資目標或疑問..." />
                  </div>
                  <button type="submit" className="w-full bg-[#B8902F] text-white py-3 rounded-xl font-semibold hover:bg-[#9a7a28] transition">
                    預約島主對話
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
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-gray-500">
            成為島主涉及長期承諾與財務安排，所有物業資訊僅供參考。
            正式交易前請諮詢獨立法律、稅務及財務顧問。Stay Islands 提供的是體驗與資訊，並非投資建議。
          </p>
        </div>
      </section>
    </div>
  );
}
