import bcryptjs from 'bcryptjs'
import { first, run } from './db'
import type { Admin } from '../db/schema'

export interface SeedProperty {
  id?: number
  name: string
  nameZh: string
  description: string | null
  descriptionZh: string | null
  location: string | null
  pricePerNight: number
  maxGuests: number | null
  imageUrl: string | null
  amenities: string
  gallery: string
  facilities: string
  locationDetails: string
  story: string
  status: 'active'
}

export interface SeedRoomType {
  id?: number
  propertyId: number
  name: string
  nameZh: string
  description: string | null
  descriptionZh: string | null
  pricePerNight: number
  maxGuests: number | null
  inventory: number
  imageUrl: string | null
  amenities: string
  bedType: string
  view: string
  sizeSqm: number
  occupancy: string
  gallery: string
  features: string
  status: 'available'
}

export interface SeedExperience {
  name: string
  nameZh: string
  slug: string
  description: string | null
  descriptionZh: string | null
  duration: string
  groupSize: string
  includes: string
  priceNote: string
  imageUrl: string
  iconName: string
  sortOrder: number
  status: 'active' | 'inactive'
}

const demoProperties: SeedProperty[] = [
  {
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
        '御海閣誕生於一片被保育完好的潟湖之上，每一棟別墅都以馬爾代夫傳統工藝與現代極簡設計融合。島主希望每位客人不是「入住」一座度假村，而是回歸一片屬於自己的海洋。從日出時管家送來的咖啡，到深夜玻璃地板下緩緩游過的海龜，御海閣相信：真正的奢華，是讓時間慢下來。',
    }),
    status: 'active',
  },
  {
    name: 'Velaa Private',
    nameZh: '私享島嶼',
    description: 'An exclusive private island retreat for the ultimate privacy.',
    descriptionZh:
      '整座島嶼只為你與你的摯愛開放。私享島嶼擁有頂級私人管家、米其林主廚團隊與獨立高爾夫球場，是家族團聚、高端慶典與私密靜修的理想之地。',
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
      { icon: '👨\u200d💼', label: '私人島嶼管家' },
      { icon: '👨\u200d🍳', label: '米其林主廚餐廳' },
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
        '這座島嶼的名字源於當地語言中的「海龜」。數十年來，這裡一直是綠蠵龜與玳瑁上岸產卵的秘境。現任島主買下島嶼後，堅持只開放給極少數客人，並將大部分海岸線留給自然與保育。在私享島嶼，沒有「其他住客」，只有你的家人、朋友、管家，以及偶爾上岸產卵的海龜。',
    }),
    status: 'active',
  },
  {
    name: 'Azure Bay',
    nameZh: '碧海灣',
    description: 'Beachfront villas with direct reef access.',
    descriptionZh:
      '碧海灣是家庭與團體旅客的理想海濱別墅，擁有私人海灘、共用泳池與完整廚房設備。這裡氛圍輕鬆自在，讓你像當地人一樣生活，同時享受馬爾代夫的絕美海景。',
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
      { icon: '🏊\u200d♀️', label: '共用泳池' },
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
        '碧海灣原為當地漁村家族世代守護的海岸。島主從小在這片海灘長大，熟悉每一處珊瑚礁與每一群魚的出沒時間。他將家族土地改建為別墅時，堅持保留原有的椰林、沙灘與礁石，並聘請當地漁民擔任嚮導。來到碧海灣，你會發現這裡不只有美景，還有與海洋共處數代人的溫度。',
    }),
    status: 'active',
  },
]

