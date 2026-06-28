import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, Users, Fish, Waves, Ship, Sunset, MapPin, Anchor, Heart, Sparkles, Leaf, Loader2, Sun, Umbrella, Tent, Flame, Camera, X } from 'lucide-react';
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
  category: string;
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
  Sun,
  Umbrella,
  Tent,
  Flame,
  Camera,
};

function getIconByName(name: string | null): React.ReactNode {
  if (!name) return <Sparkles className="w-5 h-5" />;
  const Icon = iconMap[name];
  if (!Icon) return <Sparkles className="w-5 h-5" />;
  return <Icon className="w-5 h-5" />;
}

const categoryMap: Record<string, string> = {
  'coral-garden-snorkeling': '浮潛與潛水',
  'two-spot-snorkeling': '浮潛與潛水',
  'shipwreck-manta-snorkeling': '浮潛與潛水',
  'turtle-snorkeling': '浮潛與潛水',
  'scuba-diving-experience': '浮潛與潛水',
  'whale-shark-manta': '浮潛與潛水',
  'traditional-night-fishing': '海釣體驗',
  'deep-sea-big-game-fishing': '海釣體驗',
  'half-day-sea-fishing': '海釣體驗',
  'full-day-sea-fishing': '海釣體驗',
  'sea-fishing': '海釣體驗',
  'guided-surf-trip': '衝浪與瑜伽',
  'surf-lesson': '衝浪與瑜伽',
  'group-yoga-class': '衝浪與瑜伽',
  'private-yoga-session': '衝浪與瑜伽',
  'local-island-culture-tour': '島嶼探索',
  'uninhabited-island-half-day': '島嶼探索',
  'uninhabited-island-full-day': '島嶼探索',
  'uninhabited-island': '島嶼探索',
  'sunset-cruise': '島嶼探索',
  'private-island-picnic-half-day': '私人島嶼與浪漫',
  'private-island-picnic-full-day': '私人島嶼與浪漫',
  'private-island-picnic': '私人島嶼與浪漫',
  'private-island-overnight-camping': '私人島嶼與浪漫',
  'private-island-bbq-dinner': '私人島嶼與浪漫',
  'couples-romantic-beach-dinner': '私人島嶼與浪漫',
  'drone-aerial-photography': '航拍與特色',
};

const categoryOrder = [
  '浮潛與潛水',
  '海釣體驗',
  '衝浪與瑜伽',
  '島嶼探索',
  '私人島嶼與浪漫',
  '航拍與特色',
];

