import json
import textwrap

COMMON_TERMS = (
    "預訂需繳納 15% 訂金，有關款項一概不予退還。\n"
    "接駁費用須連同訂金一併繳納方可確認預訂。\n"
    "餘款請於抵達後繳納。\n"
    "若預訂後未有到達，費用恕不退還。\n"
    "提前離島將收取全額費用。\n"
    "因天氣、政局或社會動盪引致行程變動，本公司概不負責。\n"
    "馬爾代夫境外產生嘅所有銀行手續費，一概由匯款人承擔。\n\n"
    "接駁安排：\n"
    "• 快艇接駁：車程約 4 小時，單程每位 90 美元\n"
    "• 內陸航班接駁：飛行約 40 分鐘，單程每位 170 美元"
)

IMAGES = [
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=80",  # yoga/meditation
    "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&q=80",  # yoga
    "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=1200&q=80",  # surf
    "https://images.unsplash.com/photo-1526344966-89049886b28d?w=1200&q=80",  # surf board
    "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=1200&q=80",  # couple
    "https://images.unsplash.com/photo-1537905569824-f89f14cceb68?w=1200&q=80",  # adventure boat
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80",  # fishing
    "https://images.unsplash.com/photo-1582967788606-a171f1080ca8?w=1200&q=80",  # diving
]

GALLERIES = [
    ["https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
     "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80",
     "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80"],
    ["https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80",
     "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80",
     "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80"],
    ["https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&q=80",
     "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80",
     "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&q=80"],
    ["https://images.unsplash.com/photo-1526344966-89049886b28d?w=800&q=80",
     "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
     "https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?w=800&q=80"],
    ["https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&q=80",
     "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80",
     "https://images.unsplash.com/photo-1437719417032-8595fd9e9dc6?w=800&q=80"],
    ["https://images.unsplash.com/photo-1537905569824-f89f14cceb68?w=800&q=80",
     "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80",
     "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800&q=80"],
    ["https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
     "https://images.unsplash.com/photo-1540202404-a2f29016b523?w=800&q=80",
     "https://images.unsplash.com/photo-1500514966906-fe245eea9344?w=800&q=80"],
    ["https://images.unsplash.com/photo-1582967788606-a171f1080ca8?w=800&q=80",
     "https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=800&q=80",
     "https://images.unsplash.com/photo-1544144433-d50aff500b91?w=800&q=80"],
]

def make_itinerary(duration_days: int):
    items = []
    items.append({"day": "Day 1", "title": "抵達馬累與接駁", "desc": "抵達馬累國際機場後，乘坐預約接駁前往度假村，晚上舉行歡迎晚宴。"})
    for d in range(2, duration_days):
        items.append({"day": f"Day {d}", "title": "島上活動與體驗", "desc": "按當日安排參加海上活動、瑜伽課程或島嶼探索，享受早午晚三餐。"})
    items.append({"day": f"Day {duration_days}", "title": "離開度假村", "desc": "享用早餐後安排接駁返回馬累國際機場，結束難忘旅程。"})
    return items

