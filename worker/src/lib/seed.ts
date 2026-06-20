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
  activities: string
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
  status: 'available'
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
    activities: JSON.stringify([
      {
        image:
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
        name: '日落巡航',
        description:
          '乘著傳統多尼船駛向潟湖盡頭，在香檳與夕陽中結束完美的一天。',
      },
      {
        image:
          'https://images.unsplash.com/photo-1544551762-46a013bb70d5?w=600&q=80',
        name: '夜釣',
        description:
          '跟隨當地漁民出海，在星空下學習傳統釣法，收穫可交由廚師即席烹調。',
      },
      {
        image:
          'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&q=80',
        name: '浮潛',
        description:
          '從別墅甲板直接下水，與熱帶魚群、海龜和珊瑚礁不期而遇。',
      },
      {
        image:
          'https://images.unsplash.com/photo-1560275619-4662e36fa65c?w=600&q=80',
        name: '深潛',
        description:
          'PADI 認證潛水中心帶你探索 North Malé 環礁的著名潛點。',
      },
      {
        image:
          'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80',
        name: '無人島野餐',
        description:
          '包下一座無人沙洲，享受只屬於你的燭光午餐與澄澈海水。',
      },
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
      { icon: '👨‍💼', label: '私人島嶼管家' },
      { icon: '👨‍🍳', label: '米其林主廚餐廳' },
      { icon: '⛳', label: '高爾夫球場' },
      { icon: '🚣', label: '水上運動中心' },
      { icon: '🧸', label: '兒童俱樂部' },
      { icon: '💒', label: '婚禮場地' },
      { icon: '🛥️', label: '私人遊艇' },
      { icon: '🎬', label: '私人影院' },
    ]),
    activities: JSON.stringify([
      {
        image:
          'https://images.unsplash.com/photo-1560275619-4662e36fa65c?w=600&q=80',
        name: '鯨鯊共游',
        description:
          '在專業嚮導陪同下，與溫柔的海洋巨人同游，感受生命的壯闊。',
      },
      {
        image:
          'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=600&q=80',
        name: '海龜保育體驗',
        description:
          '參與島嶼保育計畫，了解海龜的生活史，並協助記錄與放生。',
      },
      {
        image:
          'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80',
        name: '沙洲燭光晚餐',
        description:
          '在只屬於你的沙洲上，由主廚現場烹調，侍酒師搭配美酒。',
      },
      {
        image:
          'https://images.unsplash.com/photo-1528127269322-539801943592?w=600&q=80',
        name: '傳統漁村探訪',
        description:
          '走訪 Noonu 環礁的傳統漁村，認識馬爾代夫的日常生活與手工藝。',
      },
      {
        image:
          'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&q=80',
        name: '環礁浮潛',
        description:
          '探索 Noonu 環礁豐富的珊瑚花園與熱帶魚群，適合各級泳者。',
      },
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
      { icon: '🏊‍♀️', label: '共用泳池' },
      { icon: '🍳', label: '廚房設備' },
      { icon: '🔥', label: 'BBQ 區' },
      { icon: '🤿', label: '浮潛中心' },
      { icon: '🎮', label: '遊戲室' },
      { icon: '📽️', label: '海灘電影院' },
      { icon: '🚲', label: '自行車租借' },
    ]),
    activities: JSON.stringify([
      {
        image:
          'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600&q=80',
        name: '跳島',
        description:
          '一日之內造訪多座環礁島嶼，體驗不同風格的沙灘與潟湖。',
      },
      {
        image:
          'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&q=80',
        name: '浮潛',
        description:
          '從海灘步行即可抵達珊瑚礁，與小丑魚、海龜一起游泳。',
      },
      {
        image:
          'https://images.unsplash.com/photo-1560275619-4662e36fa65c?w=600&q=80',
        name: '海豚巡遊',
        description:
          '在日落時分出海，觀賞成群海豚躍出水面的壯觀畫面。',
      },
      {
        image:
          'https://images.unsplash.com/photo-1528127269322-539801943592?w=600&q=80',
        name: '本地島嶼文化導覽',
        description:
          '走進居民島，品嚐傳統小吃，參觀手工藝作坊與清真寺。',
      },
      {
        image:
          'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80',
        name: '海灘電影院',
        description:
          '在星空下的沙灘上，躺在懶人沙發中觀賞經典電影。',
      },
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

function lagoonVilla(basePrice: number): Omit<SeedRoomType, 'propertyId'> {
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
    status: 'available',
  }
}

function oceanSuite(basePrice: number): Omit<SeedRoomType, 'propertyId'> {
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
    status: 'available',
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
    ['admin@stayislands.hk', 'Super Admin', 'superadmin', bcryptjs.hashSync('stay1234', 10)]
  )
}

export async function seedDatabase(db: D1Database): Promise<void> {
  await seedAdmin(db)

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
        (name, name_zh, description, description_zh, location, price_per_night, max_guests, image_url, amenities, gallery, facilities, activities, location_details, story, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        property.activities,
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
          (property_id, name, name_zh, description, description_zh, price_per_night, max_guests, inventory, image_url, amenities, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          room.status,
        ]
      )
    }
  }
}
