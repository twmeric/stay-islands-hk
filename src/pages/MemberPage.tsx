import { Link } from 'react-router-dom';

export default function MemberPage() {
  return (
    <div className="min-h-screen pt-20 pb-16 bg-gradient-to-br from-[#f0f9f7] via-white to-[#e8f4f8] flex items-center justify-center">
      <div className="max-w-xl mx-auto px-4 text-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 sm:p-12 shadow-sm border border-white/50">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0a4c6b] to-[#2ec4b6] flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-2xl">🏝️</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0d1b2a] mb-4">
            會員中心即將開放
          </h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            成為海島業主的第一步，是先預約一次輕鬆的業主對話。
          </p>
          <Link
            to="/invest"
            className="inline-block bg-[#0a4c6b] text-white px-8 py-3 rounded-lg text-base font-medium hover:bg-[#083d56] transition"
          >
            預約業主對話
          </Link>
        </div>
      </div>
    </div>
  );
}
