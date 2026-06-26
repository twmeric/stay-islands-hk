#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate SQL to backfill CMS seed data into remote D1."""
import json
from pathlib import Path


def sql_escape(value: str | None) -> str:
    if value is None:
        return "NULL"
    # Replace single quotes with doubled single quotes for SQL escaping.
    text = str(value).replace("'", "''")
    return f"'{text}'"


properties = [
    {
        "id": 1,
        "name_zh": "御海閣",
        "description": "A boutique overwater villa collection in the Maldives.",
        "description_zh": "御海閣坐落於馬爾代夫清澈潟湖之上，提供私密而奢華的度假體驗。每棟水上別墅均配備私人泳池、玻璃地板與無邊際海景，並由專屬管家團隊提供全天候服務。",
        "location": "North Malé Atoll, Maldives",
        "price_per_night": 4800,
        "max_guests": 4,
        "image_url": "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80",
        "amenities": ["私人泳池", "水上飛機接送", "24 小時管家", "浮潛裝備", "海鮮晚餐", "SPA"],
        "gallery": [
            "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80",
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
            "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80",
            "https://images.unsplash.com/photo-1544144433-d50aff500b91?w=800&q=80",
            "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80",
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
        ],
        "facilities": [
            {"icon": "🏊", "label": "私人泳池"},
            {"icon": "✈️", "label": "水上飛機接送"},
            {"icon": "🎩", "label": "24 小時管家"},
            {"icon": "🤿", "label": "浮潛裝備"},
            {"icon": "🦞", "label": "海鮮晚餐"},
            {"icon": "💆", "label": "SPA"},
            {"icon": "🧘", "label": "瑜伽亭"},
            {"icon": "🏖️", "label": "私人甲板"},
        ],
        "activities": [
            {
                "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
                "name": "日落巡航",
                "description": "乘著傳統多尼船駛向潟湖盡頭，在香檳與夕陽中結束完美的一天。",
            },
            {
                "image": "https://images.unsplash.com/photo-1544551762-46a013bb70d5?w=600&q=80",
                "name": "夜釣",
                "description": "跟隨當地漁民出海，在星空下學習傳統釣法，收穫可交由廚師即席烹調。",
            },
            {
                "image": "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&q=80",
                "name": "浮潛",
                "description": "從別墅甲板直接下水，與熱帶魚群、海龜和珊瑚礁不期而遇。",
            },
            {
                "image": "https://images.unsplash.com/photo-1560275619-4662e36fa65c?w=600&q=80",
                "name": "深潛",
                "description": "PADI 認證潛水中心帶你探索 North Malé 環礁的著名潛點。",
            },
            {
                "image": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80",
                "name": "無人島野餐",
                "description": "包下一座無人沙洲，享受只屬於你的燭光午餐與澄澈海水。",
            },
        ],
        "location_details": {
            "description": "御海閣位於 North Malé Atoll，距離馬累國際機場約 30 分鐘水上飛機航程，是馬爾代夫最經典的潟湖區域之一。",
            "mapImage": "https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&q=80",
            "nearby": [
                "馬累國際機場：30 分鐘水上飛機",
                "著名潛點 Manta Point：約 20 分鐘船程",
                "當地漁村：約 15 分鐘快艇",
                "無人沙洲：約 10 分鐘快艇",
            ],
        },
        "story": {
            "title": "御海閣的故事",
            "content": "御海閣誕生於一片被保育完好的潟湖之上，每一棟別墅都以馬爾代夫傳統工藝與現代極簡設計融合。島主希望每位客人不是「入住」一座度假村，而是回歸一片屬於自己的海洋。從日出時管家送來的咖啡，到深夜玻璃地板下緩緩游過的海龜，御海閣相信：真正的奢華，是讓時間慢下來。",
        },
    },
    {
        "id": 2,
        "name_zh": "私享島嶼",
        "description": "An exclusive private island retreat for the ultimate privacy.",
        "description_zh": "整座島嶼只為你與你的摯愛開放。私享島嶼擁有頂級私人管家、米其林主廚團隊與獨立高爾夫球場，是家族團聚、高端慶典與私密靜修的理想之地。",
        "location": "Noonu Atoll, Maldives",
        "price_per_night": 12800,
        "max_guests": 12,
        "image_url": "https://images.unsplash.com/photo-1688949078626-a358f500e063?w=1200&q=80",
        "amenities": ["私人島嶼", "廚師團隊", "遊艇", "管家服務", "SPA", "私人影院"],
        "gallery": [
            "https://images.unsplash.com/photo-1688949078626-a358f500e063?w=1200&q=80",
            "https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?w=800&q=80",
            "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
            "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80",
            "https://images.unsplash.com/photo-1437719417032-8595fd9e9dc6?w=800&q=80",
            "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800&q=80",
        ],
        "facilities": [
            {"icon": "👨‍💼", "label": "私人島嶼管家"},
            {"icon": "👨‍🍳", "label": "米其林主廚餐廳"},
            {"icon": "⛳", "label": "高爾夫球場"},
            {"icon": "🚣", "label": "水上運動中心"},
            {"icon": "🧸", "label": "兒童俱樂部"},
            {"icon": "💒", "label": "婚禮場地"},
            {"icon": "🛥️", "label": "私人遊艇"},
            {"icon": "🎬", "label": "私人影院"},
        ],
        "activities": [
            {
                "image": "https://images.unsplash.com/photo-1560275619-4662e36fa65c?w=600&q=80",
                "name": "鯨鯊共游",
                "description": "在專業嚮導陪同下，與溫柔的海洋巨人同游，感受生命的壯闊。",
            },
            {
                "image": "https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=600&q=80",
                "name": "海龜保育體驗",
                "description": "參與島嶼保育計畫，了解海龜的生活史，並協助記錄與放生。",
            },
            {
                "image": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80",
                "name": "沙洲燭光晚餐",
                "description": "在只屬於你的沙洲上，由主廚現場烹調，侍酒師搭配美酒。",
            },
            {
                "image": "https://images.unsplash.com/photo-1528127269322-539801943592?w=600&q=80",
                "name": "傳統漁村探訪",
                "description": "走訪 Noonu 環礁的傳統漁村，認識馬爾代夫的日常生活與手工藝。",
            },
            {
                "image": "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&q=80",
                "name": "環礁浮潛",
                "description": "探索 Noonu 環礁豐富的珊瑚花園與熱帶魚群，適合各級泳者。",
            },
        ],
        "location_details": {
            "description": "私享島嶼坐落於 Noonu Atoll 的靜謐海域，這裡以豐富的海洋生態與原始珊瑚礁聞名，從馬累國際機場可乘內陸航班或水上飛機抵達。",
            "mapImage": "https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&q=80",
            "nearby": [
                "馬累國際機場：約 45 分鐘水上飛機",
                "鯨鯊熱點：約 30 分鐘船程",
                "傳統漁村：約 20 分鐘快艇",
                "無人沙洲：約 10 分鐘快艇",
            ],
        },
        "story": {
            "title": "私享島嶼的故事",
            "content": "這座島嶼的名字源於當地語言中的「海龜」。數十年來，這裡一直是綠蠵龜與玳瑁上岸產卵的秘境。現任島主買下島嶼後，堅持只開放給極少數客人，並將大部分海岸線留給自然與保育。在私享島嶼，沒有「其他住客」，只有你的家人、朋友、管家，以及偶爾上岸產卵的海龜。",
        },
    },
    {
        "id": 3,
        "name_zh": "碧海灣",
        "description": "Beachfront villas with direct reef access.",
        "description_zh": "碧海灣是家庭與團體旅客的理想海濱別墅，擁有私人海灘、共用泳池與完整廚房設備。這裡氛圍輕鬆自在，讓你像當地人一樣生活，同時享受馬爾代夫的絕美海景。",
        "location": "South Ari Atoll, Maldives",
        "price_per_night": 3200,
        "max_guests": 3,
        "image_url": "https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?w=1200&q=80",
        "amenities": ["珊瑚礁", "浮潛", "海灘晚餐", "潛水中心", "日落巡航"],
        "gallery": [
            "https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?w=1200&q=80",
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
            "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
            "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80",
            "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&q=80",
        ],
        "facilities": [
            {"icon": "🏖️", "label": "私人海灘"},
            {"icon": "🏊‍♀️", "label": "共用泳池"},
            {"icon": "🍳", "label": "廚房設備"},
            {"icon": "🔥", "label": "BBQ 區"},
            {"icon": "🤿", "label": "浮潛中心"},
            {"icon": "🎮", "label": "遊戲室"},
            {"icon": "📽️", "label": "海灘電影院"},
            {"icon": "🚲", "label": "自行車租借"},
        ],
        "activities": [
            {
                "image": "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600&q=80",
                "name": "跳島",
                "description": "一日之內造訪多座環礁島嶼，體驗不同風格的沙灘與潟湖。",
            },
            {
                "image": "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&q=80",
                "name": "浮潛",
                "description": "從海灘步行即可抵達珊瑚礁，與小丑魚、海龜一起游泳。",
            },
            {
                "image": "https://images.unsplash.com/photo-1560275619-4662e36fa65c?w=600&q=80",
                "name": "海豚巡遊",
                "description": "在日落時分出海，觀賞成群海豚躍出水面的壯觀畫面。",
            },
            {
                "image": "https://images.unsplash.com/photo-1528127269322-539801943592?w=600&q=80",
                "name": "本地島嶼文化導覽",
                "description": "走進居民島，品嚐傳統小吃，參觀手工藝作坊與清真寺。",
            },
            {
                "image": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80",
                "name": "海灘電影院",
                "description": "在星空下的沙灘上，躺在懶人沙發中觀賞經典電影。",
            },
        ],
        "location_details": {
            "description": "碧海灣位於 South Ari Atoll，這裡是馬爾代夫最著名的鯨鯊全年出沒熱點，從馬累國際機場出發約 25 分鐘內陸航班再加 15 分鐘快艇即可抵達。",
            "mapImage": "https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&q=80",
            "nearby": [
                "馬累國際機場：約 25 分鐘內陸航班 + 15 分鐘快艇",
                "鯨鯊觀賞點：約 20 分鐘船程",
                "本地居民島：約 10 分鐘快艇",
                "珊瑚礁：步行可達",
            ],
        },
        "story": {
            "title": "碧海灣的故事",
            "content": "碧海灣原為當地漁村家族世代守護的海岸。島主從小在這片海灘長大，熟悉每一處珊瑚礁與每一群魚的出沒時間。他將家族土地改建為別墅時，堅持保留原有的椰林、沙灘與礁石，並聘請當地漁民擔任嚮導。來到碧海灣，你會發現這裡不只有美景，還有與海洋共處數代人的溫度。",
        },
    },
]