const categoryMeta: Record<string, { image: string; iconName: string }> = {
  '全部': { image: 'https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?w=800&q=80', iconName: 'Sparkles' },
  '浮潛與潛水': { image: 'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=800&q=80', iconName: 'Waves' },
  '海釣體驗': { image: 'https://images.unsplash.com/photo-1500514966906-fe245eea9344?w=800&q=80', iconName: 'Fish' },
  '衝浪與瑜伽': { image: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&q=80', iconName: 'Sun' },
  '島嶼探索': { image: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80', iconName: 'Ship' },
  '私人島嶼與浪漫': { image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', iconName: 'Heart' },
  '航拍與特色': { image: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&q=80', iconName: 'Camera' },
  '主題靜修': { image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80', iconName: 'Leaf' },
};

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
    category: categoryMap[item.slug] || '其他',
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
    category: '主題靜修',
  };
}

export default function ExperiencesPage() {
  const [apiExperiences, setApiExperiences] = useState<Experience[]>([]);
  const [apiRetreats, setApiRetreats] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(categoryOrder[0]);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);

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
        const expJson = (await expRes.json()) as { data?: ApiExperience[] };
        const expList = Array.isArray(expJson?.data) ? expJson.data.map(mapApiExperience) : [];

        let retList: Experience[] = [];
        if (retRes.ok) {
          const retJson = (await retRes.json()) as { data?: ApiRetreat[] };
          retList = Array.isArray(retJson?.data) ? retJson.data.map(mapApiRetreat) : [];
        } else {
          console.warn('Retreats API error:', retRes.status);
        }

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

  const combinedItems = [...apiExperiences, ...apiRetreats];

  const filteredItems = combinedItems.filter((item) => item.category === activeCategory);

  const categoryCounts = combinedItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  const categoryCards = [
    ...categoryOrder.map((c) => ({ key: c, label: c })),
    ...(apiRetreats.length > 0 ? [{ key: '主題靜修', label: '主題靜修' }] : []),
  ];

  return (
    <div className="pt-20 pb-16">
      {/* Hero — Desktop */}
      <div className="relative hidden md:flex md:min-h-[600px] md:h-[75vh] items-end justify-center overflow-hidden pb-16">
        <img
          src="/images/experiences-hero.jpg"
          alt="Maldives ocean activities"
          className="absolute inset-0 w-full h-full object-cover object-[35%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a4c6b]/95 via-[#0a4c6b]/40 to-[#0a4c6b]/10" />
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <p className="text-[#B8902F] font-medium mb-2 tracking-widest uppercase text-sm">Explore the Islands</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">海島體驗</h1>
          <p className="text-xl md:text-2xl text-white/90 mb-3">不只是住宿，而是深入海洋與島嶼文化的旅程。</p>
          <p className="text-white/70 max-w-2xl mx-auto">從浮潛到私人島嶼晚餐，按你的興趣快速篩選，每一項都由當地團隊客製安排。</p>
        </div>
      </div>

      {/* Hero — Mobile */}
      <section className="md:hidden min-h-screen flex flex-col bg-[#0d1b2a]">
        <div className="relative h-[55vh] w-full">
          <img
            src="/images/experiences-hero.jpg"
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
            <p className="text-white/70">從浮潛到私人島嶼晚餐，按你的興趣快速篩選，每一項都由當地團隊客製安排。</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {categoryCards.map((cat, i) => {
              const meta = categoryMeta[cat.key] || categoryMeta['全部'];
              const count = cat.key === '全部' ? combinedItems.length : (categoryCounts[cat.key] || 0);
              const Icon = iconMap[meta.iconName] || Sparkles;
              return (
                <motion.button
                  key={cat.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`relative overflow-hidden rounded-2xl text-left h-40 transition focus:outline-none ${
                    activeCategory === cat.key
                      ? 'ring-4 ring-[#B8902F] shadow-xl'
                      : 'hover:shadow-lg'
                  }`}
                >
                  <img
                    src={meta.image}
                    alt={cat.label}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a4c6b]/90 via-[#0a4c6b]/40 to-transparent" />
                  <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-5 h-5 text-[#B8902F]" />
                      <span className="text-sm font-medium text-white/80">{count} 項體驗</span>
                    </div>
                    <h3 className="text-xl font-bold">{cat.label}</h3>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-[#0a4c6b] animate-spin mb-4" />
              <p className="text-gray-500">載入體驗中…</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-600 mb-2">載入失敗，請重新整理頁面再試。</p>
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600">此分類暫無體驗。</p>
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

                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-xl font-bold text-[#0d1b2a]">{exp.nameZh || exp.name}</h3>
                      <span className="shrink-0 inline-block bg-[#0a4c6b]/10 text-[#0a4c6b] text-xs font-medium px-2.5 py-1 rounded-full">
                        {exp.category}
                      </span>
                    </div>
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
                        {exp.includes.slice(0, 4).map((item, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-[#f0f9f7] text-[#0a4c6b] px-2 py-1 rounded-full flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            {item}
                          </span>
                        ))}
                        {exp.includes.length > 4 && (
                          <span className="text-xs text-gray-400 px-2 py-1">+{exp.includes.length - 4}</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
                      {exp.price != null ? (
                        <p className="text-lg font-bold text-[#0a4c6b]">HK${exp.price.toLocaleString()}</p>
                      ) : (
                        <p className="text-sm text-gray-500">{exp.priceNote}</p>
                      )}
                      <button
                        onClick={() => setSelectedExperience(exp)}
                        className="bg-[#0a4c6b] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#083d56] transition"
                      >
                        了解更多
                      </button>
                    </div>

                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Experience Detail Modal */}
      <AnimatePresence>
        {selectedExperience && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setSelectedExperience(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="relative aspect-video">
                <img
                  src={selectedExperience.image}
                  alt={selectedExperience.nameZh}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <button
                  onClick={() => setSelectedExperience(null)}
                  className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-700 rounded-full p-2 transition"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-4 text-white">
                  <span className="inline-block bg-[#B8902F] text-xs font-medium px-3 py-1 rounded-full mb-2">
                    {selectedExperience.category}
                  </span>
                  <h3 className="text-2xl font-bold">{selectedExperience.nameZh || selectedExperience.name}</h3>
                </div>
              </div>
              <div className="p-6 sm:p-8 space-y-6">
                {selectedExperience.nameZh && selectedExperience.nameZh !== selectedExperience.name && (
                  <p className="text-sm text-gray-500">{selectedExperience.name}</p>
                )}
                <p className="text-gray-600 leading-relaxed">{selectedExperience.description}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 bg-[#f8fafb] rounded-xl p-4">
                    <Clock className="w-5 h-5 text-[#2ec4b6]" />
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="font-medium text-[#0d1b2a]">{selectedExperience.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-[#f8fafb] rounded-xl p-4">
                    <Users className="w-5 h-5 text-[#2ec4b6]" />
                    <div>
                      <p className="text-xs text-gray-500">Group Size</p>
                      <p className="font-medium text-[#0d1b2a]">{selectedExperience.groupSize}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-[#0d1b2a] mb-3">包含項目</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedExperience.includes.map((item, idx) => (
                      <span
                        key={idx}
                        className="text-sm bg-[#f0f9f7] text-[#0a4c6b] px-3 py-1.5 rounded-full flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  {selectedExperience.price != null ? (
                    <p className="text-lg font-bold text-[#0a4c6b]">HK${selectedExperience.price.toLocaleString()}</p>
                  ) : (
                    <p className="text-sm text-gray-500">{selectedExperience.priceNote}</p>
                  )}
                  <a
                    href="/plan"
                    className="bg-[#B8902F] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#9a7a28] transition"
                  >
                    預約諮詢
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
