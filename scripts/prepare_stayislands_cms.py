#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Prepare Traditional Chinese CMS content from stayislands.mv scrape."""
import json
from pathlib import Path


def sql_escape(value):
    if value is None:
        return "NULL"
    return "'" + str(value).replace("'", "''") + "'"


properties = [
    {
        "id": 1,
        "name": "Stay Mikado",
        "nameZh": "御海閣",
        "description": "A modern island guesthouse in the Maldives, perfect for travellers seeking authentic local living with comfort.",
        "descriptionZh": "御海閣是馬爾代夫一座現代化的島嶼民宿，適合追求地道島嶼生活同時又想享受舒適的旅客。這裡提供溫暖款待、舒適客房，以及輕鬆前往各種島嶼探索的便利，是體驗當地文化、繽紛珊瑚礁與原始海岸的理想據點。無論是短暫逃離還是長期旅居，每一次入住都設計得貼心、放鬆且難忘。",
        "location": "Thimarafushi, Thaa Atoll, Maldives",
        "pricePerNight": 4800,
        "maxGuests": 4,
        "imageUrl": "https://www.stayislands.mv/wp-content/uploads/2026/02/Rectangle-79-4.webp",
        "amenities": [
            "餐廳",
            "咖啡廳",
            "洗衣服務",
            "水煙 Lounge",
            "健身中心",
            "單車租借",
            "Spa",
            "卡拉 OK",
            "冷熱水供應",
            "茶與咖啡設備",
            "平面電視",
            "客房服務",
            "保險箱",
            "空調",
            "獨立浴室",
        ],
        "gallery": [
            "https://www.stayislands.mv/wp-content/uploads/2026/02/Rectangle-79-4.webp",
            "https://www.stayislands.mv/wp-content/uploads/2026/02/Mikado-intro.webp",
            "https://www.stayislands.mv/wp-content/uploads/2026/02/mikado-1-1.webp",
            "https://www.stayislands.mv/wp-content/uploads/2026/02/mikado-4-1.webp",
            "https://www.stayislands.mv/wp-content/uploads/2026/02/mikado-7-1.webp",
            "https://www.stayislands.mv/wp-content/uploads/2026/02/mikado-10-1.webp",
            "https://www.stayislands.mv/wp-content/uploads/2026/02/mikado-13-1.webp",
            "https://www.stayislands.mv/wp-content/uploads/2026/03/Frame-790-scaled.webp",
            "https://www.stayislands.mv/wp-content/uploads/2026/03/Frame-791-scaled.webp",
        ],
        "facilities": [
            {"icon": "🍽️", "label": "餐廳"},
            {"icon": "☕", "label": "咖啡廳"},
            {"icon": "🧺", "label": "洗衣服務"},
            {"icon": "🌬️", "label": "水煙 Lounge"},
            {"icon": "🏋️", "label": "健身中心"},
            {"icon": "🚲", "label": "單車租借"},
            {"icon": "💆", "label": "Spa"},
            {"icon": "🎤", "label": "卡拉 OK"},
            {"icon": "🚿", "label": "冷熱水供應"},
            {"icon": "🍵", "label": "茶與咖啡設備"},
            {"icon": "📺", "label": "平面電視"},
            {"icon": "🛏️", "label": "客房服務"},
            {"icon": "🔒", "label": "保險箱"},
            {"icon": "❄️", "label": "空調"},
            {"icon": "🛁", "label": "獨立浴室"},
        ],
        "activities": [
            {
                "image": "https://www.stayislands.mv/wp-content/uploads/2026/02/mikado-4-1.webp",
                "name": "珊瑚礁浮潛",
                "description": "從民宿出發，探索 Thaa 環礁周圍色彩繽紛的珊瑚礁與熱帶魚群。",
            },
            {
                "image": "https://www.stayislands.mv/wp-content/uploads/2026/02/mikado-7-1.webp",
                "name": "島嶼文化探索",
                "description": "走訪 Thimarafushi 居民島，認識當地漁村生活與馬爾代夫傳統文化。",
            },
            {
                "image": "https://www.stayislands.mv/wp-content/uploads/2026/02/mikado-10-1.webp",
                "name": "衝浪冒險",
                "description": "Thaa 環礁以優質浪點聞名，適合衝浪愛好者前來挑戰。",
            },
            {
                "image": "https://www.stayislands.mv/wp-content/uploads/2026/02/mikado-13-1.webp",
                "name": "日落垂釣",
                "description": "跟隨當地漁民出海，學習傳統釣法，收穫可交由廚師現場烹調。",
            },
            {
                "image": "https://www.stayislands.mv/wp-content/uploads/2026/03/Frame-790-scaled.webp",
                "name": "水上飛機接駁",
                "description": "從馬累搭乘國內航班或水上飛機，鳥瞰馬爾代夫的潟湖與環礁。",
            },
        ],
        "locationDetails": {
            "description": "御海閣位於 Thaa 環礁的 Thimarafushi 居民島，距離馬累約 215 公里。這座島嶼擁有國內機場，交通便利，同時保留了真實的馬爾代夫社區氛圍與原始自然風光。",
            "mapImage": "https://www.stayislands.mv/wp-content/uploads/2026/02/mikado-1-1.webp",
            "nearby": [
                "Thimarafushi 國內機場：島上即達",
                "機場接駁服務：可安排快艇或內陸航班",
                "健康中心：島上設施",
                "本地商店：體驗居民島生活",
                "私人海灘：步行可達",
                "羽毛球場：島上休閒設施",
                "高速渡輪服務：連接周邊島嶼",
            ],
        },
        "story": {
            "title": "御海閣的故事",
            "content": "御海閣誕生於對真實馬爾代夫生活的熱愛。不同於一般度假村，這裡讓你走進居民島的日常：清晨聽見漁船出海的聲音，午後在椰林下騎單車，傍晚與當地人一起在沙灘上閒聊。我們相信，最難忘的旅程不是遠離人群，而是與這片土地和它的人民建立連結。",
        },
    },
    {
        "id": 2,
        "name": "Private Island",
        "nameZh": "私享島嶼",
        "description": "An exclusive private island retreat where seclusion, beauty, and personalised service blend seamlessly.",
        "descriptionZh": "私享島嶼是一處極致私密的馬爾代夫 Retreat，將隱蔽、美景與個人化服務完美融合。被碧綠潟湖與棕櫚樹環繞，這片私人天堂適合情侶、家庭或團體尋求完全專屬的島嶼體驗。從量身訂製的餐飲、精心策劃的活動到日落巡航，每一個細節都只為你而存在。",
        "location": "Private Island, Maldives",
        "pricePerNight": 12800,
        "maxGuests": 12,
        "imageUrl": "https://www.stayislands.mv/wp-content/uploads/2026/02/Private-Island-Escape-1.webp",
        "amenities": [
            "私人島嶼",
            "專屬廚師團隊",
            "私人遊艇",
            "管家服務",
            "Spa",
            "私人海灘",
            "日落巡航",
            "潛水中心",
            "水上運動",
            "圖書館",
            "餐廳",
            "咖啡廳",
            "洗衣服務",
        ],
        "gallery": [
            "https://www.stayislands.mv/wp-content/uploads/2026/02/Private-Island-Escape-1.webp",
            "https://www.stayislands.mv/wp-content/uploads/2026/02/private-island-intro.webp",
            "https://www.stayislands.mv/wp-content/uploads/2026/02/dji_mimo_20250226_172856_20250226172857_1740625371802_photo-1.webp",
            "https://www.stayislands.mv/wp-content/uploads/2026/02/IMG_9410-1.webp",
            "https://www.stayislands.mv/wp-content/uploads/2026/02/IMG_9413-1.webp",
            "https://www.stayislands.mv/wp-content/uploads/2026/02/Kihaa26-amended-25-1.webp",
            "https://www.stayislands.mv/wp-content/uploads/2026/02/Kihaa26-amended-53-1.webp",
            "https://www.stayislands.mv/wp-content/uploads/2026/02/Kihaa26-amended-45-1.webp",
            "https://www.stayislands.mv/wp-content/uploads/2026/02/seefromthesky78-1-1.webp",
        ],
        "facilities": [
            {"icon": "🏝️", "label": "私人島嶼"},
            {"icon": "👨‍🍳", "label": "專屬廚師團隊"},
            {"icon": "🛥️", "label": "私人遊艇"},
            {"icon": "🎩", "label": "管家服務"},
            {"icon": "💆", "label": "Spa"},
            {"icon": "🏖️", "label": "私人海灘"},
            {"icon": "🌅", "label": "日落巡航"},
            {"icon": "🤿", "label": "潛水中心"},
            {"icon": "🏄", "label": "水上運動"},
            {"icon": "📚", "label": "圖書館"},
            {"icon": "🍽️", "label": "餐廳"},
            {"icon": "☕", "label": "咖啡廳"},
            {"icon": "🧺", "label": "洗衣服務"},
        ],
        "activities": [
            {
                "image": "https://www.stayislands.mv/wp-content/uploads/2026/02/Private-Island-Escape-1.webp",
                "name": "私人島嶼野餐",
                "description": "在只屬於你的沙洲或無人島上，享用由廚師現場準備的燭光午餐。",
            },
            {
                "image": "https://www.stayislands.mv/wp-content/uploads/2026/02/Kihaa26-amended-53-1.webp",
                "name": "日落巡航",
                "description": "乘私人遊艇駛向金色夕陽，在香檳與海豚相伴中結束完美一天。",
            },
            {
                "image": "https://www.stayislands.mv/wp-content/uploads/2026/02/Kihaa26-amended-45-1.webp",
                "name": "浮潛與潛水",
                "description": "探索環礁珊瑚花園，與海龜、熱帶魚和鯨鯊不期而遇。",
            },
            {
                "image": "https://www.stayislands.mv/wp-content/uploads/2026/02/seefromthesky78-1-1.webp",
                "name": "水上運動",
                "description": "從獨木舟到風帆，在私人潟湖上盡情享受各種水上活動。",
            },
            {
                "image": "https://www.stayislands.mv/wp-content/uploads/2026/02/dji_mimo_20250226_172856_20250226172857_1740625371802_photo-1.webp",
                "name": "沙洲浪漫晚餐",
                "description": "在星空下的沙洲上，由專屬團隊為你佈置一場只屬於兩人的晚餐。",
            },
        ],
        "locationDetails": {
            "description": "私享島嶼坐落於馬爾代夫一處靜謐的私人環礁，四周環繞著碧綠潟湖與原始珊瑚礁。整座島嶼只為你與你的旅伴開放，提供真正的隱私與專屬服務。",
            "mapImage": "https://www.stayislands.mv/wp-content/uploads/2026/02/seefromthesky78-1-1.webp",
            "nearby": [
                "馬累國際機場：可乘水上飛機或內陸航班 + 快艇抵達",
                "私人遊艇碼頭：島嶼專屬",
                "無人沙洲：約 10 分鐘船程",
                "著名潛點：依行程安排前往",
            ],
        },
        "story": {
            "title": "私享島嶼的故事",
            "content": "這座島嶼的名字源於當地語言中對「海龜」的稱呼。數十年來，這裡一直是綠蠵龜與玳瑁上岸產卵的秘境。現任島主接手後，堅持只開放給極少數客人，並將大部分海岸線留給自然與保育。在私享島嶼，沒有其他住客，只有你的家人、朋友、管家，以及偶爾上岸產卵的海龜。",
        },
    },
    {
        "id": 3,
        "name": "Stay Madivaru",
        "nameZh": "碧海灣",
        "description": "A stunning 25m teakwood boat completely refurbished in 2015, offering a unique blend of modern comfort and traditional craftsmanship on the open water.",
        "descriptionZh": "碧海灣是一艘完美的海上 getaway 選擇，無論內向或外向的旅客都能找到適合自己的活動與卓越服務，由 Stay Islands 精心策劃與營運。這艘 25 米長的柚木船於 2015 年全面翻新，結合現代設計與傳統工藝，為來自世界各地的旅客提供完整舒適。在甲板上曬太陽、在寬敞的沙龍區放鬆，或在日光浴平台享受海風，一切都讓人忘卻時間。",
        "location": "Maldives At Sea",
        "pricePerNight": 3200,
        "maxGuests": 3,
        "imageUrl": "https://www.stayislands.mv/wp-content/uploads/2026/02/Rectangle-79-4.webp",
        "amenities": [
            "船宿體驗",
            "Yanmar 350 HP 引擎",
            "橡皮艇與外掛引擎",
            "10 節巡航速度",
            "船上 WiFi",
            "餐廳與酒吧",
            "日光浴平台",
            "舒適沙龍",
            "冷熱水供應",
            "空調",
            "獨立浴室",
            "釣魚設備",
            "潛水裝備",
        ],
        "gallery": [
            "https://www.stayislands.mv/wp-content/uploads/2026/02/Rectangle-79-4.webp",
            "https://www.stayislands.mv/wp-content/uploads/2026/03/shutterstock_2264141839-1.webp",
            "https://www.stayislands.mv/wp-content/uploads/2026/03/shutterstock_2578452439-1-2-scaled.webp",
            "https://www.stayislands.mv/wp-content/uploads/2026/03/Frame-790-scaled.webp",
            "https://www.stayislands.mv/wp-content/uploads/2026/03/Frame-791-scaled.webp",
        ],
        "facilities": [
            {"icon": "⚙️", "label": "Yanmar 350 HP 引擎"},
            {"icon": "🚤", "label": "橡皮艇與外掛引擎"},
            {"icon": "🌊", "label": "10 節巡航速度"},
            {"icon": "📶", "label": "船上 WiFi"},
            {"icon": "🍽️", "label": "餐廳與酒吧"},
            {"icon": "☀️", "label": "日光浴平台"},
            {"icon": "🛋️", "label": "舒適沙龍"},
            {"icon": "🚿", "label": "冷熱水供應"},
            {"icon": "❄️", "label": "空調"},
            {"icon": "🛁", "label": "獨立浴室"},
            {"icon": "🎣", "label": "釣魚設備"},
            {"icon": "🤿", "label": "潛水裝備"},
        ],
        "activities": [
            {
                "image": "https://www.stayislands.mv/wp-content/uploads/2026/06/Madivaru-DIVING-CHARTER-1.webp",
                "name": "潛水 Charter",
                "description": "由專業潛水團隊帶領，前往馬爾代夫最佳潛點探索珊瑚礁與大型海洋生物。",
            },
            {
                "image": "https://www.stayislands.mv/wp-content/uploads/2026/06/Madivaru-FISHING-CHARTER-1.webp",
                "name": "海釣 Charter",
                "description": "從傳統釣法到深海大魚挑戰，由經驗豐富的船員帶你尋找最佳釣點。",
            },
            {
                "image": "https://www.stayislands.mv/wp-content/uploads/2026/06/Madivaru-SURFING-CHARTER-1.webp",
                "name": "衝浪 Charter",
                "description": "前往馬爾代夫著名浪點，享受專屬衝浪旅程與船上住宿的完美結合。",
            },
            {
                "image": "https://www.stayislands.mv/wp-content/uploads/2026/03/shutterstock_2264141839-1.webp",
                "name": "鯨鯊與魔鬼魚共游",
                "description": "在特定季節與海域，有機會與溫柔的鯨鯊和魔鬼魚一起游泳。",
            },
            {
                "image": "https://www.stayislands.mv/wp-content/uploads/2026/03/shutterstock_2578452439-1-2-scaled.webp",
                "name": "日落巡航",
                "description": "在甲板上欣賞馬爾代夫的壯麗日落，感受印度洋的寧靜與遼闊。",
            },
        ],
        "locationDetails": {
            "description": "碧海灣是一艘航行於馬爾代夫各環礁之間的 25 米柚木船宿。根據行程不同，船隻會帶你前往最佳潛點、浪點或釣點，讓你在移動中體驗馬爾代夫最原始的海洋魅力。",
            "mapImage": "https://www.stayislands.mv/wp-content/uploads/2026/03/shutterstock_2578452439-1-2-scaled.webp",
            "nearby": [
                "馬累國際機場：依行程安排登船地點",
                "各環礁潛點：依 Charter 路線前往",
                "著名浪點：依衝浪 Charter 路線",
                "深海釣點：依海釣 Charter 路線",
            ],
        },
        "story": {
            "title": "碧海灣的故事",
            "content": "碧海灣原本是一艘傳統的馬爾代夫漁船，在 2015 年經過全面翻新後，成為一艘結合傳統柚木工藝與現代舒適的船宿。船上的每一處空間都經過精心設計：寬敞的沙龍讓你與旅伴共享美好時光，日光浴平台讓你盡情擁抱印度洋的陽光。在這裡，你不是在「住」一間房，而是在海上擁有一個移動的家。",
        },
    },
]