room_types = [
    {
        "id": 1,
        "property_id": 1,
        "name": "Lagoon Villa",
        "name_zh": "潟湖別墅",
        "description": "Overwater villa with lagoon views.",
        "description_zh": "坐擁潟湖美景的水上別墅，配備私人露台與下沉式沙發。",
        "price_per_night": 4800,
        "max_guests": 2,
        "inventory": 3,
        "image_url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600",
        "amenities": ["海景露台", "浴缸", "空調", "Wi-Fi"],
        "bed_type": "King",
        "view": "Lagoon View",
        "size_sqm": 65,
        "occupancy": "2 Adults",
        "gallery": [
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
            "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80",
        ],
        "features": ["私人露台", "下沉式沙發", "海景浴缸", "空調", "Wi-Fi"],
    },
    {
        "id": 2,
        "property_id": 1,
        "name": "Ocean Suite",
        "name_zh": "海洋套房",
        "description": "Spacious suite with private pool.",
        "description_zh": "寬敞海洋套房，設有私人無邊際泳池與獨立客廳。",
        "price_per_night": 7800,
        "max_guests": 4,
        "inventory": 2,
        "image_url": "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600",
        "amenities": ["私人泳池", "客廳", "管家服務", "迎賓香檳"],
        "bed_type": "2 King",
        "view": "Ocean View",
        "size_sqm": 110,
        "occupancy": "4 Adults",
        "gallery": [
            "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80",
            "https://images.unsplash.com/photo-1544144433-d50aff500b91?w=800&q=80",
        ],
        "features": ["私人無邊際泳池", "獨立客廳", "迎賓香檳", "管家服務"],
    },
    {
        "id": 3,
        "property_id": 2,
        "name": "Lagoon Villa",
        "name_zh": "潟湖別墅",
        "description": "Overwater villa with lagoon views.",
        "description_zh": "坐擁潟湖美景的水上別墅，配備私人露台與下沉式沙發。",
        "price_per_night": 12800,
        "max_guests": 2,
        "inventory": 3,
        "image_url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600",
        "amenities": ["海景露台", "浴缸", "空調", "Wi-Fi"],
        "bed_type": "King",
        "view": "Lagoon View",
        "size_sqm": 65,
        "occupancy": "2 Adults",
        "gallery": [
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
            "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80",
        ],
        "features": ["私人露台", "下沉式沙發", "海景浴缸", "空調", "Wi-Fi"],
    },
    {
        "id": 4,
        "property_id": 2,
        "name": "Ocean Suite",
        "name_zh": "海洋套房",
        "description": "Spacious suite with private pool.",
        "description_zh": "寬敞海洋套房，設有私人無邊際泳池與獨立客廳。",
        "price_per_night": 20800,
        "max_guests": 4,
        "inventory": 2,
        "image_url": "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600",
        "amenities": ["私人泳池", "客廳", "管家服務", "迎賓香檳"],
        "bed_type": "2 King",
        "view": "Ocean View",
        "size_sqm": 110,
        "occupancy": "4 Adults",
        "gallery": [
            "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80",
            "https://images.unsplash.com/photo-1544144433-d50aff500b91?w=800&q=80",
        ],
        "features": ["私人無邊際泳池", "獨立客廳", "迎賓香檳", "管家服務"],
    },
    {
        "id": 5,
        "property_id": 3,
        "name": "Lagoon Villa",
        "name_zh": "潟湖別墅",
        "description": "Overwater villa with lagoon views.",
        "description_zh": "坐擁潟湖美景的水上別墅，配備私人露台與下沉式沙發。",
        "price_per_night": 3200,
        "max_guests": 2,
        "inventory": 3,
        "image_url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600",
        "amenities": ["海景露台", "浴缸", "空調", "Wi-Fi"],
        "bed_type": "King",
        "view": "Lagoon View",
        "size_sqm": 65,
        "occupancy": "2 Adults",
        "gallery": [
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
            "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80",
        ],
        "features": ["私人露台", "下沉式沙發", "海景浴缸", "空調", "Wi-Fi"],
    },
    {
        "id": 6,
        "property_id": 3,
        "name": "Ocean Suite",
        "name_zh": "海洋套房",
        "description": "Spacious suite with private pool.",
        "description_zh": "寬敞海洋套房，設有私人無邊際泳池與獨立客廳。",
        "price_per_night": 5200,
        "max_guests": 4,
        "inventory": 2,
        "image_url": "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600",
        "amenities": ["私人泳池", "客廳", "管家服務", "迎賓香檳"],
        "bed_type": "2 King",
        "view": "Ocean View",
        "size_sqm": 110,
        "occupancy": "4 Adults",
        "gallery": [
            "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80",
            "https://images.unsplash.com/photo-1544144433-d50aff500b91?w=800&q=80",
        ],
        "features": ["私人無邊際泳池", "獨立客廳", "迎賓香檳", "管家服務"],
    },
]

