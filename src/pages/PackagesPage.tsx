import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Loader2 } from 'lucide-react';
import { client } from '../api/client';

interface PricingOption {
  type: 'shared' | 'single';
  label: string;
  price: number;
  currency: string;
}

interface Package {
  id: number;
  name: string;
  nameZh: string;
  slug: string;
  description: string | null;
  descriptionZh: string | null;
  duration: string | null;
  location: string | null;
  audience: string | null;
  inclusions: string[];
  itinerary: { day: string; title: string; desc: string }[];
  pricingOptions: PricingOption[];
  terms: string | null;
  imageUrl: string | null;
  gallery: string[];
  sortOrder: number;
  status: 'active' | 'inactive';
}

const placeholderImage = 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80';

function getDisplayPrice(options: PricingOption[]): string {
  if (!options || options.length === 0) return '按行程報價';
  const shared = options.find((o) => o.type === 'shared');
  if (shared) return `HK$${shared.price.toLocaleString()} 起`;
  const lowest = options.reduce((min, o) => (o.price < min.price ? o : min), options[0]);
  return `HK$${lowest.price.toLocaleString()} 起`;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await client.api.fetch('/api/public/packages');
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const json = (await res.json()) as { data?: Package[] };
        const list = Array.isArray(json?.data) ? json.data.filter((p) => p.status === 'active') : [];
        if (mounted) setPackages(list);
      } catch (err) {
        console.error('Packages load error:', err);
        if (mounted) setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const displayPackages = packages;

  return (
    <div className="pt-20 pb-16">
      {/* Hero — Desktop */}
      <div className="relative hidden md:flex md:min-h-[600px] md:h-[75vh] items-end justify-center overflow-hidden pb-16">
        <img
          src="https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?w=1920&q=80"
          alt="Maldives vacation packages"
          className="absolute inset-0 w-full h-full object-cover object-[35%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a4c6b]/95 via-[#0a4c6b]/40 to-[#0a4c6b]/10" />
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <p className="text-[#B8902F] font-medium mb-2 tracking-widest uppercase text-sm">Vacation Packages</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">度假套餐</h1>
          <p className="text-xl md:text-2xl text-white/90 mb-3">為你精心搭配的一站式海島假期。</p>
          <p className="text-white/70 max-w-2xl mx-auto">住宿、交通、體驗一次搞定，專屬管家全程跟進。</p>
        </div>
      </div>

      {/* Hero — Mobile */}
      <section className="md:hidden min-h-screen flex flex-col bg-[#0d1b2a]">
        <div className="relative h-[55vh] w-full">
          <img
            src="https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?w=1920&q=80"
            alt="Maldives vacation packages"
            className="w-full h-full object-cover object-[50%_35%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a4c6b]/40 via-transparent to-[#0d1b2a]" />
        </div>
        <div className="flex-1 flex items-center justify-center px-6 py-10 text-center text-white">
          <div className="max-w-xl">
            <p className="text-[#B8902F] font-medium mb-2 tracking-widest uppercase text-sm">Vacation Packages</p>
            <h1 className="text-4xl font-bold mb-4">度假套餐</h1>
            <p className="text-lg text-white/90 mb-3">為你精心搭配的一站式海島假期。</p>
            <p className="text-white/70">住宿、交通、體驗一次搞定，專屬管家全程跟進。</p>
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
            <p className="text-[#2ec4b6] font-medium mb-2">省心，更自由</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0d1b2a] mb-6">把規劃交給我們，把時間留給海島</h2>
            <p className="text-gray-600 leading-relaxed">
              每一個度假套餐都經過精心設計，包含住宿、接送與特色體驗。
              你只需選擇出發日期與房型，其餘由我們安排。
            </p>
          </motion.div>
        </div>
      </section>

      {/* Packages Grid */}
      <section className="py-16 px-4 bg-[#f8fafb]">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-[#0a4c6b] animate-spin mb-4" />
              <p className="text-gray-500">載入度假套餐中…</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-gray-500">
              <p>暫時無法載入套餐，請稍後再試。</p>
              <p className="text-xs mt-2 text-gray-400">{error}</p>
            </div>
          ) : displayPackages.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600">暫無度假套餐。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayPackages.map((pkg, i) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300 flex flex-col"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={pkg.imageUrl || placeholderImage}
                      alt={pkg.nameZh}
                      className="w-full h-full object-cover hover:scale-105 transition duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-medium text-[#0a4c6b]">
                      {getDisplayPrice(pkg.pricingOptions)}
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-[#0d1b2a] mb-2">{pkg.nameZh}</h3>
                    {pkg.nameZh !== pkg.name && <p className="text-sm text-gray-500 mb-1">{pkg.name}</p>}
                    <p className="text-gray-600 text-sm mt-2 leading-relaxed line-clamp-3">
                      {pkg.descriptionZh || pkg.description || ''}
                    </p>

                    <div className="mt-4 space-y-2">
                      {pkg.duration && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4 text-[#2ec4b6]" />
                          <span>{pkg.duration}</span>
                        </div>
                      )}
                      {pkg.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 text-[#2ec4b6]" />
                          <span>{pkg.location}</span>
                        </div>
                      )}
                    </div>

                    <Link
                      to={`/packages/${pkg.slug}`}
                      className="mt-auto pt-6 block w-full bg-[#0a4c6b] text-white text-center py-3 rounded-xl font-semibold hover:bg-[#083d56] transition"
                    >
                      查看詳情
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
