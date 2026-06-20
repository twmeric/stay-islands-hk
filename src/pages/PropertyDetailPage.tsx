import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { client } from '../api/client';

interface RoomType {
  id: number;
  name: string;
  nameZh: string;
  description: string | null;
  descriptionZh: string | null;
  pricePerNight: number;
  maxGuests: number | null;
  inventory: number;
  imageUrl: string | null;
  amenities: string | null;
}

interface Property {
  id: number;
  name: string;
  nameZh: string;
  description: string | null;
  descriptionZh: string | null;
  location: string | null;
  pricePerNight: number;
  maxGuests: number | null;
  imageUrl: string | null;
  amenities: string | null;
  roomTypes: RoomType[];
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [viewMode, setViewMode] = useState<'guest' | 'investor'>('guest');
  const [saved, setSaved] = useState(false);

  // Experience inquiry form state
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryCheckIn, setInquiryCheckIn] = useState('');
  const [inquiryDays, setInquiryDays] = useState(3);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const demoProperty: Property = {
    id: Number(id) || 1,
    name: 'Stay Mikado',
    nameZh: '御海閣',
    description: 'A boutique overwater villa collection in the Maldives.',
    descriptionZh: '御海閣坐落於馬爾代夫清澈潟湖之上，提供私密而奢華的度假體驗。每棟水上別墅均配備私人泳池、玻璃地板與無邊際海景，並由專屬管家團隊提供全天候服務。',
    location: 'North Malé Atoll, Maldives',
    pricePerNight: 4800,
    maxGuests: 4,
    imageUrl: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80',
    amenities: JSON.stringify(['私人泳池', '水上飛機接送', '24 小時管家', '浮潛裝備', '海鮮晚餐', 'SPA']),
    roomTypes: [
      {
        id: 101,
        name: 'Lagoon Villa',
        nameZh: '潟湖別墅',
        description: 'Overwater villa with lagoon views.',
        descriptionZh: '坐擁潟湖美景的水上別墅，配備私人露台與下沉式沙發。',
        pricePerNight: 4800,
        maxGuests: 2,
        inventory: 3,
        imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600',
        amenities: JSON.stringify(['海景露台', '浴缸', '空調', 'Wi-Fi']),
      },
      {
        id: 102,
        name: 'Ocean Suite',
        nameZh: '海洋套房',
        description: 'Spacious suite with private pool.',
        descriptionZh: '寬敞海洋套房，設有私人無邊際泳池與獨立客廳。',
        pricePerNight: 7800,
        maxGuests: 4,
        inventory: 2,
        imageUrl: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600',
        amenities: JSON.stringify(['私人泳池', '客廳', '管家服務', '迎賓香檳']),
      },
    ],
  };

  async function fetchProperty() {
    try {
      const res = await client.api.fetch(`/api/public/properties/${id}`);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      if (data.data) {
        setProperty(data.data);
      } else {
        setProperty(demoProperty);
      }
    } catch (err) {
      console.error('Property fetch failed, using demo data:', err);
      setProperty(demoProperty);
    } finally {
      setLoading(false);
    }
  }

  function handleInquirySubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire to lead-capture API once EdgeSpark migration is complete
    console.log('Experience inquiry:', {
      propertyId: property!.id,
      roomTypeId: selectedRoom?.id,
      name: inquiryName,
      email: inquiryEmail,
      phone: inquiryPhone,
      checkIn: inquiryCheckIn || null,
      days: inquiryDays,
      message: inquiryMessage || null,
    });
    setInquirySubmitted(true);
  }

  if (loading) return <div className="pt-24 flex justify-center"><div className="animate-spin w-8 h-8 border-2 border-[#0a4c6b] border-t-transparent rounded-full" /></div>;
  if (!property) return <div className="pt-24 text-center text-gray-500">找不到此物業</div>;

  const amenities = property.amenities ? JSON.parse(property.amenities) : [];
  const referencePrice = selectedRoom ? selectedRoom.pricePerNight : property.pricePerNight;

  return (
    <div className="pt-16">
      {/* Hero Image */}
      <div className="relative h-[50vh] overflow-hidden">
        <img src={property.imageUrl || ''} alt={property.nameZh} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-8 left-8 text-white">
          <p className="text-white/80 text-sm">{property.location}</p>
          <h1 className="text-4xl font-bold">{property.nameZh}</h1>
          <p className="text-white/70">{property.name}</p>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 py-4">
            <button
              onClick={() => setViewMode('guest')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                viewMode === 'guest'
                  ? 'bg-[#0a4c6b] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🏝️ 旅客視角
            </button>
            <button
              onClick={() => setViewMode('investor')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                viewMode === 'investor'
                  ? 'bg-[#B8902F] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ✨ 海島業主視角
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-[#0d1b2a] mb-4">關於此物業</h2>
              <p className="text-gray-600 leading-relaxed">{property.descriptionZh}</p>
            </div>

            {/* Island Owner View: Life Preview */}
            {viewMode === 'investor' && (
              <div className="bg-gradient-to-br from-[#f8f5ed] to-[#fffdf8] border border-[#B8902F]/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[#B8902F] text-xl">✨</span>
                  <h2 className="text-2xl font-bold text-[#0d1b2a]">如果這裡成為你的海島之家</h2>
                </div>

                {/* Butler / Personal Touch */}
                <div className="flex items-start gap-3 bg-white rounded-xl p-4 border border-[#B8902F]/10 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#0a4c6b] flex items-center justify-center text-white text-sm font-bold">A</div>
                  <div>
                    <p className="text-sm text-gray-500">你的物業管家</p>
                    <p className="font-semibold text-[#0d1b2a]">Aisha</p>
                    <p className="text-gray-600 text-sm mt-1">「我已經為你記下了你喜歡的枕頭、咖啡，還有你希望早晨浮潛的時間。」</p>
                  </div>
                </div>

                {/* A Day in the Life */}
                <div className="space-y-4 mb-6">
                  <h3 className="font-bold text-[#0d1b2a]">你的一天，可能會是這樣</h3>
                  {[
                    { time: '07:00', desc: '在你的私人露台喝咖啡，看著海龜從玻璃地板下游過。' },
                    { time: '11:00', desc: '管家安排了一艘小船，送你到無人沙洲野餐。' },
                    { time: '15:00', desc: '在房子裡午睡，或者什麼都不做。' },
                    { time: '19:00', desc: '海灘上的私人晚餐，只有你和你的家人。' },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 bg-white rounded-xl p-4 border border-[#B8902F]/10">
                      <span className="text-[#B8902F] font-bold text-sm w-12 shrink-0">{item.time}</span>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  ))}
                </div>

                {/* What ownership quietly includes */}
                <div className="bg-white rounded-xl p-5 border border-[#B8902F]/10 mb-6">
                  <h3 className="font-bold text-[#0d1b2a] mb-3">當你不在的時候，我們會照顧它</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2"><span className="text-[#2ec4b6]">✓</span> 專業團隊代為管理與出租</li>
                    <li className="flex items-start gap-2"><span className="text-[#2ec4b6]">✓</span> 每年為你保留專屬入住時段</li>
                    <li className="flex items-start gap-2"><span className="text-[#2ec4b6]">✓</span> 物業維護、清潔、管家服務一應俱全</li>
                  </ul>
                </div>

                {/* Scarcity — experience, not investment */}
                <div className="bg-[#0a4c6b] text-white rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm">本季開放業主體驗的名額</p>
                      <p className="text-2xl font-bold">僅餘 2 組</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/80 text-sm">本月想先來體驗的旅客</p>
                      <p className="text-2xl font-bold">18</p>
                    </div>
                  </div>
                </div>

                {/* Social Proof */}
                <div className="flex items-start gap-3 bg-white rounded-xl p-4 border border-gray-100 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#0a4c6b] flex items-center justify-center text-white text-sm font-bold">陳</div>
                  <div>
                    <p className="text-gray-700 text-sm italic">「我本來只打算度假。第三天，我坐在露台上看海龜，突然想：為什麼不能每年回來？」</p>
                    <p className="text-xs text-gray-500 mt-1">陳先生，御海閣海島業主，2025 年入住</p>
                  </div>
                </div>

                {/* Commitment: Save to Vision List */}
                <button
                  onClick={() => setSaved(!saved)}
                  className={`w-full py-3 rounded-xl font-medium transition mb-3 ${
                    saved
                      ? 'bg-[#2ec4b6] text-white'
                      : 'bg-white border-2 border-[#B8902F] text-[#B8902F] hover:bg-[#B8902F]/5'
                  }`}
                >
                  {saved ? '✓ 已儲存到我的海島之家清單' : '💾 儲存到我的海島之家清單'}
                </button>

                {/* Soft CTA */}
                <button
                  onClick={() => navigate('/invest')}
                  className="w-full bg-[#B8902F] text-white py-3 rounded-xl font-medium hover:bg-[#9a7a28] transition"
                >
                  我想多了解成為海島業主的方式
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">沒有壓力，只是一次輕鬆的對話</p>
              </div>
            )}

            {amenities.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-[#0d1b2a] mb-4">設施與服務</h2>
                <div className="flex flex-wrap gap-3">
                  {amenities.map((a: string, i: number) => (
                    <span key={i} className="bg-[#f0f9f7] text-[#0a4c6b] px-4 py-2 rounded-full text-sm font-medium">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Room Types */}
            <div>
              <h2 className="text-2xl font-bold text-[#0d1b2a] mb-4">房型選擇</h2>
              <div className="space-y-4">
                {property.roomTypes.map((room) => {
                  const roomAmenities = room.amenities ? JSON.parse(room.amenities) : [];
                  return (
                    <div
                      key={room.id}
                      className={`border rounded-xl p-4 cursor-pointer transition ${selectedRoom?.id === room.id ? 'border-[#0a4c6b] bg-[#f0f9f7]' : 'border-gray-200 hover:border-[#2ec4b6]'}`}
                      onClick={() => setSelectedRoom(room)}
                    >
                      <div className="flex gap-4">
                        {room.imageUrl && (
                          <img src={room.imageUrl} alt={room.nameZh} className="w-32 h-24 object-cover rounded-lg" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-[#0d1b2a]">{room.nameZh}</h3>
                            <span className="font-bold text-[#0a4c6b]">HK${room.pricePerNight.toLocaleString()}/晚</span>
                          </div>
                          <p className="text-sm text-gray-500">{room.name}</p>
                          <p className="text-sm text-gray-600 mt-1">{room.descriptionZh}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>最多 {room.maxGuests} 位</span>
                            <span>剩餘 {room.inventory} 間</span>
                          </div>
                          {roomAmenities.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {roomAmenities.map((a: string, i: number) => (
                                <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{a}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Booking / Investment Sidebar */}
          <div className="lg:col-span-1">
            {viewMode === 'investor' ? (
              <div className="sticky top-20 bg-gradient-to-br from-[#f8f5ed] to-[#fffdf8] border border-[#B8902F]/20 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-bold text-[#0d1b2a] mb-4">你的業主體驗</h3>
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 border border-[#B8902F]/10">
                    <p className="text-sm text-gray-500 mb-1">體驗長度</p>
                    <p className="text-2xl font-bold text-[#0d1b2a]">由你決定</p>
                    <p className="text-xs text-gray-400 mt-1">從 3 晚起，到每年定期回來</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-[#B8902F]/10">
                    <p className="text-sm text-gray-500 mb-1">專屬管家</p>
                    <p className="text-2xl font-bold text-[#B8902F]">Aisha</p>
                    <p className="text-xs text-gray-400 mt-1">會記得你喜歡的一切</p>
                  </div>
                  <div className="bg-[#0a4c6b] text-white rounded-xl p-4">
                    <p className="text-white/80 text-sm">本季開放體驗名額</p>
                    <p className="text-2xl font-bold">僅餘 2 組</p>
                  </div>
                  <button
                    onClick={() => setSaved(!saved)}
                    className={`w-full py-3 rounded-xl font-medium transition ${
                      saved
                        ? 'bg-[#2ec4b6] text-white'
                        : 'bg-white border-2 border-[#B8902F] text-[#B8902F] hover:bg-[#B8902F]/5'
                    }`}
                  >
                    {saved ? '✓ 已儲存到我的海島之家清單' : '💾 儲存到我的海島之家清單'}
                  </button>
                  <button
                    onClick={() => navigate('/invest')}
                    className="w-full bg-[#B8902F] text-white py-3 rounded-xl font-medium hover:bg-[#9a7a28] transition"
                  >
                    我想多了解成為海島業主
                  </button>
                  <p className="text-xs text-gray-500 text-center">沒有壓力，只是一次輕鬆的對話</p>
                </div>
              </div>
            ) : (
              <div className="sticky top-20 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-bold text-[#0d1b2a] mb-4">預約你的海島之家體驗</h3>
                {inquirySubmitted ? (
                  <div className="bg-[#f0f9f7] border border-[#2ec4b6]/20 rounded-xl p-5 text-center">
                    <p className="text-[#0a4c6b] font-medium leading-relaxed">
                      我們已收到你的查詢，物業關係經理會在 1 個工作天內與你聯絡。
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                      <input
                        type="text"
                        required
                        value={inquiryName}
                        onChange={(e) => setInquiryName(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">電郵</label>
                      <input
                        type="email"
                        required
                        value={inquiryEmail}
                        onChange={(e) => setInquiryEmail(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">電話</label>
                      <input
                        type="tel"
                        required
                        value={inquiryPhone}
                        onChange={(e) => setInquiryPhone(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">預計入住日期（選填）</label>
                      <input
                        type="date"
                        value={inquiryCheckIn}
                        onChange={(e) => setInquiryCheckIn(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">想體驗的天數</label>
                      <select
                        required
                        value={inquiryDays}
                        onChange={(e) => setInquiryDays(Number(e.target.value))}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      >
                        {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>{n} 天</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">留言（選填）</label>
                      <textarea
                        value={inquiryMessage}
                        onChange={(e) => setInquiryMessage(e.target.value)}
                        rows={3}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        placeholder="告訴我們你想體驗什麼..."
                      />
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-500 mb-1">參考價格</p>
                      <p className="text-2xl font-bold text-[#0a4c6b]">
                        HK${referencePrice.toLocaleString()}
                        <span className="text-sm font-normal text-gray-500">/晚</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">實際價格將由物業關係經理確認</p>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#0a4c6b] text-white py-3 rounded-xl font-medium hover:bg-[#083d56] transition"
                    >
                      提交體驗查詢
                    </button>
                    <p className="text-xs text-gray-500 text-center">沒有壓力，只是一次輕鬆的對話</p>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