experiences = [
    {
        "name": "Night Fishing Trip",
        "name_zh": "夜釣之旅",
        "slug": "night-fishing",
        "description": "Set sail under the stars, learn traditional Maldivian fishing techniques, and enjoy a freshly cooked seafood dinner on board.",
        "description_zh": "在星空下出海，學習傳統釣魚技巧，現釣現煮的海鮮晚餐是最大回報。",
        "duration": "3-4 小時",
        "group_size": "2-8 人",
        "includes": ["專業漁夫", "釣具", "船上晚餐", "飲料"],
        "price_note": "按行程報價",
        "image_url": "https://images.unsplash.com/photo-1500514966906-fe245eea9344?w=800&q=80",
        "icon_name": "Fish",
        "sort_order": 1,
        "status": "active",
    },
    {
        "name": "Snorkeling & Diving",
        "name_zh": "浮潛與潛水",
        "slug": "snorkeling-diving",
        "description": "Explore vibrant coral gardens and swim alongside turtles and tropical fish. Routes available for beginners to certified divers.",
        "description_zh": "探索環礁珊瑚花園，與海龜、熱帶魚共游，從初學者到持證潛水員都能找到適合路線。",
        "duration": "半日或全日",
        "group_size": "2-6 人",
        "includes": ["裝備", "專業教練", "船程", "午餐"],
        "price_note": "按行程報價",
        "image_url": "https://images.unsplash.com/photo-1540202404-a2f29016b523?w=800&q=80",
        "icon_name": "Waves",
        "sort_order": 2,
        "status": "active",
    },
    {
        "name": "Sunset Cruise",
        "name_zh": "日落巡航",
        "slug": "sunset-cruise",
        "description": "Sail into the golden hour with champagne in hand, watching dolphins leap across the horizon.",
        "description_zh": "在金色夕陽中出海，看海豚躍出水面，為一天畫下完美句點。",
        "duration": "2 小時",
        "group_size": "2-12 人",
        "includes": ["香檳／飲料", "小點", "船上音樂"],
        "price_note": "按行程報價",
        "image_url": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80",
        "icon_name": "Sunset",
        "sort_order": 3,
        "status": "active",
    },
    {
        "name": "Island Hopping",
        "name_zh": "跳島探索",
        "slug": "island-hopping",
        "description": "Visit uninhabited islands and local communities in one day, experiencing the many faces of the Maldives.",
        "description_zh": "一天穿梭多座無人島與本地島嶼，感受馬爾代夫的多元面貌。",
        "duration": "全日",
        "group_size": "4-10 人",
        "includes": ["船程", "導覽", "沙洲午餐", "浮潛"],
        "price_note": "按行程報價",
        "image_url": "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80",
        "icon_name": "Ship",
        "sort_order": 4,
        "status": "active",
    },
    {
        "name": "Whale Shark & Manta Encounter",
        "name_zh": "鯨鯊與魔鬼魚共游",
        "slug": "whale-shark-manta",
        "description": "Swim alongside gentle whale sharks and manta rays in South Ari Atoll — a once-in-a-lifetime ocean encounter.",
        "description_zh": "在 South Ari 環礁與溫柔的鯨鯊和魔鬼魚同游，一生難忘的海洋奇遇。",
        "duration": "半日",
        "group_size": "2-6 人",
        "includes": ["專業船長", "浮潛裝備", "海洋生物解說"],
        "price_note": "按行程報價",
        "image_url": "https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=800&q=80",
        "icon_name": "Sparkles",
        "sort_order": 5,
        "status": "active",
    },
    {
        "name": "Local Island Visit",
        "name_zh": "本地島嶼文化體驗",
        "slug": "local-island",
        "description": "Step into a Maldivian community to learn about local crafts, fishing village life, and island stories.",
        "description_zh": "走進馬爾代夫本地社區，了解傳統工藝、漁村生活與島嶼故事。",
        "duration": "半日",
        "group_size": "2-8 人",
        "includes": ["當地導遊", "文化導覽", "傳統小點"],
        "price_note": "按行程報價",
        "image_url": "https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?w=800&q=80",
        "icon_name": "MapPin",
        "sort_order": 6,
        "status": "active",
    },
]

