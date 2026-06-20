import { createEdgeSpark } from "@edgespark/client";
import "@edgespark/client/styles.css";

export const client = createEdgeSpark({
  baseUrl: "https://staging--4ea90hamxnhi5jzf7tqf.youbase.cloud",
});

// --- Demo data for unified mock mode ---

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

const demoPropertiesList = [
  { id: 1, name: 'Stay Mikado', nameZh: '御海閣', description: 'Boutique overwater villas.', descriptionZh: '坐落於清澈潟湖之上的奢華水上別墅，配備私人泳池與管家服務。', location: 'North Malé Atoll', pricePerNight: 4800, maxGuests: 4, imageUrl: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80', amenities: JSON.stringify(['私人泳池', '管家服務', '水上飛機']) },
  { id: 2, name: 'Private Island', nameZh: '私享島嶼', description: 'Exclusive private island retreat.', descriptionZh: '整島出租的頂級私人島嶼，適合家族或高端團體的私密度假。', location: 'Baa Atoll', pricePerNight: 12800, maxGuests: 12, imageUrl: 'https://images.unsplash.com/photo-1688949078626-a358f500e063?w=800&q=80', amenities: JSON.stringify(['私人島嶼', '廚師團隊', '遊艇']) },
  { id: 3, name: 'Stay Madivaru', nameZh: '碧海灣', description: 'Beachfront villas with reef access.', descriptionZh: '沙灘別墅直通珊瑚礁，浮潛與潛水愛好者的天堂。', location: 'South Ari Atoll', pricePerNight: 3200, maxGuests: 3, imageUrl: 'https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?w=800&q=80', amenities: JSON.stringify(['珊瑚礁', '浮潛', '海灘晚餐']) },
];

const lagoonVilla = (basePrice: number): RoomType => ({
  id: basePrice + 100,
  name: 'Lagoon Villa',
  nameZh: '潟湖別墅',
  description: 'Overwater villa with lagoon views.',
  descriptionZh: '坐擁潟湖美景的水上別墅，配備私人露台與下沉式沙發。',
  pricePerNight: basePrice,
  maxGuests: 2,
  inventory: 3,
  imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600',
  amenities: JSON.stringify(['海景露台', '浴缸', '空調', 'Wi-Fi']),
});

const oceanSuite = (basePrice: number): RoomType => ({
  id: basePrice + 101,
  name: 'Ocean Suite',
  nameZh: '海洋套房',
  description: 'Spacious suite with private pool.',
  descriptionZh: '寬敞海洋套房，設有私人無邊際泳池與獨立客廳。',
  pricePerNight: Math.round(basePrice * 1.625),
  maxGuests: 4,
  inventory: 2,
  imageUrl: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600',
  amenities: JSON.stringify(['私人泳池', '客廳', '管家服務', '迎賓香檳']),
});

const demoPropertiesDetail: Property[] = [
  {
    id: 1,
    name: 'Stay Mikado',
    nameZh: '御海閣',
    description: 'A boutique overwater villa collection in the Maldives.',
    descriptionZh: '御海閣坐落於馬爾代夫清澈潟湖之上，提供私密而奢華的度假體驗。每棟水上別墅均配備私人泳池、玻璃地板與無邊際海景，並由專屬管家團隊提供全天候服務。',
    location: 'North Malé Atoll, Maldives',
    pricePerNight: 4800,
    maxGuests: 4,
    imageUrl: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80',
    amenities: JSON.stringify(['私人泳池', '水上飛機接送', '24 小時管家', '浮潛裝備', '海鮮晚餐', 'SPA']),
    roomTypes: [lagoonVilla(4800), oceanSuite(4800)],
  },
  {
    id: 2,
    name: 'Private Island',
    nameZh: '私享島嶼',
    description: 'An exclusive private island retreat for the ultimate privacy.',
    descriptionZh: '整島出租的頂級私人島嶼，擁有私人沙灘、廚師團隊與遊艇，適合家族或高端團體的私密度假體驗。',
    location: 'Baa Atoll, Maldives',
    pricePerNight: 12800,
    maxGuests: 12,
    imageUrl: 'https://images.unsplash.com/photo-1688949078626-a358f500e063?w=1200&q=80',
    amenities: JSON.stringify(['私人島嶼', '廚師團隊', '遊艇', '管家服務', 'SPA', '私人影院']),
    roomTypes: [lagoonVilla(12800), oceanSuite(12800)],
  },
  {
    id: 3,
    name: 'Stay Madivaru',
    nameZh: '碧海灣',
    description: 'Beachfront villas with direct reef access.',
    descriptionZh: '沙灘別墅直通珊瑚礁，浮潛與潛水愛好者的天堂，每晚皆可安排海灘晚餐與日落巡航。',
    location: 'South Ari Atoll, Maldives',
    pricePerNight: 3200,
    maxGuests: 3,
    imageUrl: 'https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?w=1200&q=80',
    amenities: JSON.stringify(['珊瑚礁', '浮潛', '海灘晚餐', '潛水中心', '日落巡航']),
    roomTypes: [lagoonVilla(3200), oceanSuite(3200)],
  },
];

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function createEmptyResponse(status = 200): Response {
  return createJsonResponse({ data: null }, status);
}

// --- Intercept all client.api.fetch() calls for mock mode ---

const originalFetch = (client.api as unknown as { fetch: (input: string, init?: RequestInit) => Promise<Response> }).fetch.bind(
  client.api
);

(client.api as unknown as { fetch: (input: string, init?: RequestInit) => Promise<Response> }).fetch = async (
  input: string,
  init?: RequestInit
): Promise<Response> => {
  // Public properties list: always return demo data
  if (input === '/api/public/properties') {
    return createJsonResponse({ data: demoPropertiesList });
  }

  // Public property detail: return matching demo property
  const detailMatch = input.match(/^\/api\/public\/properties\/(\d+)$/);
  if (detailMatch) {
    const id = Number(detailMatch[1]);
    const property = demoPropertiesDetail.find((p) => p.id === id) ?? {
      ...demoPropertiesDetail[0],
      id,
    };
    return createJsonResponse({ data: property });
  }

  // For all other endpoints, try the real fetch first
  try {
    const response = await originalFetch(input, init);
    if (!response.ok) {
      console.warn(`API call to ${input} returned ${response.status}, returning empty response.`);
      return createEmptyResponse(response.status);
    }
    return response;
  } catch (err) {
    console.warn(`API call to ${input} failed, returning empty response:`, err);
    return createEmptyResponse();
  }
};