const demoExperiences: SeedExperience[] = [
  {
    name: 'Night Fishing Trip',
    nameZh: '夜釣之旅',
    slug: 'night-fishing',
    description:
      'Set sail under the stars, learn traditional Maldivian fishing techniques, and enjoy a freshly cooked seafood dinner on board.',
    descriptionZh:
      '在星空下出海，學習傳統釣魚技巧，現釣現煮的海鮮晚餐是最大回報。',
    duration: '3-4 小時',
    groupSize: '2-8 人',
    includes: JSON.stringify(['專業漁夫', '釣具', '船上晚餐', '飲料']),
    priceNote: '按行程報價',
    imageUrl:
      'https://images.unsplash.com/photo-1500514966906-fe245eea9344?w=800&q=80',
    iconName: 'Fish',
    sortOrder: 1,
    status: 'active',
  },
  {
    name: 'Snorkeling & Diving',
    nameZh: '浮潛與潛水',
    slug: 'snorkeling-diving',
    description:
      'Explore vibrant coral gardens and swim alongside turtles and tropical fish. Routes available for beginners to certified divers.',
    descriptionZh:
      '探索環礁珊瑚花園，與海龜、熱帶魚共游，從初學者到持證潛水員都能找到適合路線。',
    duration: '半日或全日',
    groupSize: '2-6 人',
    includes: JSON.stringify(['裝備', '專業教練', '船程', '午餐']),
    priceNote: '按行程報價',
    imageUrl:
      'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=800&q=80',
    iconName: 'Waves',
    sortOrder: 2,
    status: 'active',
  },
  {
    name: 'Sunset Cruise',
    nameZh: '日落巡航',
    slug: 'sunset-cruise',
    description:
      'Sail into the golden hour with champagne in hand, watching dolphins leap across the horizon.',
    descriptionZh:
      '在金色夕陽中出海，看海豚躍出水面，為一天畫下完美句點。',
    duration: '2 小時',
    groupSize: '2-12 人',
    includes: JSON.stringify(['香檳／飲料', '小點', '船上音樂']),
    priceNote: '按行程報價',
    imageUrl:
      'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80',
    iconName: 'Sunset',
    sortOrder: 3,
    status: 'active',
  },
  {
    name: 'Island Hopping',
    nameZh: '跳島探索',
    slug: 'island-hopping',
    description:
      'Visit uninhabited islands and local communities in one day, experiencing the many faces of the Maldives.',
    descriptionZh:
      '一天穿梭多座無人島與本地島嶼，感受馬爾代夫的多元面貌。',
    duration: '全日',
    groupSize: '4-10 人',
    includes: JSON.stringify(['船程', '導覽', '沙洲午餐', '浮潛']),
    priceNote: '按行程報價',
    imageUrl:
      'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80',
    iconName: 'Ship',
    sortOrder: 4,
    status: 'active',
  },
  {
    name: 'Whale Shark & Manta Encounter',
    nameZh: '鯨鯊與魔鬼魚共游',
    slug: 'whale-shark-manta',
    description:
      'Swim alongside gentle whale sharks and manta rays in South Ari Atoll — a once-in-a-lifetime ocean encounter.',
    descriptionZh:
      '在 South Ari 環礁與溫柔的鯨鯊和魔鬼魚同游，一生難忘的海洋奇遇。',
    duration: '半日',
    groupSize: '2-6 人',
    includes: JSON.stringify(['專業船長', '浮潛裝備', '海洋生物解說']),
    priceNote: '按行程報價',
    imageUrl:
      'https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=800&q=80',
    iconName: 'Sparkles',
    sortOrder: 5,
    status: 'active',
  },
  {
    name: 'Local Island Visit',
    nameZh: '本地島嶼文化體驗',
    slug: 'local-island',
    description:
      'Step into a Maldivian community to learn about local crafts, fishing village life, and island stories.',
    descriptionZh:
      '走進馬爾代夫本地社區，了解傳統工藝、漁村生活與島嶼故事。',
    duration: '半日',
    groupSize: '2-8 人',
    includes: JSON.stringify(['當地導遊', '文化導覽', '傳統小點']),
    priceNote: '按行程報價',
    imageUrl:
      'https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?w=800&q=80',
    iconName: 'MapPin',
    sortOrder: 6,
    status: 'active',
  },
]

function lagoonVilla(
  basePrice: number,
  overrides: Partial<Omit<SeedRoomType, 'propertyId' | 'name' | 'nameZh' | 'description' | 'descriptionZh' | 'pricePerNight' | 'maxGuests' | 'inventory' | 'imageUrl' | 'amenities' | 'status'>> = {}
): Omit<SeedRoomType, 'propertyId'> {
  return {
    name: 'Lagoon Villa',
    nameZh: '潟湖別墅',
    description: 'Overwater villa with lagoon views.',
    descriptionZh: '坐擁潟湖美景的水上別墅，配備私人露台與下沉式沙發。',
    pricePerNight: basePrice,
    maxGuests: 2,
    inventory: 3,
    imageUrl:
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600',
    amenities: JSON.stringify(['海景露台', '浴缸', '空調', 'Wi-Fi']),
    bedType: 'King',
    view: 'Lagoon View',
    sizeSqm: 65,
    occupancy: '2 Adults',
    gallery: JSON.stringify([
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
      'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80',
    ]),
    features: JSON.stringify([
      '私人露台',
      '下沉式沙發',
      '海景浴缸',
      '空調',
      'Wi-Fi',
    ]),
    status: 'available',
    ...overrides,
  }
}