retreats = [
    {
        "name": "Yoga & Adventure Retreat",
        "name_zh": "瑜伽與冒險靜修",
        "slug": "yoga-adventure",
        "description": "Begin each day with sunrise yoga and meditation, spend afternoons snorkeling or exploring uninhabited islands, and unwind under the stars.",
        "description_zh": "每日晨間瑜伽、冥想，下午安排浮潛、無人島探險，晚上享受星空下的放鬆。",
        "duration": "8 天 7 晚",
        "location": "North Malé Atoll",
        "audience": "瑜伽練習者、想要身心平衡的旅客",
        "itinerary": [
            {"day": "Day 1", "title": "抵達", "desc": "迎賓晚餐、日落冥想"},
            {"day": "Day 2-6", "title": "瑜伽與冒險", "desc": "晨間瑜伽、活動體驗、自由時間"},
            {"day": "Day 7", "title": "文化與告別", "desc": "文化導覽、告別晚宴"},
            {"day": "Day 8", "title": "離島", "desc": "帶著平靜的心啟程"},
        ],
        "price_note": "按人數與房型報價",
        "image_url": "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80",
        "icon_name": "Leaf",
        "sort_order": 1,
        "status": "active",
    },
    {
        "name": "Surf Retreat",
        "name_zh": "衝浪靜修",
        "slug": "surf",
        "description": "Led by experienced surf coaches, this retreat takes you to the best breaks in the Maldives for learning, practice, and pure wave joy.",
        "description_zh": "由經驗豐富的衝浪教練帶領，前往馬爾代夫最佳浪點，學習、練習、享受海浪。",
        "duration": "8 天 7 晚",
        "location": "South Malé / Central Atolls",
        "audience": "初學者到中級衝浪者",
        "itinerary": [
            {"day": "Day 1", "title": "適應日", "desc": "抵達、浪況介紹、歡迎晚餐"},
            {"day": "Day 2-4", "title": "浪點探索", "desc": "每日兩次衝浪、教練指導"},
            {"day": "Day 5-6", "title": "影片分析", "desc": "動作檢討、自由衝浪"},
            {"day": "Day 7", "title": "告別派對", "desc": "最後一浪、海灘派對"},
            {"day": "Day 8", "title": "離島", "desc": "帶著新技巧回家"},
        ],
        "price_note": "按人數與房型報價",
        "image_url": "https://images.unsplash.com/photo-1502680390469-be436bb09401?w=800&q=80",
        "icon_name": "Waves",
        "sort_order": 2,
        "status": "active",
    },
    {
        "name": "Couple Getaway",
        "name_zh": "浪漫雙人靜修",
        "slug": "couple",
        "description": "Private sandbank dinners, couples spa, sunset cruises, and uninhabited island picnics — create memories made just for two.",
        "description_zh": "私人沙洲晚餐、雙人 SPA、日落巡航、無人島野餐，為兩人創造專屬回憶。",
        "duration": "8 天 7 晚",
        "location": "North Malé Atoll",
        "audience": "情侶、蜜月、週年紀念",
        "itinerary": [
            {"day": "Day 1", "title": "浪漫抵達", "desc": "房型浪漫布置、迎賓香檳"},
            {"day": "Day 2", "title": "沙洲燭光晚餐", "desc": "私人沙洲、專屬廚師"},
            {"day": "Day 3", "title": "浮潛共游", "desc": "與海龜和熱帶魚共游"},
            {"day": "Day 4", "title": "雙人 SPA", "desc": "海邊療程、放鬆身心"},
            {"day": "Day 5", "title": "日落巡航", "desc": "私人遊艇、海豚相伴"},
            {"day": "Day 6-7", "title": "自由時光", "desc": "無人島野餐、星空電影"},
            {"day": "Day 8", "title": "離島", "desc": "帶著回憶啟程"},
        ],
        "price_note": "按人數與房型報價",
        "image_url": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80",
        "icon_name": "Heart",
        "sort_order": 3,
        "status": "active",
    },
    {
        "name": "Fishing Package",
        "name_zh": "釣魚套餐",
        "slug": "fishing",
        "description": "From traditional night fishing to professional big-game fishing, local fishermen guide you to the best spots for an authentic Maldivian ocean experience.",
        "description_zh": "從傳統夜釣到專業海釣，由當地漁夫帶領前往最佳釣點，體驗馬爾代夫的海洋文化。",
        "duration": "10 天 9 晚",
        "location": "多個環礁",
        "audience": "釣魚愛好者、團體",
        "itinerary": [
            {"day": "Day 1-2", "title": "夜釣體驗", "desc": "傳統釣法、船上晚餐"},
            {"day": "Day 3-5", "title": "礁釣", "desc": "環礁釣點、多樣魚種"},
            {"day": "Day 6-8", "title": "深海釣", "desc": "大魚挑戰、專業裝備"},
            {"day": "Day 9", "title": "魚獲烹飪", "desc": "主廚料理、本地島嶼探訪"},
            {"day": "Day 10", "title": "離島", "desc": "滿載回憶與故事"},
        ],
        "price_note": "按人數與房型報價",
        "image_url": "https://images.unsplash.com/photo-1500514966906-fe245eea9344?w=800&q=80",
        "icon_name": "Fish",
        "sort_order": 4,
        "status": "active",
    },
]