room_types = [
    {
        "property_id": 1,
        "name": "Triple Room",
        "nameZh": "三人房",
        "description": "Comfortable triple room ideal for small groups or families.",
        "descriptionZh": "舒適的三人房，適合小團體或家庭入住。",
        "pricePerNight": 3200,
        "maxGuests": 3,
        "inventory": 3,
        "imageUrl": "https://www.stayislands.mv/wp-content/uploads/2026/06/Mikado-Tripple-Room.webp",
        "amenities": ["空調", "獨立浴室", "平面電視", "保險箱", "茶與咖啡設備"],
        "bedType": "Triple",
        "view": "Island View",
        "sizeSqm": 28,
        "occupancy": "3 Adults",
        "gallery": ["https://www.stayislands.mv/wp-content/uploads/2026/06/Mikado-Tripple-Room.webp"],
        "features": ["三人床位", "空調", "獨立浴室", "平面電視", "保險箱"],
    },
    {
        "property_id": 1,
        "name": "Village Deluxe Suite",
        "nameZh": "村莊豪華套房",
        "description": "Spacious deluxe suite with authentic island charm.",
        "descriptionZh": "寬敞的豪華套房，融合地道的島嶼風情與現代舒適。",
        "pricePerNight": 4200,
        "maxGuests": 2,
        "inventory": 2,
        "imageUrl": "https://www.stayislands.mv/wp-content/uploads/2026/06/Mikado-Village-deluxe.webp",
        "amenities": ["空調", "獨立浴室", "平面電視", "保險箱", "茶與咖啡設備", "迷你冰箱"],
        "bedType": "King",
        "view": "Garden View",
        "sizeSqm": 38,
        "occupancy": "2 Adults",
        "gallery": ["https://www.stayislands.mv/wp-content/uploads/2026/06/Mikado-Village-deluxe.webp"],
        "features": ["加大床", "花園景觀", "空調", "獨立浴室", "迷你冰箱"],
    },
    {
        "property_id": 1,
        "name": "Deluxe Room",
        "nameZh": "豪華客房",
        "description": "Cozy deluxe room with all essential comforts for a relaxing stay.",
        "descriptionZh": "溫馨的豪華客房，配備所有必要設施，讓你放鬆入住。",
        "pricePerNight": 3800,
        "maxGuests": 2,
        "inventory": 4,
        "imageUrl": "https://www.stayislands.mv/wp-content/uploads/2026/06/Mikado-Deluxe-room.webp",
        "amenities": ["空調", "獨立浴室", "平面電視", "保險箱", "茶與咖啡設備"],
        "bedType": "King or Twin",
        "view": "Island View",
        "sizeSqm": 32,
        "occupancy": "2 Adults",
        "gallery": ["https://www.stayislands.mv/wp-content/uploads/2026/06/Mikado-Deluxe-room.webp"],
        "features": ["加大床或雙床", "空調", "獨立浴室", "平面電視", "保險箱"],
    },
    {
        "property_id": 1,
        "name": "Family Suite",
        "nameZh": "家庭套房",
        "description": "Generous family suite with space for everyone to unwind.",
        "descriptionZh": "寬敞的家庭套房，讓全家人都能舒適放鬆。",
        "pricePerNight": 5200,
        "maxGuests": 4,
        "inventory": 2,
        "imageUrl": "https://www.stayislands.mv/wp-content/uploads/2026/06/Mikado-Family-apartment.webp",
        "amenities": ["空調", "獨立浴室", "平面電視", "保險箱", "茶與咖啡設備", "迷你冰箱", "獨立客廳"],
        "bedType": "King + Twin",
        "view": "Island View",
        "sizeSqm": 55,
        "occupancy": "4 Adults",
        "gallery": ["https://www.stayislands.mv/wp-content/uploads/2026/06/Mikado-Family-apartment.webp"],
        "features": ["獨立客廳", "加大床與雙床", "空調", "獨立浴室", "迷你冰箱"],
    },
    {
        "property_id": 2,
        "name": "Private Island Villa",
        "nameZh": "私人島嶼別墅",
        "description": "Exclusive villa on a private island with direct lagoon access.",
        "descriptionZh": "位於私人島嶼上的獨家別墅，可直接通往碧綠潟湖。",
        "pricePerNight": 12800,
        "maxGuests": 2,
        "inventory": 4,
        "imageUrl": "https://www.stayislands.mv/wp-content/uploads/2026/02/Private-Island-Escape-1.webp",
        "amenities": ["私人泳池", "海景露台", "管家服務", "迎賓香檳", "空調", "Wi-Fi"],
        "bedType": "King",
        "view": "Ocean View",
        "sizeSqm": 85,
        "occupancy": "2 Adults",
        "gallery": [
            "https://www.stayislands.mv/wp-content/uploads/2026/02/Private-Island-Escape-1.webp",
            "https://www.stayislands.mv/wp-content/uploads/2026/02/Kihaa26-amended-25-1.webp",
            "https://www.stayislands.mv/wp-content/uploads/2026/02/Kihaa26-amended-53-1.webp",
        ],
        "features": ["私人泳池", "海景露台", "管家服務", "迎賓香檳", "獨立浴室"],
    },
    {
        "property_id": 2,
        "name": "Private Island Residence",
        "nameZh": "私人島嶼宅邸",
        "description": "Spacious residence for families or groups seeking total privacy.",
        "descriptionZh": "寬敞的私人島嶼宅邸，適合家庭或團體追求完全私密。",
        "pricePerNight": 18800,
        "maxGuests": 6,
        "inventory": 2,
        "imageUrl": "https://www.stayislands.mv/wp-content/uploads/2026/02/Kihaa26-amended-45-1.webp",
        "amenities": ["私人泳池", "客廳", "廚房", "管家服務", "私人遊艇", "空調", "Wi-Fi"],
        "bedType": "2 King",
        "view": "Ocean View",
        "sizeSqm": 150,
        "occupancy": "6 Adults",
        "gallery": [
            "https://www.stayislands.mv/wp-content/uploads/2026/02/Kihaa26-amended-45-1.webp",
            "https://www.stayislands.mv/wp-content/uploads/2026/02/seefromthesky78-1-1.webp",
            "https://www.stayislands.mv/wp-content/uploads/2026/02/Private-Island-Escape-1.webp",
        ],
        "features": ["私人泳池", "獨立客廳", "廚房空間", "管家服務", "私人遊艇接駁"],
    },
    {
        "property_id": 3,
        "name": "Standard Cabin",
        "nameZh": "標準船艙",
        "description": "Cozy cabin on board the Stay Madivaru boat, perfect for rest between ocean adventures.",
        "descriptionZh": "碧海灣船上溫馨舒適的船艙，是海上冒險之間放鬆休息的完美空間。",
        "pricePerNight": 3200,
        "maxGuests": 2,
        "inventory": 4,
        "imageUrl": "https://www.stayislands.mv/wp-content/uploads/2026/03/shutterstock_2264141839-1.webp",
        "amenities": ["空調", "獨立浴室", "床頭燈", "收納空間", "海景窗"],
        "bedType": "Twin",
        "view": "Ocean View",
        "sizeSqm": 12,
        "occupancy": "2 Adults",
        "gallery": [
            "https://www.stayislands.mv/wp-content/uploads/2026/03/shutterstock_2264141839-1.webp",
            "https://www.stayislands.mv/wp-content/uploads/2026/03/shutterstock_2578452439-1-2-scaled.webp",
        ],
        "features": ["雙床", "空調", "獨立浴室", "海景窗", "收納空間"],
    },
    {
        "property_id": 3,
        "name": "Master Cabin",
        "nameZh": "主臥船艙",
        "description": "More spacious cabin with enhanced comfort for longer charters.",
        "descriptionZh": "更寬敞舒適的主臥船艙，適合較長天數的船宿 Charter。",
        "pricePerNight": 4200,
        "maxGuests": 2,
        "inventory": 2,
        "imageUrl": "https://www.stayislands.mv/wp-content/uploads/2026/03/shutterstock_2578452439-1-2-scaled.webp",
        "amenities": ["空調", "獨立浴室", "加大床", "海景窗", "獨立收納"],
        "bedType": "King",
        "view": "Ocean View",
        "sizeSqm": 18,
        "occupancy": "2 Adults",
        "gallery": [
            "https://www.stayislands.mv/wp-content/uploads/2026/03/shutterstock_2578452439-1-2-scaled.webp",
            "https://www.stayislands.mv/wp-content/uploads/2026/03/Frame-790-scaled.webp",
        ],
        "features": ["加大床", "空調", "獨立浴室", "海景窗", "獨立收納空間"],
    },
]


