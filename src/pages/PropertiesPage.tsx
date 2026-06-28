import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { client } from '../api/client';

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
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    try {
      const res = await client.api.fetch('/api/public/properties');
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      setProperties(data.data || []);
    } catch (err) {
      console.error('Properties fetch failed:', err);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-20 pb-16">
      {/* Header — Desktop / Tablet */}
      <div className="relative hidden md:flex md:min-h-[600px] md:h-[75vh] items-end justify-center overflow-hidden pb-16">
        <img
          src="https://images.unsplash.com/photo-1540202404-a2f29016b523?w=1920&q=80"
          alt="Maldives resort"
          className="absolute inset-0 w-full h-full object-cover object-[35%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a4c6b]/95 via-[#0a4c6b]/40 to-[#0a4c6b]/10" />
        <div className="relative z-10 text-center text-white px-4">
          <p className="text-[#B8902F] font-medium mb-2 tracking-widest uppercase text-sm">選擇你的海島假期</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2">先住進來，感受這裡</h1>
          <p className="text-white/80 max-w-2xl mx-auto">每一間精選住宿，都是為香港旅客設計的海島假期起點。先來體驗，讓感覺帶領你。</p>
        </div>
      </div>

      {/* Header — Mobile */}
      <section className="md:hidden min-h-screen flex flex-col bg-[#0d1b2a]">
        <div className="relative h-[55vh] w-full">
          <img
            src="https://images.unsplash.com/photo-1540202404-a2f29016b523?w=1920&q=80"
            alt="Maldives resort"
            className="w-full h-full object-cover object-[50%_35%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a4c6b]/40 via-transparent to-[#0d1b2a]" />
        </div>
        <div className="flex-1 flex items-center justify-center px-6 py-10 text-center text-white">
          <div className="max-w-xl">
            <p className="text-[#B8902F] font-medium mb-2 tracking-widest uppercase text-sm">選擇你的海島假期</p>
            <h1 className="text-4xl font-bold mb-4">先住進來，感受這裡</h1>
            <p className="text-lg text-white/90">每一間精選住宿，都是為香港旅客設計的海島假期起點。先來體驗，讓感覺帶領你。</p>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-[#0a4c6b] border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => {
              const amenities = property.amenities ? JSON.parse(property.amenities) : [];
              return (
                <Link key={property.id} to={`/properties/${property.id}`} className="group">
                  <div className="rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition duration-300">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={property.imageUrl || 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600'}
                        alt={property.nameZh}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                      />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-medium text-[#0a4c6b]">
                        HK${property.pricePerNight.toLocaleString()}/晚
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-sm text-[#2ec4b6] font-medium">{property.location}</p>
                      <h3 className="text-xl font-bold text-[#0d1b2a] mt-1">{property.nameZh}</h3>
                      <p className="text-sm text-gray-500 mb-1">{property.name}</p>
                      <p className="text-gray-600 text-sm mt-2 line-clamp-2">{property.descriptionZh}</p>
                      {amenities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {amenities.slice(0, 3).map((a: string, i: number) => (
                            <span key={i} className="text-xs bg-[#f0f9f7] text-[#0a4c6b] px-2 py-1 rounded-full">{a}</span>
                          ))}
                        </div>
                      )}
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm text-gray-500">最多 {property.maxGuests} 位旅客</span>
                        <span className="text-[#0a4c6b] font-medium text-sm group-hover:underline">查看詳情 →</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