def generate_sql() -> str:
    lines: list[str] = [
        "-- Auto-generated seed backfill for CMS content",
        "-- Generated by scripts/generate_seed_sql.py",
        "-- D1 remote execute does not support BEGIN TRANSACTION; each statement is atomic.",
        "",
    ]

    # Update properties
    for p in properties:
        lines.append(
            f"UPDATE properties SET "
            f"name_zh = {sql_escape(p['name_zh'])}, "
            f"description = {sql_escape(p['description'])}, "
            f"description_zh = {sql_escape(p['description_zh'])}, "
            f"location = {sql_escape(p['location'])}, "
            f"price_per_night = {p['price_per_night']}, "
            f"max_guests = {p['max_guests']}, "
            f"image_url = {sql_escape(p['image_url'])}, "
            f"amenities = {sql_escape(json.dumps(p['amenities'], ensure_ascii=False))}, "
            f"gallery = {sql_escape(json.dumps(p['gallery'], ensure_ascii=False))}, "
            f"facilities = {sql_escape(json.dumps(p['facilities'], ensure_ascii=False))}, "
            f"activities = {sql_escape(json.dumps(p['activities'], ensure_ascii=False))}, "
            f"location_details = {sql_escape(json.dumps(p['location_details'], ensure_ascii=False))}, "
            f"story = {sql_escape(json.dumps(p['story'], ensure_ascii=False))}, "
            f"updated_at = unixepoch() "
            f"WHERE id = {p['id']};"
        )
    lines.append("")

    # Update room_types
    for r in room_types:
        lines.append(
            f"UPDATE room_types SET "
            f"name = {sql_escape(r['name'])}, "
            f"name_zh = {sql_escape(r['name_zh'])}, "
            f"description = {sql_escape(r['description'])}, "
            f"description_zh = {sql_escape(r['description_zh'])}, "
            f"price_per_night = {r['price_per_night']}, "
            f"max_guests = {r['max_guests']}, "
            f"inventory = {r['inventory']}, "
            f"image_url = {sql_escape(r['image_url'])}, "
            f"amenities = {sql_escape(json.dumps(r['amenities'], ensure_ascii=False))}, "
            f"bed_type = {sql_escape(r['bed_type'])}, "
            f"view = {sql_escape(r['view'])}, "
            f"size_sqm = {r['size_sqm']}, "
            f"occupancy = {sql_escape(r['occupancy'])}, "
            f"gallery = {sql_escape(json.dumps(r['gallery'], ensure_ascii=False))}, "
            f"features = {sql_escape(json.dumps(r['features'], ensure_ascii=False))}, "
            f"updated_at = unixepoch() "
            f"WHERE id = {r['id']};"
        )
    lines.append("")

    # Insert experiences
    for e in experiences:
        lines.append(
            f"INSERT OR IGNORE INTO experiences "
            f"(name, name_zh, slug, description, description_zh, duration, group_size, includes, price_note, image_url, icon_name, sort_order, status, created_at, updated_at) "
            f"VALUES ("
            f"{sql_escape(e['name'])}, {sql_escape(e['name_zh'])}, {sql_escape(e['slug'])}, "
            f"{sql_escape(e['description'])}, {sql_escape(e['description_zh'])}, "
            f"{sql_escape(e['duration'])}, {sql_escape(e['group_size'])}, "
            f"{sql_escape(json.dumps(e['includes'], ensure_ascii=False))}, "
            f"{sql_escape(e['price_note'])}, {sql_escape(e['image_url'])}, "
            f"{sql_escape(e['icon_name'])}, {e['sort_order']}, '{e['status']}', "
            f"unixepoch(), unixepoch()"
            f");"
        )
    lines.append("")

    # Insert retreats
    for r in retreats:
        lines.append(
            f"INSERT OR IGNORE INTO retreats "
            f"(name, name_zh, slug, description, description_zh, duration, location, audience, itinerary, price_note, image_url, icon_name, sort_order, status, created_at, updated_at) "
            f"VALUES ("
            f"{sql_escape(r['name'])}, {sql_escape(r['name_zh'])}, {sql_escape(r['slug'])}, "
            f"{sql_escape(r['description'])}, {sql_escape(r['description_zh'])}, "
            f"{sql_escape(r['duration'])}, {sql_escape(r['location'])}, {sql_escape(r['audience'])}, "
            f"{sql_escape(json.dumps(r['itinerary'], ensure_ascii=False))}, "
            f"{sql_escape(r['price_note'])}, {sql_escape(r['image_url'])}, "
            f"{sql_escape(r['icon_name'])}, {r['sort_order']}, '{r['status']}', "
            f"unixepoch(), unixepoch()"
            f");"
        )
    lines.append("")

    lines.append("")
    return "\n".join(lines)


if __name__ == "__main__":
    out = Path(__file__).with_name("0003_seed_cms_data.sql")
    out.write_text(generate_sql(), encoding="utf-8")
    print(f"Generated {out} ({len(generate_sql())} chars)")