packages = [
    {
        "name": "Yoga Adventure Retreat",
        "nameZh": "瑜伽探險度假營",
        "slug": "yoga-adventure-retreat",
        "duration": "10日9晚",
        "location": "馬爾代夫塔環礁 Thaa Atoll, Maldives",
        "audience": "瑜伽愛好者、獨旅／情侶／朋友",
        "description": "A 10-day yoga and adventure retreat in Thaa Atoll, featuring daily yoga, surf lessons, snorkeling, dolphin watching and uninhabited island excursions.",
        "descriptionZh": "即刻走進馬爾代夫塔環礁，感受這片純淨無瑕嘅自然風光。我哋精心籌備嘅瑜伽探險度假團，不論你係初次出遊嘅新手，抑或經驗豐富嘅旅友，每日嘅瑜伽練習、精彩海上活動，再加上恬靜寫意嘅島上生活，都可以讓你身心靈徹底放鬆、煥然一新。無論獨自出遊、情侶結伴，抑或不同程度嘅瑜伽愛好者，都好適合參加。",
        "inclusions": [
            "9 晚住宿",
            "早、午、晚三餐",
            "清水、茶及咖啡任飲",
            "每日瑜伽課堂",
            "5 節衝浪課",
            "衝浪板",
            "私人島嶼遊連海灘活動燒烤晚餐",
            "荒島探險之旅",
            "全日野餐之旅",
            "5 次浮潛體驗",
            "觀海豚之旅",
            "相片及影片拍攝",
            "已包含所有稅項",
        ],
        "days": 10,
        "pricing": [
            {"type": "shared", "label": "二人同房／雙人房", "price": 1100, "currency": "USD"},
            {"type": "single", "label": "單人房", "price": 1400, "currency": "USD"},
        ],
    },
    {
        "name": "Yoga & Meditation Retreat",
        "nameZh": "瑜伽冥想度假營",
        "slug": "yoga-meditation-retreat",
        "duration": "8日",
        "location": "馬爾代夫塔環礁 Thaa Atoll, Maldives",
        "audience": "瑜伽與冥想愛好者",
        "description": "An 8-day yoga and meditation retreat in Thaa Atoll to relax, reconnect and explore secluded islands.",
        "descriptionZh": "置身馬爾代夫一片寧靜之中，藉住瑜伽同冥想放鬆自己，靜下心來找回真正嘅自我。瑜伽冥想度假營設於塔環礁，每日一齊做瑜伽同冥想，周圍遊覽馬爾代夫與世隔絕、風景絕靚嘅離島。營地住宿舒適，每日都有新驚喜，盡情發掘島嶼嘅迷人風景。",
        "inclusions": [
            "9 晚住宿",
            "早、午、晚三餐",
            "清水、茶及咖啡任飲",
            "每日瑜伽課堂",
            "5 節衝浪課",
            "衝浪板",
            "私人島嶼連海灘暢玩之旅燒烤晚餐",
            "荒島遊",
            "全日野餐之旅",
            "5 次浮潛體驗",
            "觀海豚之旅",
            "相片及影片拍攝",
            "已包所有稅項",
        ],
        "days": 8,
        "pricing": [
            {"type": "shared", "label": "二人同房／雙人房", "price": 700, "currency": "USD"},
            {"type": "single", "label": "單人房", "price": 1000, "currency": "USD"},
        ],
    },
    {
        "name": "Surf & Stay Package",
        "nameZh": "住宿連衝浪套餐",
        "slug": "surf-stay-package",
        "duration": "9日8晚",
        "location": "馬爾代夫塔環礁 Thaa Atoll, Maldives",
        "audience": "衝浪愛好者",
        "description": "A 9-day surf & stay package in Thaa Atoll with uncrowded waves, daily surf sessions and island exploration.",
        "descriptionZh": "馬爾代夫中部塔環礁遠離鬧市，海域人頭疏落、浪質一流。呢度住宿舒適，唔使同人逼，可以盡情衝浪練技術。閒時仲可以周圍遊覽原始珊瑚礁同無人小島，飽覽純天然海景。遠離人潮，獨享暢快浪濤，一齊展開精彩熱帶海島冒險。",
        "inclusions": [
            "8 晚住宿",
            "早餐、午餐及晚餐",
            "清水、茶及咖啡任飲",
            "每日兩節衝浪體驗",
            "費用已包所有稅項",
        ],
        "days": 9,
        "pricing": [
            {"type": "shared", "label": "二人同房／雙人房", "price": 700, "currency": "USD"},
            {"type": "single", "label": "單人房", "price": 900, "currency": "USD"},
        ],
    },
    {
        "name": "Beginner Surf Course Package",
        "nameZh": "住宿連初學衝浪課程套餐",
        "slug": "beginner-surf-course-package",
        "duration": "8日7晚",
        "location": "馬爾代夫塔環礁 Thaa Atoll, Maldives",
        "audience": "衝浪初學者",
        "description": "An 8-day beginner surf course in Thaa Atoll with professional coaching, reef snorkeling and uninhabited island picnics.",
        "descriptionZh": "不論你係第一次玩衝浪，還是想提升水上膽量，我哋都有資深教練從旁指導，加上島上悠閒寫意嘅氣氛，絕對係放假學衝浪嘅最佳選擇。上完堂之後，又可以去睇珊瑚礁、沙洲同無人島，感受馬爾代夫地道島嶼風情。心動想嘗試第一次衝浪？呢個套餐就最適合你，係喺馬爾代夫學衝浪嘅完美起點。",
        "inclusions": [
            "7 晚住宿",
            "早、午、晚三餐",
            "清水、茶及咖啡任飲",
            "每日一節衝浪課",
            "私人島嶼連海灘暢玩體驗燒烤晚餐",
            "浮潛體驗",
            "荒島野餐之旅",
            "所有稅項已全包",
        ],
        "days": 8,
        "pricing": [
            {"type": "shared", "label": "二人同房／雙人房", "price": 750, "currency": "USD"},
            {"type": "single", "label": "單人房", "price": 950, "currency": "USD"},
        ],
    },
    {
        "name": "Couples Exclusive Package",
        "nameZh": "情侶專享套餐",
        "slug": "couples-exclusive-package",
        "duration": "8日7晚",
        "location": "馬爾代夫塔環礁 Thaa Atoll, Maldives",
        "audience": "情侶",
        "description": "An 8-day couples-exclusive getaway in Thaa Atoll with private island visits, dolphin watching and beach dinners.",
        "descriptionZh": "同另一半一齊嚟馬爾代夫塔環礁，展開為期 8 日嘅專屬情侶假期，盡情感受呢度嘅美景同寧靜。四周海水清澈見底、沙灘純淨自然，適合想遠離喧鬧、享受二人世界，好好放鬆相處嘅情侶。一齊留下獨一無二嘅美好回憶，呢個套餐絕對係情侶遊馬爾代夫嘅理想之選。",
        "inclusions": [
            "7 晚住宿",
            "早、午、晚三餐",
            "清水、茶及咖啡任飲",
            "海灘專屬晚餐",
            "全日私人島嶼暢遊",
            "觀海豚體驗",
            "珊瑚礁浮潛活動",
            "荒島遊覽",
            "所有稅項已全包",
        ],
        "days": 8,
        "pricing": [
            {"type": "shared", "label": "雙人房", "price": 850, "currency": "USD"},
        ],
    },
    {
        "name": "Adventure Experience Package",
        "nameZh": "探險體驗套餐",
        "slug": "adventure-experience-package",
        "duration": "10日9晚",
        "location": "馬爾代夫塔環礁 Thaa Atoll, Maldives",
        "audience": "探險愛好者",
        "description": "A 10-day adventure itinerary in Thaa Atoll featuring uninhabited island camping, jungle walks, night fishing and marine life encounters.",
        "descriptionZh": "呢個為期 10 日嘅探險行程設於塔環礁，帶你發掘馬爾代夫偏遠秘境。適合熱愛探險嘅朋友，集合島嶼遊歷、海上活動同特色住宿體驗，遠離人潮。每日都有全新旅程，暢遊碧藍海域、探訪無人島，欣賞純天然風光。無論獨自出遊、同朋友結伴，抑或情侶同行都適合。",
        "inclusions": [
            "9 晚住宿",
            "早、午、晚三餐",
            "清水、茶及咖啡任飲",
            "無人島露營過夜",
            "無人島探遊、叢林漫步及島上探索",
            "暢遊周邊多個本土小島",
            "全日私人島嶼荒野體驗",
            "夜間垂釣活動",
            "兩處特色珊瑚礁浮潛",
            "尋覓海龜浮潛體驗",
            "出海觀海豚",
            "所有稅項已全包",
        ],
        "days": 10,
        "pricing": [
            {"type": "shared", "label": "二人同房／雙人房", "price": 1200, "currency": "USD"},
            {"type": "single", "label": "單人房", "price": 1500, "currency": "USD"},
        ],
    },
    {
        "name": "Fishing Experience Package",
        "nameZh": "海釣體驗套餐",
        "slug": "fishing-experience-package",
        "duration": "8日8晚",
        "location": "馬爾代夫塔環礁 Thaa Atoll, Maldives",
        "audience": "海釣愛好者",
        "description": "An 8-day fishing experience in Thaa Atoll on a traditional Maldivian fishing boat, with island accommodation and local hospitality.",
        "descriptionZh": "不論你係資深釣友，抑或初次接觸釣魚嘅新手，呢個套餐都好適合。我哋安排舒適島上住宿，每日跟隨經驗豐富嘅船長同船員，乘坐馬爾代夫傳統漁船出海，盡情垂釣，嘗試捕獲各類珊瑚魚同大洋魚種。釣魚空檔，可以喺寧靜嘅島嶼上休閒放鬆，感受當地人熱情款待，細賞馬爾代夫嘅自然風光。",
        "inclusions": [
            "8 晚住宿",
            "早餐、午餐及晚餐",
            "清水、茶及咖啡任飲",
            "每日兩節衝浪體驗",
            "費用已包所有稅項",
        ],
        "days": 8,
        "pricing": [
            {"type": "shared", "label": "二人同房／雙人房", "price": 1200, "currency": "USD"},
            {"type": "single", "label": "單人房", "price": 1500, "currency": "USD"},
        ],
    },
    {
        "name": "Diving Experience Package",
        "nameZh": "潛水體驗套餐",
        "slug": "diving-experience-package",
        "duration": "8日7晚",
        "location": "馬爾代夫塔環礁 Thaa Atoll, Maldives",
        "audience": "持證潛水員／海洋愛好者",
        "description": "An 8-day diving package in Thaa Atoll with 12 guided dives, professional instructors and vibrant coral reefs.",
        "descriptionZh": "呢個 8 日潛水套餐設於塔環礁，帶你探索馬爾代夫奇妙海底世界。適合持有潛水執照嘅朋友同熱愛海洋嘅人士，暢遊色彩繽紛嘅珊瑚礁、近距離觀賞各類海洋生物，探訪印度洋一級潛水勝地。我哋提供舒適島上住宿，整個行程都有專業潛水教練帶領陪同。每一次潛水都會見到唔一樣嘅海底風景，不單有絢麗嘅珊瑚園同礁岩壁，更有機會遇上熱帶魚、海龜等各式海洋生物，驚喜處處。",
        "inclusions": [
            "7 晚住宿",
            "早、午、晚三餐",
            "清水、茶及咖啡任飲",
            "12 次潛水體驗",
            "配備 12 公升潛氣樽及潛水鉛塊",
            "專業潛水教練全程陪同",
            "所有稅項已全包",
        ],
        "days": 8,
        "pricing": [
            {"type": "shared", "label": "二人同房／雙人房", "price": 1300, "currency": "USD"},
            {"type": "single", "label": "單人房", "price": 1600, "currency": "USD"},
        ],
    },
]

