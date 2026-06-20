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
    status: 'active',
  },
  {
    name: 'Private Island',
    nameZh: '私享島嶼',
    description: 'An exclusive private island retreat for the ultimate privacy.',
    descriptionZh:
      '整島出租的頂級私人島嶼，擁有私人沙灘、廚師團隊與遊艇，適合家族或高端團體的私密度假體驗。',
    location: 'Baa Atoll, Maldives',
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
    status: 'active',
  },
  {
    name: 'Stay Madivaru',
    nameZh: '碧海灣',
    description: 'Beachfront villas with direct reef access.',
    descriptionZh:
      '沙灘別墅直通珊瑚礁，浮潛與潛水愛好者的天堂，每晚皆可安排海灘晚餐與日落巡航。',
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
        (name, name_zh, description, description_zh, location, price_per_night, max_guests, image_url, amenities, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
