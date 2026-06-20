export default function GuidePage() {
  return (
    <div className="pt-16">
      {/* Hero */}
      <div className="relative h-64 flex items-center justify-center overflow-hidden">
        <img src="https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1920&q=80" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#0a4c6b]/70" />
        <div className="relative z-10 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">香港人旅遊指南</h1>
          <p className="text-white/80">馬爾代夫自由行攻略</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: '飛行時間', value: '約 7-8 小時' },
            { label: '時差', value: '比香港慢 3 小時' },
            { label: '簽證', value: '落地簽 30 天' },
            { label: '貨幣', value: 'USD / MVR' },
          ].map((info, i) => (
            <div key={i} className="bg-[#f0f9f7] rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500">{info.label}</p>
              <p className="font-semibold text-[#0a4c6b] mt-1">{info.value}</p>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-[#0d1b2a] mb-4">✈️ 如何前往</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed">
                從香港出發，可選擇直航或經新加坡、斯里蘭卡轉機前往馬累（Malé）國際機場。
                直航航程約 7-8 小時。抵達馬累後，根據度假村位置，可乘坐水上飛機（約 30-60 分鐘）或快艇前往目的地島嶼。
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4">
                <p className="text-sm text-yellow-800 font-medium">💡 小貼士</p>
                <p className="text-sm text-yellow-700 mt-1">水上飛機通常只在日間運作（6:00-16:00），建議選擇早航班抵達馬累，以免需要在馬累過夜。</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#0d1b2a] mb-4">🏝️ 最佳旅遊季節</h2>
            <p className="text-gray-600 leading-relaxed">
              馬爾代夫全年適合旅遊，但最佳季節為 11 月至 4 月的乾季。此時天氣晴朗、海水能見度高，
              非常適合浮潛和潛水。5 月至 10 月為雨季，但通常只有短暫陣雨，價格也相對較低。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="border rounded-xl p-4">
                <h4 className="font-semibold text-[#0a4c6b] mb-2">旺季 (11月-4月)</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 天氣晴朗乾爽</li>
                  <li>• 海水能見度最佳</li>
                  <li>• 適合戶外活動</li>
                  <li>• 價格較高，建議提早預訂</li>
                </ul>
              </div>
              <div className="border rounded-xl p-4">
                <h4 className="font-semibold text-[#2ec4b6] mb-2">淡季 (5月-10月)</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 間中有短暫陣雨</li>
                  <li>• 價格較旺季低 20-40%</li>
                  <li>• 衝浪季節</li>
                  <li>• 鯨鯊出沒機率較高</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#0d1b2a] mb-4">💰 預算參考</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-xl overflow-hidden">
                <thead className="bg-[#f0f9f7]">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">項目</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">經濟</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">豪華</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr><td className="px-4 py-3">機票（來回）</td><td className="px-4 py-3">HK$4,000-6,000</td><td className="px-4 py-3">HK$12,000-25,000</td></tr>
                  <tr><td className="px-4 py-3">住宿（每晚）</td><td className="px-4 py-3">HK$2,000-4,000</td><td className="px-4 py-3">HK$8,000-20,000+</td></tr>
                  <tr><td className="px-4 py-3">接駁交通</td><td className="px-4 py-3">HK$500-1,500</td><td className="px-4 py-3">HK$3,000-5,000</td></tr>
                  <tr><td className="px-4 py-3">餐飲（每日）</td><td className="px-4 py-3">HK$500-800</td><td className="px-4 py-3">HK$1,500-3,000</td></tr>
                  <tr><td className="px-4 py-3">活動體驗</td><td className="px-4 py-3">HK$500-1,500/次</td><td className="px-4 py-3">HK$2,000-5,000/次</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#0d1b2a] mb-4">📋 出行必備清單</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { cat: '證件', items: ['護照（有效期6個月以上）', '機票確認單', '酒店預訂確認', '旅遊保險文件'] },
                { cat: '衣物', items: ['泳衣 2-3 套', '輕便夏季服裝', '防曬外套', '沙灘拖鞋'] },
                { cat: '裝備', items: ['防曬霜 SPF50+', '太陽眼鏡', '浮潛裝備（自備更衛生）', '防水手機殼'] },
                { cat: '其他', items: ['美元現金', '充電器/行動電源', '常用藥物', '驅蚊用品'] },
              ].map((group, i) => (
                <div key={i} className="border rounded-xl p-4">
                  <h4 className="font-semibold text-[#0a4c6b] mb-2">{group.cat}</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {group.items.map((item, j) => <li key={j}>☐ {item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#0d1b2a] mb-4">⚠️ 注意事項</h2>
            <div className="space-y-3">
              {[
                '馬爾代夫是伊斯蘭國家，在有人居住的島嶼上請穿著得體，避免過分暴露。度假村島嶼則沒有限制。',
                '嚴禁攜帶酒精飲品入境。度假村內可合法飲酒。',
                '保護珊瑚礁：請勿使用含化學成分的防曬霜，建議使用礁石友善型防曬。',
                '水上活動建議穿著救生衣，即使會游泳也建議配戴。',
                '手機漫遊費用較高，建議購買當地 SIM 卡或使用 eSIM。',
              ].map((note, i) => (
                <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-orange-500 text-lg">⚠️</span>
                  <p className="text-sm text-gray-700">{note}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