def build_property_update_sql(p: dict) -> str:
    return (
        f"UPDATE properties SET "
        f"name = {sql_escape(p['name'])}, "
        f"name_zh = {sql_escape(p['nameZh'])}, "
        f"description = {sql_escape(p['description'])}, "
        f"description_zh = {sql_escape(p['descriptionZh'])}, "
        f"location = {sql_escape(p['location'])}, "
        f"price_per_night = {p['pricePerNight']}, "
        f"max_guests = {p['maxGuests']}, "
        f"image_url = {sql_escape(p['imageUrl'])}, "
        f"amenities = {sql_escape(json.dumps(p['amenities'], ensure_ascii=False))}, "
        f"gallery = {sql_escape(json.dumps(p['gallery'], ensure_ascii=False))}, "
        f"facilities = {sql_escape(json.dumps(p['facilities'], ensure_ascii=False))}, "
        f"activities = {sql_escape(json.dumps(p['activities'], ensure_ascii=False))}, "
        f"location_details = {sql_escape(json.dumps(p['locationDetails'], ensure_ascii=False))}, "
        f"story = {sql_escape(json.dumps(p['story'], ensure_ascii=False))}, "
        f"updated_at = unixepoch() "
        f"WHERE id = {p['id']};"
    )


def build_room_type_insert_sql(r: dict) -> str:
    return (
        f"INSERT INTO room_types "
        f"(property_id, name, name_zh, description, description_zh, price_per_night, max_guests, inventory, image_url, amenities, bed_type, view, size_sqm, occupancy, gallery, features, status, updated_at) "
        f"VALUES ("
        f"{r['property_id']}, {sql_escape(r['name'])}, {sql_escape(r['nameZh'])}, "
        f"{sql_escape(r['description'])}, {sql_escape(r['descriptionZh'])}, "
        f"{r['pricePerNight']}, {r['maxGuests']}, {r['inventory']}, "
        f"{sql_escape(r['imageUrl'])}, {sql_escape(json.dumps(r['amenities'], ensure_ascii=False))}, "
        f"{sql_escape(r['bedType'])}, {sql_escape(r['view'])}, {r['sizeSqm']}, "
        f"{sql_escape(r['occupancy'])}, {sql_escape(json.dumps(r['gallery'], ensure_ascii=False))}, "
        f"{sql_escape(json.dumps(r['features'], ensure_ascii=False))}, 'available', unixepoch()"
        f");"
    )


def main():
    out_dir = Path(__file__).parent.parent / "worker" / "migrations"
    out_dir.mkdir(parents=True, exist_ok=True)

    lines = [
        "-- Auto-generated migration: populate stayislands.mv content into CMS",
        "-- Generated by scripts/prepare_stayislands_cms.py",
        "",
    ]

    # Update properties
    for p in properties:
        lines.append(build_property_update_sql(p))
    lines.append("")

    # Replace room_types: delete existing for these properties, insert new
    lines.append("DELETE FROM room_types WHERE property_id IN (1, 2, 3);")
    for r in room_types:
        lines.append(build_room_type_insert_sql(r))
    lines.append("")

    out_path = out_dir / "0004_populate_stayislands_content.sql"
    out_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Generated {out_path}")


if __name__ == "__main__":
    main()
