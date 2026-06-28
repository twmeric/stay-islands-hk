import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { client } from '../api/client';
import { getRefCode } from '../lib/referral';
import { normalizeHKPhone } from '../lib/phone';

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
  bedType: string | null;
  view: string | null;
  sizeSqm: number | null;
  occupancy: string | null;
  gallery: string | null;
  features: string | null;
}

interface Facility {
  icon: string;
  label: string;
}

interface Activity {
  image: string;
  name: string;
  description: string;
}

interface LocationDetails {
  description: string;
  mapImage: string;
  nearby: string[];
}

interface Story {
  title: string;
  content: string;
}

interface ExperienceItem {
  id: number;
  name: string;
  nameZh: string;
  slug: string;
  description: string | null;
  descriptionZh: string | null;
  duration: string | null;
  priceNote: string | null;
  imageUrl: string | null;
  type: 'experience' | 'retreat';
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
  gallery: string | null;
  facilities: string | null;
  locationDetails: string | null;
  story: string | null;
  roomTypes: RoomType[];
  experiences: ExperienceItem[];
  retreats: ExperienceItem[];
}

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function scrollToInquiry() {
  const el = document.getElementById('inquiry-form');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [selectedActivities, setSelectedActivities] = useState<ExperienceItem[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [roomGalleryIndex, setRoomGalleryIndex] = useState(0);

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

  useEffect(() => {
    setActiveImage(0);
  }, [property?.id]);

  useEffect(() => {
    setRoomGalleryIndex(0);
  }, [selectedRoom?.id]);

  const demoProperties: Record<number, Property> = {
    1: {
      id: 1,
      name: 'Stay Mikado',
      nameZh: '御海閣',
      description: 'A boutique overwater villa collection in the Maldives.',
      descriptionZh:
        '御海閣坐落於馬爾代夫清澈潟湖之上，提供私密而奢華的度假體驗。每棟水上別墅均配備私人泳池、玻璃地板與無邊際海景，並由專屬管家團隊提供全天候服務。',
      location: 'North Malé Atoll, Maldives',
      pricePerNight: 4800,
      maxGuests: 4,
      imageUrl:
        'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80',
      amenities: JSON.stringify([
        '私人泳池',
        '水上飛機接送',
        '24 小時管家',
        '浮潛裝備',
        '海鮮晚餐',
        'SPA',
      ]),
      gallery: JSON.stringify([
        'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
        'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80',
        'https://images.unsplash.com/photo-1544144433-d50aff500b91?w=800&q=80',
        'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
      ]),
      facilities: JSON.stringify([
        { icon: '🏊', label: '私人泳池' },
        { icon: '✈️', label: '水上飛機接送' },
        { icon: '🎩', label: '24 小時管家' },
        { icon: '🤿', label: '浮潛裝備' },
        { icon: '🦞', label: '海鮮晚餐' },
        { icon: '💆', label: 'SPA' },
        { icon: '🧘', label: '瑜伽亭' },
        { icon: '🏖️', label: '私人甲板' },
      ]),
      locationDetails: JSON.stringify({
        description:
          '御海閣位於 North Malé Atoll，距離馬累國際機場約 30 分鐘水上飛機航程，是馬爾代夫最經典的潟湖區域之一。',
        mapImage:
          'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&q=80',
        nearby: [
          '馬累國際機場：30 分鐘水上飛機',
          '著名潛點 Manta Point：約 20 分鐘船程',
          '當地漁村：約 15 分鐘快艇',
          '無人沙洲：約 10 分鐘快艇',
        ],
      }),
      story: JSON.stringify({
        title: '御海閣的故事',
        content:
          '御海閣誕生於一片被保育完好的潟湖之上，每一棟別墅都以馬爾代夫傳統工藝與現代極簡設計融合。創辦團隊希望每位客人不是「入住」一座度假村，而是回歸一片專屬於此刻的海洋。從日出時管家送來的咖啡，到深夜玻璃地板下緩緩游過的海龜，御海閣相信：真正的奢華，是讓時間慢下來。',
      }),
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
          imageUrl:
            'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600',
          amenities: JSON.stringify(['海景露台', '浴缸', '空調', 'Wi-Fi']),
          bedType: 'King',
          view: '潟湖景',
          sizeSqm: 120,
          occupancy: '2 位成人',
          gallery: JSON.stringify([
            'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
            'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80',
          ]),
          features: JSON.stringify(['私人露台', '玻璃地板', '下沉式沙發']),
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
          imageUrl:
            'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600',
          amenities: JSON.stringify(['私人泳池', '客廳', '管家服務', '迎賓香檳']),
          bedType: '2 King',
          view: '海洋景',
          sizeSqm: 220,
          occupancy: '4 位成人',
          gallery: JSON.stringify([
            'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80',
            'https://images.unsplash.com/photo-1544144433-d50aff500b91?w=800&q=80',
          ]),
          features: JSON.stringify(['私人無邊際泳池', '獨立客廳', '迎賓香檳']),
        },
      ],
      experiences: [],
      retreats: [],
    },
    2: {
      id: 2,
      name: 'Velaa Private',
      nameZh: '私享島嶼',
      description: 'An exclusive private island retreat for the ultimate privacy.',
      descriptionZh:
        '整座島嶼只為你與你的摯愛開放。這裡配備頂級私人管家、米其林主廚團隊與獨立高爾夫球場，是家族團聚、高端慶典與私密靜修的理想之地。',
      location: 'Noonu Atoll, Maldives',
      pricePerNight: 12800,
      maxGuests: 12,
      imageUrl:
        'https://images.unsplash.com/photo-1688949078626-a358f500e063?w=1200&q=80',
      amenities: JSON.stringify([
        '私人島嶼',
        '廚師團隊',
        '遊艇',
        '管家服務',
        'SPA',
        '私人影院',
      ]),
      gallery: JSON.stringify([
        'https://images.unsplash.com/photo-1688949078626-a358f500e063?w=1200&q=80',
        'https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?w=800&q=80',
        'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
        'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80',
        'https://images.unsplash.com/photo-1437719417032-8595fd9e9dc6?w=800&q=80',
        'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800&q=80',
      ]),
      facilities: JSON.stringify([
        { icon: '👨‍💼', label: '私人島嶼管家' },
        { icon: '👨‍🍳', label: '米其林主廚餐廳' },
        { icon: '⛳', label: '高爾夫球場' },
        { icon: '🚣', label: '水上運動中心' },
        { icon: '🧸', label: '兒童俱樂部' },
        { icon: '💒', label: '婚禮場地' },
        { icon: '🛥️', label: '私人遊艇' },
        { icon: '🎬', label: '私人影院' },
      ]),
      locationDetails: JSON.stringify({
        description:
          '私享島嶼坐落於 Noonu Atoll 的靜謐海域，這裡以豐富的海洋生態與原始珊瑚礁聞名，從馬累國際機場可乘內陸航班或水上飛機抵達。',
        mapImage:
          'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&q=80',
        nearby: [
          '馬累國際機場：約 45 分鐘水上飛機',
          '鯨鯊熱點：約 30 分鐘船程',
          '傳統漁村：約 20 分鐘快艇',
          '無人沙洲：約 10 分鐘快艇',
        ],
      }),
      story: JSON.stringify({
        title: '私享島嶼的故事',
        content:
          '這座島嶼的名字源於當地語言中的「海龜」。數十年來，這裡一直是綠蠵龜與玳瑁上岸產卵的秘境。經營團隊堅持只開放給極少數客人，並將大部分海岸線留給自然與保育。在私享島嶼，沒有「其他住客」，只有你的家人、朋友、管家，以及偶爾上岸產卵的海龜。',
      }),
      roomTypes: [
        {
          id: 201,
          name: 'Lagoon Villa',
          nameZh: '潟湖別墅',
          description: 'Overwater villa with lagoon views.',
          descriptionZh: '坐擁潟湖美景的水上別墅，配備私人露台與下沉式沙發。',
          pricePerNight: 12800,
          maxGuests: 2,
          inventory: 3,
          imageUrl:
            'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600',
          amenities: JSON.stringify(['海景露台', '浴缸', '空調', 'Wi-Fi']),
          bedType: 'King',
          view: '潟湖景',
          sizeSqm: 140,
          occupancy: '2 位成人',
          gallery: JSON.stringify([
            'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
            'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80',
          ]),
          features: JSON.stringify(['私人露台', '全景落地窗', '下沉式沙發']),
        },
        {
          id: 202,
          name: 'Ocean Suite',
          nameZh: '海洋套房',
          description: 'Spacious suite with private pool.',
          descriptionZh: '寬敞海洋套房，設有私人無邊際泳池與獨立客廳。',
          pricePerNight: 20800,
          maxGuests: 4,
          inventory: 2,
          imageUrl:
            'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600',
          amenities: JSON.stringify(['私人泳池', '客廳', '管家服務', '迎賓香檳']),
          bedType: '2 King',
          view: '海洋景',
          sizeSqm: 280,
          occupancy: '4 位成人',
          gallery: JSON.stringify([
            'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80',
            'https://images.unsplash.com/photo-1544144433-d50aff500b91?w=800&q=80',
          ]),
          features: JSON.stringify(['私人無邊際泳池', '獨立客廳', '迎賓香檳']),
        },
      ],
      experiences: [],
      retreats: [],
    },
    3: {
      id: 3,
      name: 'Azure Bay',
      nameZh: '碧海灣',
      description: 'Beachfront villas with direct reef access.',
      descriptionZh:
        '碧海灣是家庭與團體旅客的理想海濱別墅，設有私人海灘、共用泳池與完整廚房設備。這裡氛圍輕鬆自在，讓你像當地人一樣生活，同時享受馬爾代夫的絕美海景。',
      location: 'South Ari Atoll, Maldives',
      pricePerNight: 3200,
      maxGuests: 3,
      imageUrl:
        'https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?w=1200&q=80',
      amenities: JSON.stringify([
        '珊瑚礁',
        '浮潛',
        '海灘晚餐',
        '潛水中心',
        '日落巡航',
      ]),
      gallery: JSON.stringify([
        'https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?w=1200&q=80',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
        'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80',
        'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&q=80',
      ]),
      facilities: JSON.stringify([
        { icon: '🏖️', label: '私人海灘' },
        { icon: '🏊‍♀️', label: '共用泳池' },
        { icon: '🍳', label: '廚房設備' },
        { icon: '🔥', label: 'BBQ 區' },
        { icon: '🤿', label: '浮潛中心' },
        { icon: '🎮', label: '遊戲室' },
        { icon: '📽️', label: '海灘電影院' },
        { icon: '🚲', label: '自行車租借' },
      ]),
      locationDetails: JSON.stringify({
        description:
          '碧海灣位於 South Ari Atoll，這裡是馬爾代夫最著名的鯨鯊全年出沒熱點，從馬累國際機場出發約 25 分鐘內陸航班再加 15 分鐘快艇即可抵達。',
        mapImage:
          'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&q=80',
        nearby: [
          '馬累國際機場：約 25 分鐘內陸航班 + 15 分鐘快艇',
          '鯨鯊觀賞點：約 20 分鐘船程',
          '本地居民島：約 10 分鐘快艇',
          '珊瑚礁：步行可達',
        ],
      }),
      story: JSON.stringify({
        title: '碧海灣的故事',
        content:
          '碧海灣原為當地漁村家族世代守護的海岸。創辦人從小在這片海灘長大，熟悉每一處珊瑚礁與每一群魚的出沒時間。在改建別墅時，堅持保留原有的椰林、沙灘與礁石，並聘請當地漁民擔任嚮導。來到碧海灣，你會發現這裡不只有美景，還有與海洋共處數代人的溫度。',
      }),
      roomTypes: [
        {
          id: 301,
          name: 'Lagoon Villa',
          nameZh: '潟湖別墅',
          description: 'Overwater villa with lagoon views.',
          descriptionZh: '坐擁潟湖美景的水上別墅，配備私人露台與下沉式沙發。',
          pricePerNight: 3200,
          maxGuests: 2,
          inventory: 3,
          imageUrl:
            'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600',
          amenities: JSON.stringify(['海景露台', '浴缸', '空調', 'Wi-Fi']),
          bedType: 'King',
          view: '潟湖景',
          sizeSqm: 95,
          occupancy: '2 位成人',
          gallery: JSON.stringify([
            'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
            'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80',
          ]),
          features: JSON.stringify(['私人露台', '海景浴缸', '下沉式沙發']),
        },
        {
          id: 302,
          name: 'Ocean Suite',
          nameZh: '海洋套房',
          description: 'Spacious suite with private pool.',
          descriptionZh: '寬敞海洋套房，設有私人無邊際泳池與獨立客廳。',
          pricePerNight: 5200,
          maxGuests: 4,
          inventory: 2,
          imageUrl:
            'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600',
          amenities: JSON.stringify(['私人泳池', '客廳', '管家服務', '迎賓香檳']),
          bedType: '2 King',
          view: '海洋景',
          sizeSqm: 180,
          occupancy: '4 位成人',
          gallery: JSON.stringify([
            'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80',
            'https://images.unsplash.com/photo-1544144433-d50aff500b91?w=800&q=80',
          ]),
          features: JSON.stringify(['私人無邊際泳池', '獨立客廳', '迎賓香檳']),
        },
      ],
      experiences: [],
      retreats: [],
    },
  };

  const demoProperty = demoProperties[Number(id)] || demoProperties[1];

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

  async function handleInquirySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!property) return;

    const room = selectedRoom || property.roomTypes[0];
    if (!room) return;

    if (!inquiryCheckIn) {
      alert('請選擇預計入住日期');
      return;
    }
    const checkInDate = new Date(inquiryCheckIn);
    const checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkOutDate.getDate() + inquiryDays);

    const totalAmount =
      (room.pricePerNight || property.pricePerNight) * inquiryDays;

    try {
      const res = await client.api.fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inquiryName,
          email: inquiryEmail,
          phone: normalizeHKPhone(inquiryPhone),
          property_id: property.id,
          room_type_id: room.id,
          check_in: Math.floor(checkInDate.getTime() / 1000),
          check_out: Math.floor(checkOutDate.getTime() / 1000),
          guests: 1,
          total_amount: totalAmount,
          currency: 'HKD',
          addons: selectedActivities.map((a) => ({
            type: a.type,
            id: a.id,
            name: a.name,
            nameZh: a.nameZh,
          })),
          referral_code: getRefCode(),
        }),
      });
      if (!res.ok) {
        console.error('Booking submit failed:', await res.text());
        return;
      }
      setInquirySubmitted(true);
    } catch (err) {
      console.error('Booking submit error:', err);
    }
  }

  if (loading)
    return (
      <div className="pt-24 flex justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#0a4c6b] border-t-transparent rounded-full" />
      </div>
    );
  if (!property)
    return (
      <div className="pt-24 text-center text-gray-500">找不到此住宿</div>
    );

  const amenities = property.amenities ? JSON.parse(property.amenities) : [];
  const referencePrice = selectedRoom
    ? selectedRoom.pricePerNight
    : property.pricePerNight;

  const gallery = safeJsonParse<string[]>(property.gallery, []);
  const facilities = safeJsonParse<Facility[]>(property.facilities, []);
  const availableItems: ExperienceItem[] = [
    ...(property.experiences || []).map((e) => ({ ...e, type: 'experience' as const })),
    ...(property.retreats || []).map((r) => ({ ...r, type: 'retreat' as const })),
  ];
  const locationDetails = safeJsonParse<LocationDetails>(
    property.locationDetails,
    null
  );
  const story = safeJsonParse<Story>(property.story, null);

  return (
    <div className="pt-16">
      {/* Hero Image */}
      <div className="relative h-[50vh] overflow-hidden">
        <img
          src={property.imageUrl || ''}
          alt={property.nameZh}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-8 left-8 text-white">
          <p className="text-white/80 text-sm">{property.location}</p>
          <h1 className="text-4xl font-bold">{property.nameZh}</h1>
          <p className="text-white/70">{property.name}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Story */}
            {story && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-[#0d1b2a] mb-4 font-serif">
                  {story.title}
                </h2>
                <p className="text-gray-600 leading-relaxed italic">
                  {story.content}
                </p>
              </div>
            )}

            {/* Gallery */}
            {gallery.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-[#0d1b2a] mb-4 font-serif">
                  影像巡禮
                </h2>
                <div className="space-y-4">
                  <div className="aspect-[16/9] rounded-2xl overflow-hidden shadow-lg bg-gray-100">
                    <img
                      src={gallery[activeImage]}
                      alt={`${property.nameZh} gallery`}
                      className="w-full h-full object-cover transition duration-500"
                    />
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {gallery.map((src, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(i)}
                        className={`aspect-square rounded-xl overflow-hidden border-2 transition ${
                          activeImage === i
                            ? 'border-[#0a4c6b]'
                            : 'border-transparent hover:border-[#2ec4b6]'
                        }`}
                      >
                        <img
                          src={src}
                          alt={`${property.nameZh} thumbnail ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Room Types */}
            <div>
              <h2 className="text-2xl font-bold text-[#0d1b2a] mb-4 font-serif">
                房型選擇
              </h2>

              {/* Room Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {property.roomTypes.map((room) => {
                  const roomFeatures = safeJsonParse<string[]>(
                    room.features,
                    []
                  );
                  const isSelected = selectedRoom?.id === room.id;
                  return (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoom(room)}
                      className={`text-left bg-white rounded-2xl shadow-lg border overflow-hidden transition transform hover:-translate-y-1 ${
                        isSelected
                          ? 'border-[#0a4c6b] ring-2 ring-[#0a4c6b]/20'
                          : 'border-gray-100 hover:border-[#2ec4b6]'
                      }`}
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                        <img
                          src={
                            room.imageUrl || property.imageUrl || ''
                          }
                          alt={room.nameZh}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-5 space-y-3">
                        <div>
                          <h3 className="text-xl font-bold text-[#0d1b2a]">
                            {room.nameZh}
                          </h3>
                          <p className="text-sm text-gray-500">{room.name}</p>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                          {room.bedType && (
                            <span>床型：{room.bedType}</span>
                          )}
                          {room.view && <span>景觀：{room.view}</span>}
                          {room.sizeSqm && (
                            <span>面積：{room.sizeSqm} m²</span>
                          )}
                          {room.occupancy && (
                            <span>入住：{room.occupancy}</span>
                          )}
                        </div>
                        {roomFeatures.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {roomFeatures.slice(0, 3).map((feature, i) => (
                              <span
                                key={i}
                                className="text-xs bg-[#f0f9f7] text-[#0a4c6b] px-2 py-0.5 rounded"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-lg font-bold text-[#0a4c6b]">
                          HK${room.pricePerNight.toLocaleString()}
                          <span className="text-sm font-normal text-gray-500">
                            /晚
                          </span>
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Expanded Room Detail */}
              <AnimatePresence mode="wait">
                {selectedRoom && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden mt-8"
                  >
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
                      {(() => {
                        const room = selectedRoom;
                        const roomAmenities = safeJsonParse<string[]>(
                          room.amenities,
                          []
                        );
                        const roomFeatures = safeJsonParse<string[]>(
                          room.features,
                          []
                        );
                        const roomGallery = safeJsonParse<string[]>(
                          room.gallery,
                          [room.imageUrl || property.imageUrl || '']
                        );
                        return (
                          <div className="space-y-6">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="text-2xl font-bold text-[#0d1b2a]">
                                  {room.nameZh}
                                </h3>
                                <p className="text-gray-500">{room.name}</p>
                              </div>
                              <button
                                onClick={() => setSelectedRoom(null)}
                                className="text-sm text-gray-500 hover:text-[#0a4c6b] transition"
                              >
                                收起
                              </button>
                            </div>

                            {/* Room Gallery Carousel */}
                            {roomGallery.length > 0 && (
                              <div className="space-y-3">
                                <div className="aspect-[16/9] rounded-2xl overflow-hidden shadow-md bg-gray-100">
                                  <img
                                    src={roomGallery[roomGalleryIndex]}
                                    alt={`${room.nameZh} gallery`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                {roomGallery.length > 1 && (
                                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                    {roomGallery.map((src, i) => (
                                      <button
                                        key={i}
                                        onClick={() =>
                                          setRoomGalleryIndex(i)
                                        }
                                        className={`aspect-square rounded-xl overflow-hidden border-2 transition ${
                                          roomGalleryIndex === i
                                            ? 'border-[#0a4c6b]'
                                            : 'border-transparent hover:border-[#2ec4b6]'
                                        }`}
                                      >
                                        <img
                                          src={src}
                                          alt={`${room.nameZh} thumbnail ${i + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {room.descriptionZh && (
                              <p className="text-gray-600 leading-relaxed">
                                {room.descriptionZh}
                              </p>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              {roomAmenities.length > 0 && (
                                <div>
                                  <h4 className="font-bold text-[#0d1b2a] mb-2">
                                    設施
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {roomAmenities.map((a, i) => (
                                      <span
                                        key={i}
                                        className="text-sm bg-[#f0f9f7] text-[#0a4c6b] px-3 py-1 rounded-full"
                                      >
                                        {a}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {roomFeatures.length > 0 && (
                                <div>
                                  <h4 className="font-bold text-[#0d1b2a] mb-2">
                                    特色
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {roomFeatures.map((f, i) => (
                                      <span
                                        key={i}
                                        className="text-sm bg-[#f8f5ed] text-[#B8902F] px-3 py-1 rounded-full"
                                      >
                                        {f}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t pt-6">
                              <div>
                                <p className="text-sm text-gray-500">
                                  參考價格
                                </p>
                                <p className="text-3xl font-bold text-[#0a4c6b]">
                                  HK${room.pricePerNight.toLocaleString()}
                                  <span className="text-base font-normal text-gray-500">
                                    /晚
                                  </span>
                                </p>
                                <p className="text-sm text-gray-500">
                                  剩餘 {room.inventory} 間
                                </p>
                              </div>
                              <button
                                onClick={scrollToInquiry}
                                className="bg-[#B8902F] hover:bg-[#9a7a28] text-white px-8 py-3 rounded-xl font-medium transition"
                              >
                                選擇此房型
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>


            {/* Facilities */}
            {facilities.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-[#0d1b2a] mb-6 font-serif">
                  設施與服務
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {facilities.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-[#f0f9f7] rounded-xl p-4"
                    >
                      <span className="text-2xl">{f.icon}</span>
                      <span className="text-sm font-medium text-[#0d1b2a]">
                        {f.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activities */}
            {availableItems.length > 0 && (
              <div className="bg-[#f8fbfc] rounded-2xl border border-[#0a4c6b]/10 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-[#0d1b2a] mb-2 font-serif">
                      可加購的體驗
                    </h2>
                    <p className="text-gray-600">
                      點選有興趣的項目，會一併加入你的預約諮詢，專員會為你安排。
                    </p>
                  </div>
                  <span className="inline-flex items-center justify-center px-4 py-2 bg-[#0a4c6b] text-white rounded-full text-sm font-medium">
                    已選 {selectedActivities.length} 項
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {availableItems.map((a) => {
                    const isSelected = selectedActivities.some(
                      (sa) => sa.id === a.id && sa.type === a.type
                    );
                    return (
                      <button
                        key={`${a.type}-${a.id}`}
                        type="button"
                        onClick={() =>
                          setSelectedActivities((prev) =>
                            isSelected
                              ? prev.filter((sa) => !(sa.id === a.id && sa.type === a.type))
                              : [...prev, a]
                          )
                        }
                        className={`text-left bg-white rounded-2xl shadow-lg border overflow-hidden transition ${
                          isSelected
                            ? 'border-[#0a4c6b] ring-2 ring-[#0a4c6b]/20'
                            : 'border-gray-100 hover:border-[#2ec4b6]'
                        }`}
                      >
                        <div className="relative aspect-[16/10] overflow-hidden">
                          <img
                            src={a.imageUrl || '/images/placeholder.jpg'}
                            alt={a.nameZh || a.name}
                            className="w-full h-full object-cover"
                          />
                          {isSelected && (
                            <div className="absolute top-3 right-3 bg-[#0a4c6b] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                              ✓
                            </div>
                          )}
                          <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 text-[#0a4c6b]">
                            {a.type === 'retreat' ? '靜修' : '體驗'}
                          </span>
                        </div>
                        <div className="p-5">
                          <h3 className="font-bold text-[#0d1b2a] mb-2">
                            {a.nameZh || a.name}
                          </h3>
                          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                            {a.descriptionZh || a.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Location & Nearby */}
            {locationDetails && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-[#0d1b2a] mb-4 font-serif">
                  位置與週邊
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {locationDetails.description}
                </p>
                <div className="aspect-[16/9] rounded-2xl overflow-hidden shadow-md mb-6">
                  <img
                    src={locationDetails.mapImage}
                    alt={`${property.nameZh} 週邊地圖`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-bold text-[#0d1b2a] mb-3">週邊亮點</h3>
                <ul className="space-y-2">
                  {locationDetails.nearby.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-600">
                      <span className="text-[#2ec4b6] mt-1">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}


            {/* Inquiry CTA */}
            <div className="bg-gradient-to-br from-[#0a4c6b] to-[#0d1b2a] rounded-2xl p-8 sm:p-10 text-center text-white shadow-lg">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 font-serif">
                想預訂這趟海島假期？
              </h2>
              <p className="text-white/80 mb-6 max-w-xl mx-auto">
                與我們的管家聊聊，規劃一趟只屬於你的海島假期。
              </p>
              <button
                onClick={scrollToInquiry}
                className="inline-flex items-center justify-center bg-[#B8902F] hover:bg-[#9a7a28] text-white px-8 py-3 rounded-xl font-medium transition"
              >
                聯繫管家
              </button>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div
              id="inquiry-form"
              className="sticky top-20 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
            >
              <h3 className="text-xl font-bold text-[#0d1b2a] mb-4">
                預約你的海島假期
              </h3>
              {inquirySubmitted ? (
                <div className="bg-[#f0f9f7] border border-[#2ec4b6]/20 rounded-xl p-5 text-center">
                  <p className="text-[#0a4c6b] font-medium leading-relaxed">
                    我們已收到你的查詢，專屬管家會在 1 個工作天內與你聯絡。
                  </p>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      姓名
                    </label>
                    <input
                      type="text"
                      required
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      電郵
                    </label>
                    <input
                      type="email"
                      required
                      value={inquiryEmail}
                      onChange={(e) => setInquiryEmail(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      電話
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        +852
                      </span>
                      <input
                        type="tel"
                        required
                        value={inquiryPhone}
                        placeholder="98765432"
                        onChange={(e) => setInquiryPhone(e.target.value)}
                        className="flex-1 border rounded-r-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      預計入住日期 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={inquiryCheckIn}
                      onChange={(e) => setInquiryCheckIn(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      想體驗的天數
                    </label>
                    <select
                      required
                      value={inquiryDays}
                      onChange={(e) => setInquiryDays(Number(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    >
                      {Array.from({ length: 14 }, (_, i) => i + 1).map(
                        (n) => (
                          <option key={n} value={n}>
                            {n} 天
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      留言（選填）
                    </label>
                    <textarea
                      value={inquiryMessage}
                      onChange={(e) => setInquiryMessage(e.target.value)}
                      rows={3}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="告訴我們你的住宿需求或特別安排..."
                    />
                  </div>

                  {selectedActivities.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        已選加購項目
                      </label>
                      <div className="space-y-2">
                        {selectedActivities.map((a) => (
                          <div
                            key={`${a.type}-${a.id}`}
                            className="flex items-center justify-between bg-[#f0f9f7] rounded-lg px-3 py-2 text-sm"
                          >
                            <span className="text-[#0a4c6b] font-medium">
                              {a.nameZh || a.name}
                              <span className="ml-2 text-xs text-gray-500">
                                ({a.type === 'retreat' ? '靜修' : '體驗'})
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedActivities((prev) =>
                                  prev.filter((sa) => !(sa.id === a.id && sa.type === a.type))
                                )
                              }
                              className="text-gray-400 hover:text-red-500 transition"
                              aria-label="移除"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-500 mb-1">參考價格</p>
                    <p className="text-2xl font-bold text-[#0a4c6b]">
                      HK${referencePrice.toLocaleString()}
                      <span className="text-sm font-normal text-gray-500">
                        /晚
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      實際價格將由管家確認
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#0a4c6b] text-white py-3 rounded-xl font-medium hover:bg-[#083d56] transition"
                  >
                    提交住宿查詢
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    沒有壓力，只是一次輕鬆的對話
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