def sql_str(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"

def sql_json(o) -> str:
    return sql_str(json.dumps(o, ensure_ascii=False))

lines = ["DELETE FROM packages;"]
now = "unixepoch()"
for idx, p in enumerate(packages, start=1):
    img = IMAGES[idx - 1]
    gallery = GALLERIES[idx - 1]
    itinerary = make_itinerary(p["days"])
    fields = """
        name, name_zh, slug, description, description_zh, duration, location, audience,
        inclusions, itinerary, pricing_options, terms, image_url, gallery,
        sort_order, status, created_at, updated_at
    """.strip()
    values = (
        f"{sql_str(p['name'])}, {sql_str(p['nameZh'])}, {sql_str(p['slug'])}, "
        f"{sql_str(p['description'])}, {sql_str(p['descriptionZh'])}, {sql_str(p['duration'])}, "
        f"{sql_str(p['location'])}, {sql_str(p['audience'])}, "
        f"{sql_json(p['inclusions'])}, {sql_json(itinerary)}, {sql_json(p['pricing'])}, "
        f"{sql_str(COMMON_TERMS)}, {sql_str(img)}, {sql_json(gallery)}, "
        f"{idx}, 'active', {now}, {now}"
    )
    lines.append(f"INSERT INTO packages ({fields}) VALUES ({values});")

sql = "\n".join(lines)
with open("worker/seed_packages.sql", "w", encoding="utf-8") as f:
    f.write(sql)

print("Generated worker/seed_packages.sql with", len(packages), "packages")
