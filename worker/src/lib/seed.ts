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
  price: number | null
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
    name: "Coral Garden Snorkeling",
    nameZh: "珊瑚群浮潛",
    slug: "coral-garden-snorkeling",
    description: "A guided snorkeling trip to the most popular coral reefs around Thaa Atoll.",
    descriptionZh: "乘船前往人氣珊瑚海域，暢遊五彩珊瑚園，睇盡成群熱帶魚仔。",
    duration: "2 小時",
    groupSize: "2-8 人",
    includes: JSON.stringify(['浮潛裝備', '救生衣', '浴巾', '飲用水']),
    priceNote: '可加購於住宿訂單，按人數計價',
    price: 100,
    imageUrl: "https://images.unsplash.com/photo-1540202404-a2f29016b523?w=800&q=80",
    iconName: "Waves",
    sortOrder: 10,
    status: 'active',
  },
  {
    name: "Two-Spot Snorkeling",
    nameZh: "雙景點浮潛",
    slug: "two-spot-snorkeling",
    description: "Visit two distinct underwater spots in one trip for more marine diversity.",
    descriptionZh: "一次行程暢遊兩大特色海底秘境，欣賞唔同珊瑚地貌同海洋生物，一次玩盡更多海底美景。",
    duration: "3 小時",
    groupSize: "2-8 人",
    includes: JSON.stringify(['浮潛裝備', '救生衣', '浴巾', '飲用水']),
    priceNote: '可加購於住宿訂單，按人數計價',
    price: 100,
    imageUrl: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&q=80",
    iconName: "Waves",
    sortOrder: 11,
    status: 'active',
  },
  {
    name: "Shipwreck & Manta Snorkeling",
    nameZh: "沉船魔鬼魚浮潛",
    slug: "shipwreck-manta-snorkeling",
    description: "Explore an ancient shipwreck teeming with life, then visit the manta ray cleaning station.",
    descriptionZh: "探訪古沉船遺跡，而家已成為熱鬧海洋棲息地，新手老手都適合遊玩。隨後前往魔鬼魚專屬海域，近距離觀賞各種魟魚同魚群自在暢遊。",
    duration: "3 小時",
    groupSize: "2-8 人",
    includes: JSON.stringify(['浮潛裝備', '救生衣', '浴巾', '飲用水']),
    priceNote: '可加購於住宿訂單，按人數計價',
    price: 100,
    imageUrl: "https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=800&q=80",
    iconName: "Waves",
    sortOrder: 12,
    status: 'active',
  },
  {
    name: "Turtle Snorkeling",
    nameZh: "追海龜浮潛",
    slug: "turtle-snorkeling",
    description: "Land on a deserted island to learn about local turtles, then snorkel in their feeding grounds.",
    descriptionZh: "登陸無人小島認識當地海龜品種，再出海去到海龜棲息海域暢遊，欣賞五彩魚群，玩夠仲可以留係沙灘輕鬆放空。",
    duration: "3 小時",
    groupSize: "2-8 人",
    includes: JSON.stringify(['浮潛裝備', '救生衣', '浴巾', '飲用水']),
    priceNote: '可加購於住宿訂單，按人數計價',
    price: 100,
    imageUrl: "https://images.unsplash.com/photo-1544144433-d50aff500b91?w=800&q=80",
    iconName: "Waves",
    sortOrder: 13,
    status: 'active',
  },
  {
    name: "Guided Surf Trip",
    nameZh: "專業嚮導衝浪行",
    slug: "guided-surf-trip",
    description: "Daily guided surf trips to the best local breaks around Mikado / Finimas.",
    descriptionZh: "每日精選本地最佳浪點，享受暢快滑浪體驗。資深嚮導會因應當日水流、潮汐、風向同浪況，帶大家前往最合適嘅衝浪地點。",
    duration: "4 小時",
    groupSize: "2-6 人",
    includes: JSON.stringify(['飲用水']),
    priceNote: '可加購於住宿訂單，按人數計價',
    price: 100,
    imageUrl: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&q=80",
    iconName: "Waves",
    sortOrder: 20,
    status: 'active',
  },
  {
    name: "Surf Lesson",
    nameZh: "初級至進階衝浪課程",
    slug: "surf-lesson",
    description: "One-on-one surf coaching for beginners to advanced surfers.",
    descriptionZh: "由資深滑浪教練一對一授課，不論初學入門還是進階提升都得。",
    duration: "3 小時",
    groupSize: "1-2 人",
    includes: JSON.stringify(['專業教練', '衝浪板', '飲用水']),
    priceNote: '可加購於住宿訂單，按人數計價',
    price: 100,
    imageUrl: "https://images.unsplash.com/photo-1526344966-89049886b28d?w=800&q=80",
    iconName: "Waves",
    sortOrder: 21,
    status: 'active',
  },
  {
    name: "Group Yoga Class",
    nameZh: "團體瑜伽課",
    slug: "group-yoga-class",
    description: "A group yoga session to stretch, strengthen and energize your day.",
    descriptionZh: "一齊舒展筋骨、強健身心，煥發全日活力。",
    duration: "約 1 小時",
    groupSize: "2-10 人",
    includes: JSON.stringify(['瑜伽墊', '瑜伽磚']),
    priceNote: '可加購於住宿訂單，按人數計價',
    price: 100,
    imageUrl: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80",
    iconName: "Sun",
    sortOrder: 30,
    status: 'active',
  },
  {
    name: "Private Yoga Session",
    nameZh: "一對一私人瑜伽",
    slug: "private-yoga-session",
    description: "A personalized yoga session tailored to your needs in a peaceful setting.",
    descriptionZh: "按你個人需要度身訂造瑜伽課程，喺寧靜環境享受專屬體驗。",
    duration: "約 1 小時",
    groupSize: "1-2 人",
    includes: JSON.stringify(['瑜伽墊', '瑜伽磚']),
    priceNote: '可加購於住宿訂單，按人數計價',
    price: 100,
    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
    iconName: "Sun",
    sortOrder: 31,
    status: 'active',
  },
  {
    name: "Traditional Night Fishing",
    nameZh: "傳統馬代風夜釣",
    slug: "traditional-night-fishing",
    description: "Experience authentic Maldivian hand-line fishing at night.",
    descriptionZh: "沿用當地世代相傳手絲釣法，體驗地道馬爾代夫夜釣樂趣。釣獲漁獲可安排翌日烹煮作晚餐。",
    duration: "約 3 小時",
    groupSize: "2-8 人",
    includes: JSON.stringify(['手釣絲', '魚餌', '小食', '飲用水']),
    priceNote: '可加購於住宿訂單，按人數計價',
    price: 100,
    imageUrl: "https://images.unsplash.com/photo-1500514966906-fe245eea9344?w=800&q=80",
    iconName: "Fish",
    sortOrder: 40,
    status: 'active',
  },
  {
    name: "Deep Sea Big Game Fishing",
    nameZh: "深海巨物垂釣",
    slug: "deep-sea-big-game-fishing",
    description: "A deep-sea fishing adventure targeting marlin, tuna, sailfish and more.",
    descriptionZh: "塔環礁屬頂級釣場，海洋物種豐富，可釣獲旗魚、吞拿魚、馬林魚、竹莢魚、鯕鰍、牛港鰺等名貴海魚。",
    duration: "約 5 小時",
    groupSize: "最多 4 人",
    includes: JSON.stringify(['全套釣具', '早餐套餐', '汽水', '飲用水']),
    priceNote: '可加購於住宿訂單，按人數計價',
    price: 100,
    imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
    iconName: "Fish",
    sortOrder: 41,
    status: 'active',
  },
  {
    name: "Half-day Sea Fishing",
    nameZh: "半日出海釣魚",
    slug: "half-day-sea-fishing",
    description: "A half-day sea fishing trip with all equipment and lunch provided.",
    descriptionZh: "半日出海釣魚行程，提供全套釣具同精緻午餐。",
    duration: "約 5 小時",
    groupSize: "最多 4 人",
    includes: JSON.stringify(['全套釣具', '精緻午餐', '汽水', '飲用水']),
    priceNote: '可加購於住宿訂單，按人數計價',
    price: 100,
    imageUrl: "https://images.unsplash.com/photo-1540202404-a2f29016b523?w=800&q=80",
    iconName: "Fish",
    sortOrder: 42,
    status: 'active',
  },
  {
    name: "Full-day Sea Fishing",
    nameZh: "全日出海海釣",
    slug: "full-day-sea-fishing",
    description: "A full-day offshore fishing expedition in the rich waters of Thaa Atoll.",
    descriptionZh: "全日出海海釣，盡享塔環礁豐富漁獲。",
    duration: "全日",
    groupSize: "最多 4 人",
    includes: JSON.stringify(['全套釣具', '午餐', '汽水', '飲用水']),
    priceNote: '可加購於住宿訂單，按人數計價',
    price: 100,
    imageUrl: "https://images.unsplash.com/photo-1500514966906-fe245eea9344?w=800&q=80",
    iconName: "Fish",
    sortOrder: 43,
    status: 'active',
  },
  {
    name: "Local Island Culture Tour",
    nameZh: "居民島文化遊",
    slug: "local-island-culture-tour",
    description: "Speedboat tour to two local islands to experience Maldivian culture and hospitality.",
    descriptionZh: "搭乘快艇遊覽兩座本土居民島，感受馬代在地風情與人文特色。",
    duration: "4 小時",
    groupSize: "2-8 人",
    includes: JSON.stringify(['島上地道馬爾代夫風味午餐']),
    priceNote: '可加購於住宿訂單，按人數計價',
    price: 100,
    imageUrl: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80",
    iconName: "MapPin",
    sortOrder: 50,
    status: 'active',
  },
  {
    name: "Uninhabited Island Half-day",
    nameZh: "無人島暢遊半日行程",
    slug: "uninhabited-island-half-day",
    description: "Explore a pristine uninhabited island with snorkeling and water activities.",
    descriptionZh: "暢遊原生無人島，暢玩浮潛同水上活動，於沙灘享用特色午餐。",
    duration: "4 小時",
    groupSize: "2-8 人",
    includes: JSON.stringify(['浮潛裝備', '浴巾', '飲用水', '獨木舟']),
    priceNote: '可加購於住宿訂單，按人數計價',
    price: 100,
    imageUrl: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80",
    iconName: "Ship",
    sortOrder: 51,
    status: 'active',
  },
  {
    name: "Uninhabited Island Full-day",
    nameZh: "無人島暢遊全日行程",
    slug: "uninhabited-island-full-day",
    description: "A full-day escape to an uninhabited island with lunch and water sports.",
    descriptionZh: "遠離喧囂走進世外桃源，盡享澄澈碧海、綿軟白沙與絕美日落，全日行程暢玩浮潛、獨木舟等水上活動。",
    duration: "8 小時",
    groupSize: "2-8 人",
    includes: JSON.stringify(['浮潛裝備', '浴巾', '午餐', '飲用水', '獨木舟']),
    priceNote: '可加購於住宿訂單，按人數計價',
    price: 100,
    imageUrl: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80",
    iconName: "Ship",
    sortOrder: 52,
    status: 'active',
  },
  {
    name: "Private Island Picnic Half-day",
    nameZh: "私人島嶼沙灘野餐半日行程",
    slug: "private-island-picnic-half-day",
    description: "A short boat ride to your own private island for a beach picnic and water fun.",
    descriptionZh: "乘船數分鐘直達專屬私人小島，愜意享受沙灘野餐與各式島上玩樂。",
    duration: "4 小時",
    groupSize: "2-6 人",
    includes: JSON.stringify(['浮潛裝備', '浴巾', '午餐', '飲用水', '獨木舟', '直立板', '玻璃底船']),
    priceNote: '可加購於住宿訂單，按人數計價',
    price: 100,
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    iconName: "Umbrella",
    sortOrder: 53,
    status: 'active',
  },
  {
    name: "Private Island Picnic Full-day",
    nameZh: "私人島嶼沙灘野餐全日行程",
    slug: "private-island-picnic-full-day",
    description: "A full-day private island experience with lunch, snorkeling and water sports.",
    descriptionZh: "全日專屬私人小島體驗，暢玩浮潛、直立板、玻璃底船等水上活動，享用沙灘午餐。",
    duration: "8 小時",
    groupSize: "2-6 人",
    includes: JSON.stringify(['浮潛裝備', '浴巾', '午餐', '飲用水', '獨木舟', '直立板', '玻璃底船']),
    priceNote: '可加購於住宿訂單，按人數計價',
    price: 100,
    imageUrl: "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800&q=80",
    iconName: "Umbrella",
    sortOrder: 54,
    status: 'active',
  },
  {
    name: "Private Island Overnight Camping",
    nameZh: "私人島嶼露營過夜",
    slug: "private-island-overnight-camping",
    description: "Spend the night on your own private island under the stars with beach BBQ and water sports.",
    descriptionZh: "獨佔私人小島仰望滿天星空，品嘗燒烤晚餐、暢玩水上活動，盡享遠離喧囂嘅自然寧靜。",
    duration: "當日 16:00 至 翌日 07:00",
    groupSize: "2-6 人",
    includes: JSON.stringify(['露營帳篷', '浴巾', '沙灘燒烤晚餐', '飲用水', '獨木舟', '直立板', '玻璃底船']),
    priceNote: '可加購於住宿訂單，按人數計價',
    price: 100,
    imageUrl: "https://images.unsplash.com/photo-1537905569824-f89f14cceb68?w=800&q=80",
    iconName: "Tent",
    sortOrder: 55,
    status: 'active',
  },
  {
    name: "Private Island BBQ Dinner",
    nameZh: "私人島嶼之旅連沙灘燒烤晚",
    slug: "private-island-bbq-dinner",
    description: "Beachside BBQ feast with seafood, meats and tropical desserts by the sea.",
    descriptionZh: "臨海享用海鮮及肉類燒烤盛宴，搭配熱帶小食同特色甜點，伴隨營火氣氛十足。",
    duration: "6 小時",
    groupSize: "2-8 人",
    includes: JSON.stringify(['浮潛裝備', '浴巾', '海灘燒烤晚餐', '飲用水', '各式水上船具']),
    priceNote: '可加購於住宿訂單，按人數計價',
    price: 100,
    imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
    iconName: "Flame",
    sortOrder: 56,
    status: 'active',
  },
  {
    name: "Drone Aerial Photography",
    nameZh: "無人機航拍拍攝",
    slug: "drone-aerial-photography",
    description: "Capture stunning aerial photos and videos of your island adventure.",
    descriptionZh: "以高空視角定格旅途精彩瞬間，不論島嶼遊玩、水上活動或是慶祝特別日子，都可以拍出高質量靚相短片，情侶、家庭、獨遊旅客都非常適合。",
    duration: "約 1 小時",
    groupSize: "1-6 人",
    includes: JSON.stringify(['高清航拍相片及影片', '透過網絡鏈接或 USB 發送檔案']),
    priceNote: '可加購於住宿訂單，按人數計價',
    price: 100,
    imageUrl: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&q=80",
    iconName: "Camera",
    sortOrder: 60,
    status: 'active',
  },
  {
    name: "Couples Romantic Beach Dinner",
    nameZh: "情侶專屬沙灘浪漫晚餐",
    slug: "couples-romantic-beach-dinner",
    description: "A candlelit beach dinner for two, perfect for celebrating special moments.",
    descriptionZh: "於海邊享用溫馨燭光晚餐，慶祝各種浪漫時刻。",
    duration: "約 2-3 小時",
    groupSize: "2 人",
    includes: JSON.stringify(['沙灘燭光佈置', '專屬三道菜晚餐', '無酒精特調飲品', '專人貼心服務']),
    priceNote: '可加購於住宿訂單，按人數計價',
    price: 100,
    imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
    iconName: "Heart",
    sortOrder: 61,
    status: 'active',
  },
  {
    name: "Scuba Diving Experience",
    nameZh: "潛水體驗",
    slug: "scuba-diving-experience",
    description: "Explore Thaa Atoll's famous dive sites with professional instructors and well-equipped dive center.",
    descriptionZh: "暢遊塔環礁絕美海底世界，此地係馬爾代夫極具人氣嘅潛水勝地。可前往奧胡吉利水道等知名潛點，近距離觀賞白鰭礁鯊、蝠鱝、鰺魚與金槍魚；亦可遊覽七色彩虹珊瑚園，或是在柳珊瑚園欣賞巨型海扇，偶遇季節性出沒嘅魔鬼魚。潛水中心設備齊全，持有專業資格教練全程貼心指導，不論新手入門抑或是資深潛水愛好者，都能安心暢遊海底。",
    duration: "半日或全日",
    groupSize: "1-4 人",
    includes: JSON.stringify(['專業潛水教練', '全套潛水裝備', '潛點導覽']),
    priceNote: '可加購於住宿訂單，按人數計價',
    price: 100,
    imageUrl: "https://images.unsplash.com/photo-1582967788606-a171f1080ca8?w=800&q=80",
    iconName: "Waves",
    sortOrder: 70,
    status: 'active',
  },
  {
    name: "Sunset Cruise",
    nameZh: "日落巡航",
    slug: "sunset-cruise",
    description: "Sail into the golden hour with champagne in hand, watching dolphins leap across the horizon.",
    descriptionZh: "在金色夕陽中出海，看海豚躍出水面，為一天畫下完美句點。",
    duration: "2 小時",
    groupSize: "2-12 人",
    includes: JSON.stringify(['香檳／飲料', '小點', '船上音樂']),
    priceNote: '可加購於住宿訂單，按人數計價',
    price: 100,
    imageUrl: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80",
    iconName: "Sunset",
    sortOrder: 80,
    status: 'active',
  },
  {
    name: "Whale Shark & Manta Encounter",
    nameZh: "鯨鯊與魔鬼魚共游",
    slug: "whale-shark-manta",
    description: "Swim alongside gentle whale sharks and manta rays in South Ari Atoll — a once-in-a-lifetime ocean encounter.",
    descriptionZh: "在 South Ari 環礁與溫柔的鯨鯊和魔鬼魚同游，一生難忘的海洋奇遇。",
    duration: "半日",
    groupSize: "2-6 人",
    includes: JSON.stringify(['專業船長', '浮潛裝備', '海洋生物解說']),
    priceNote: '可加購於住宿訂單，按人數計價',
    price: 100,
    imageUrl: "https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=800&q=80",
    iconName: "Sparkles",
    sortOrder: 81,
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
        (name, name_zh, slug, description, description_zh, duration, group_size, includes, price, price_note, image_url, icon_name, sort_order, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`,
      [
        exp.name,
        exp.nameZh,
        exp.slug,
        exp.description,
        exp.descriptionZh,
        exp.duration,
        exp.groupSize,
        exp.includes,
        exp.price,
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