function oceanSuite(
  basePrice: number,
  overrides: Partial<Omit<SeedRoomType, 'propertyId' | 'name' | 'nameZh' | 'description' | 'descriptionZh' | 'pricePerNight' | 'maxGuests' | 'inventory' | 'imageUrl' | 'amenities' | 'status'>> = {}
): Omit<SeedRoomType, 'propertyId'> {
  return {
    name: 'Ocean Suite',
    nameZh: '海洋套房',
    description: 'Spacious suite with private pool.',
    descriptionZh: '寬敞海洋套房，設有私人無邊際泳池與獨立客廳。',
    pricePerNight: Math.round(basePrice * 1.625),
    maxGuests: 4,
    inventory: 2,
    imageUrl:
      'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600',
    amenities: JSON.stringify(['私人泳池', '客廳', '管家服務', '迎賓香檳']),
    bedType: '2 King',
    view: 'Ocean View',
    sizeSqm: 110,
    occupancy: '4 Adults',
    gallery: JSON.stringify([
      'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80',
      'https://images.unsplash.com/photo-1544144433-d50aff500b91?w=800&q=80',
    ]),
    features: JSON.stringify([
      '私人無邊際泳池',
      '獨立客廳',
      '迎賓香檳',
      '管家服務',
    ]),
    status: 'available',
    ...overrides,
  }
}

async function seedAdmin(db: D1Database): Promise<void> {
  const check = await first<Admin>(db, 'SELECT id FROM admins LIMIT 1')
  if (check) return

  await run(
    db,
    `INSERT INTO admins
      (email, name, role, password_hash, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, unixepoch(), unixepoch())`,
    ['admin', 'Super Admin', 'superadmin', bcryptjs.hashSync('maid360', 10)]
  )
}

async function seedPropertiesAndRoomTypes(db: D1Database): Promise<void> {
  const check = await db
    .prepare('SELECT COUNT(*) as count FROM properties')
    .first<{ count: number }>()
  if (check && check.count > 0) {
    return
  }

  for (const property of demoProperties) {
    const result = await run(
      db,
      `INSERT INTO properties
        (name, name_zh, description, description_zh, location, price_per_night, max_guests, image_url, amenities, gallery, facilities, location_details, story, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        property.name,
        property.nameZh,
        property.description,
        property.descriptionZh,
        property.location,
        property.pricePerNight,
        property.maxGuests,
        property.imageUrl,
        property.amenities,
        property.gallery,
        property.facilities,
        property.locationDetails,
        property.story,
        property.status,
      ]
    )
    const propertyId = result.meta.last_row_id

    const roomTypes: SeedRoomType[] = [
      { ...lagoonVilla(property.pricePerNight), propertyId },
      { ...oceanSuite(property.pricePerNight), propertyId },
    ]

    for (const room of roomTypes) {
      await run(
        db,
        `INSERT INTO room_types
          (property_id, name, name_zh, description, description_zh, price_per_night, max_guests, inventory, image_url, amenities, bed_type, view, size_sqm, occupancy, gallery, features, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          room.propertyId,
          room.name,
          room.nameZh,
          room.description,
          room.descriptionZh,
          room.pricePerNight,
          room.maxGuests,
          room.inventory,
          room.imageUrl,
          room.amenities,
          room.bedType,
          room.view,
          room.sizeSqm,
          room.occupancy,
          room.gallery,
          room.features,
          room.status,
        ]
      )
    }
  }
}

async function seedExperiences(db: D1Database): Promise<void> {
  const check = await db
    .prepare('SELECT COUNT(*) as count FROM experiences')
    .first<{ count: number }>()
  if (check && check.count > 0) {
    return
  }

  for (const exp of demoExperiences) {
    await run(
      db,
      `INSERT OR IGNORE INTO experiences
        (name, name_zh, slug, description, description_zh, duration, group_size, includes, price_note, image_url, icon_name, sort_order, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`,
      [
        exp.name,
        exp.nameZh,
        exp.slug,
        exp.description,
        exp.descriptionZh,
        exp.duration,
        exp.groupSize,
        exp.includes,
        exp.priceNote,
        exp.imageUrl,
        exp.iconName,
        exp.sortOrder,
        exp.status,
      ]
    )
  }
}

export async function seedDatabase(db: D1Database): Promise<void> {
  await seedAdmin(db)
  await seedPropertiesAndRoomTypes(db)
  await seedExperiences(db)
}
