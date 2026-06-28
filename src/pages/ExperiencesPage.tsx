import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Users, Fish, Waves, Ship, Sunset, MapPin, Anchor, Heart, Sparkles, Leaf, Loader2 } from 'lucide-react';
import { client } from '../api/client';

interface Experience {
  id: string;
  name: string;
  nameZh: string;
  duration: string;
  groupSize: string;
  includes: string[];
  description: string;
  price?: number | null;
  priceNote: string;
  image: string;
  icon: React.ReactNode;
  category: 'experience' | 'retreat';
}

interface ApiExperience {
  id: number;
  name: string;
  nameZh: string;
  slug: string;
  description: string;
  descriptionZh: string;
  duration: string;
  groupSize: string;
  includes: string;
  price: number | null;
  priceNote: string;
  imageUrl: string;
  iconName: string | null;
  sortOrder: number;
  status: string;
}

interface ApiRetreat {
  id: number;
  name: string;
  nameZh: string;
  slug: string;
  description: string;
  descriptionZh: string;
  duration: string;
  location: string;
  audience: string;
  itinerary: string;
  priceNote: string;
  imageUrl: string;
  iconName: string | null;
  sortOrder: number;
  status: string;
}

const fallbackExperiences: Experience[] = [
  {
    id: 'night-fishing',
    name: 'Night Fishing Trip',
    nameZh: '夜釣之旅',
    duration: '3-4 小時',
    groupSize: '2-8 人',
    includes: ['專業漁夫', '釣具', '船上晚餐', '飲料'],
    description: '在星空下出海，學習傳統釣魚技巧，現釣現煮的海鮮晚餐是最大回報。',
    priceNote: '按行程報價',
    image: 'https://images.unsplash.com/photo-1500514966906-fe245eea9344?w=800&q=80',
    icon: <Fish className="w-5 h-5" />,
    category: 'experience',
  },
  {
    id: 'snorkeling-diving',
    name: 'Snorkeling & Diving',
    nameZh: '浮潛與潛水',
    duration: '半日或全日',
    groupSize: '2-6 人',
    includes: ['裝備', '專業教練', '船程', '午餐'],
    description: '探索環礁珊瑚花園，與海龜、熱帶魚共游，從初學者到持證潛水員都能找到適合路線。',
    priceNote: '按行程報價',
    image: 'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=800&q=80',
    icon: <Waves className="w-5 h-5" />,
    category: 'experience',
  },
  {
    id: 'sunset-cruise',
    name: 'Sunset Cruise',
    nameZh: '日落巡航',
    duration: '2 小時',
    groupSize: '2-12 人',
    includes: ['香檳／飲料', '小點', '船上音樂'],
    description: '在金色夕陽中出海，看海豚躍出水面，為一天畫下完美句點。',
    priceNote: '按行程報價',
    image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80',
    icon: <Sunset className="w-5 h-5" />,
    category: 'experience',
  },
  {
    id: 'island-hopping',
    name: 'Island Hopping',
    nameZh: '跳島探索',
    duration: '全日',
    groupSize: '4-10 人',
    includes: ['船程', '導覽', '沙洲午餐', '浮潛'],
    description: '一天穿梭多座無人島與本地島嶼，感受馬爾代夫的多元面貌。',
    priceNote: '按行程報價',
    image: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80',
    icon: <Ship className="w-5 h-5" />,
    category: 'experience',
  },
  {
    id: 'whale-shark-manta',
    name: 'Whale Shark & Manta Encounter',
    nameZh: '鯨鯊與魔鬼魚共游',
    duration: '半日',
    groupSize: '2-6 人',
    includes: ['專業船長', '浮潛裝備', '海洋生物解說'],
    description: '在 South Ari 環礁與溫柔的鯨鯊和魔鬼魚同游，一生難忘的海洋奇遇。',
    priceNote: '按行程報價',
    image: 'https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=800&q=80',
    icon: <Sparkles className="w-5 h-5" />,
    category: 'experience',
  },
  {
    id: 'local-island',
    name: 'Local Island Visit',
    nameZh: '本地島嶼文化體驗',
    duration: '半日',
    groupSize: '2-8 人',
    includes: ['當地導遊', '文化導覽', '傳統小點'],
    description: '走進馬爾代夫本地社區，了解傳統工藝、漁村生活與島嶼故事。',
    priceNote: '按行程報價',
    image: 'https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?w=800&q=80',
    icon: <MapPin className="w-5 h-5" />,
    category: 'experience',
  },
];

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Fish,
  Waves,
  Sunset,
  Ship,
  Sparkles,
  MapPin,
  Anchor,
  Heart,
  Leaf,
};

function getIconByName(name: string | null): React.ReactNode {
  if (!name) return <Sparkles className="w-5 h-5" />;
  const Icon = iconMap[name];
  if (!Icon) return <Sparkles className="w-5 h-5" />;
  return <Icon className="w-5 h-5" />;
}

function mapApiExperience(item: ApiExperience): Experience {
  return {
    id: item.slug,
    name: item.name,
    nameZh: item.nameZh,
    duration: item.duration,
    groupSize: item.groupSize,
    includes: safeJsonParse<string[]>(item.includes, []),
    description: item.description,
    price: item.price,
    priceNote: item.priceNote,
    image: item.imageUrl,
    icon: getIconByName(item.iconName),
    category: 'experience',
  };
}

function mapApiRetreat(item: ApiRetreat): Experience {
  const itinerary = safeJsonParse<{ day: string; title: string; desc: string }[]>(item.itinerary, []);
  return {
    id: item.slug,
    name: item.name,
    nameZh: item.nameZh,
    duration: item.duration,
    groupSize: item.audience,
    includes: itinerary.length > 0
      ? itinerary.slice(0, 4).map((it) => it.title)
      : ['住宿', '每日活動', '餐飲', '專屬管家'],
    description: item.description,
    priceNote: item.priceNote,
    image: item.imageUrl,
    icon: getIconByName(item.iconName),
    category: 'retreat',
  };
}

export default function ExperiencesPage() {
  const [apiExperiences, setApiExperiences] = useState<Experience[]>([]);
  const [apiRetreats, setApiRetreats] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'experience' | 'retreat'>('all');

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [expRes, retRes] = await Promise.all([
          client.api.fetch('/api/public/experiences'),
          client.api.fetch('/api/public/retreats'),
        ]);
        if (!expRes.ok) {
          throw new Error(`Experiences API error ${expRes.status}`);
        }
        if (!retRes.ok) {
          throw new Error(`Retreats API error ${retRes.status}`);
        }
        const expJson = (await expRes.json()) as { data?: ApiExperience[] };
        const retJson = (await retRes.json()) as { data?: ApiRetreat[] };
        const expList = Array.isArray(expJson?.data) ? expJson.data.map(mapApiExperience) : [];
        const retList = Array.isArray(retJson?.data) ? retJson.data.map(mapApiRetreat) : [];
        if (mounted) {
          setApiExperiences(expList);
          setApiRetreats(retList);
        }
      } catch (err) {
        console.error('Experiences load error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const combinedItems = apiExperiences.length > 0 || apiRetreats.length > 0
    ? [...apiExperiences, ...apiRetreats]
    : [...fallbackExperiences];

  const filteredItems = filter === 'all'
    ? combinedItems
    : combinedItems.filter((item) => item.category === filter);

  return (
    <div className="pt-20 pb-16">
      {/* Hero — Desktop */}
      <div className="relative hidden md:flex md:min-h-[600px] md:h-[75vh] items-end justify-center overflow-hidden pb-16">
        <img
          src="https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?w=1920&q=80"
          alt="Maldives ocean activities"
          className="absolute inset-0 w-full h-full object-cover object-[35%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a4c6b]/95 via-[#0a4c6b]/40 to-[#0a4c6b]/10" />
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <p className="text-[#B8902F] font-medium mb-2 tracking-widest uppercase text-sm">Explore the Islands</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">海島體驗</h1>
          <p className="text-xl md:text-2xl text-white/90 mb-3">不只是住宿，而是深入海洋與島嶼文化的旅程。</p>
          <p className="text-white/70 max-w-2xl mx-auto">從夜釣到鯨鯊共游，每一項體驗都由當地團隊客製安排。</p>
        </div>
      </div>

      {/* Hero — Mobile */}
      <section className="md:hidden min-h-screen flex flex-col bg-[#0d1b2a]">
        <div className="relative h-[55vh] w-full">
          <img
            src="https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?w=1920&q=80"
            alt="Maldives ocean activities"
            className="w-full h-full object-cover object-[50%_35%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a4c6b]/40 via-transparent to-[#0d1b2a]" />
        </div>
        <div className="flex-1 flex items-center justify-center px-6 py-10 text-center text-white">
          <div className="max-w-xl">
            <p className="text-[#B8902F] font-medium mb-2 tracking-widest uppercase text-sm">Explore the Islands</p>
            <h1 className="text-4xl font-bold mb-4">海島體驗</h1>
            <p className="text-lg text-white/90 mb-3">不只是住宿，而是深入海洋與島嶼文化的旅程。</p>
            <p className="text-white/70">從夜釣到鯨鯊共游，每一項體驗都由當地團隊客製安排。</p>
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
            <p className="text-[#2ec4b6] font-medium mb-2">為你客製的每一刻</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0d1b2a] mb-6">讓海洋成為你的嚮導</h2>
            <p className="text-gray-600 leading-relaxed">
              每一項體驗都可以依照你的節奏、人數與興趣調整。無論是想要一場寧靜的日落巡航，
              還是與鯨鯊同游的冒險，我們的當地團隊都會為你安排最合適的路線。
            </p>
          </motion.div>
        </div>
      </section>

      {/* Activities Grid */}
      <section className="py-16 px-4 bg-[#f8fafb]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {[
              { key: 'all', label: '全部' },
              { key: 'experience', label: '單日體驗' },
              { key: 'retreat', label: '主題靜修' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as typeof filter)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                  filter === tab.key
                    ? 'bg-[#0a4c6b] text-white'
                    : 'bg-white text-[#0a4c6b] border border-[#0a4c6b]/20 hover:border-[#0a4c6b]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-[#0a4c6b] animate-spin mb-4" />
              <p className="text-gray-500">載入體驗中…</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredItems.map((exp, i) => (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={exp.image}
                      alt={exp.nameZh}
                      className="w-full h-full object-cover hover:scale-105 transition duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute top-4 left-4 bg-[#B8902F] text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                      {exp.icon}
                      <span>{exp.nameZh || exp.name}</span>
                    </div>
                    <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-medium text-[#0a4c6b]">
                      {exp.price != null ? `HK$${exp.price.toLocaleString()}` : exp.priceNote}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[#0d1b2a] mb-2">{exp.nameZh || exp.name}</h3>
                    {exp.nameZh && exp.nameZh !== exp.name && <p className="text-sm text-gray-500 mb-1">{exp.name}</p>}
                    <p className="text-gray-600 text-sm mt-3 leading-relaxed">{exp.description}</p>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-[#2ec4b6]" />
                        <span>{exp.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4 text-[#2ec4b6]" />
                        <span>建議人數：{exp.groupSize}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">包含：</p>
                      <div className="flex flex-wrap gap-2">
                        {exp.includes.map((item, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-[#f0f9f7] text-[#0a4c6b] px-2 py-1 rounded-full flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trust / CTA */}
      <section className="py-16 px-4 bg-[#0a4c6b]">
        <div className="max-w-5xl mx-auto text-center text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              { icon: <Anchor className="w-8 h-8" />, title: '當地團隊', desc: '熟悉每一個環礁與季節節奏' },
              { icon: <Heart className="w-8 h-8" />, title: '客製安排', desc: '依照你的人數與體力調整路線' },
              { icon: <Sparkles className="w-8 h-8" />, title: '專屬管家', desc: '24 小時內回覆你的諮詢' },
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
            所有體驗均為客製化安排，實際內容會依照天氣、季節與參與人數調整。
            我們會在收到諮詢後與你確認最合適的方案。
          </p>
        </div>
      </section>
    </div>
  );
}
