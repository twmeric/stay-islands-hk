# Stay Islands HK — 後端遷移規劃（EdgeSpark → Cloudflare Workers + D1 + R2）

> 專案路徑：`E:\Projects\MV\extracted`  
> 現況：前端（React + TypeScript + Vite + Tailwind CSS）已部署至 Cloudflare Pages；後端仍指向 EdgeSpark staging（`https://staging--4ea90hamxnhi5jzf7tqf.youbase.cloud`）。  
> 目標：將 public properties API 與 lead capture 功能遷移至自管的 Cloudflare Workers + D1，並以 Hono 作為路由框架。R2 作為可選的靜態資源儲存。

---

## 1. 目標與範圍

### 1.1 為何遷移

- **減少外部依賴**：EdgeSpark staging 環境並非專案可控，長期維運與成本不透明。
- **與前端部署對齊**：Cloudflare Pages 已在前端使用，遷移到同一生態系（Workers / D1 / R2）可統一網路、認證、日誌與 DNS 管理。
- **成本與擴展性**：Cloudflare Workers 按請求計費，D1 提供 Serverless SQLite，適合目前以讀取為主、表單寫入量低的 use case。
- **可自訂路由與驗證**：Hono 輕量且 TypeScript 友好，能精確控制 public API 與 CORS。

### 1.2 需要取代的功能

| 功能 | 現況 | 遷移優先級 |
|------|------|-----------|
| Public properties API | `client.api.fetch('/api/public/properties')` 被 mock 攔截，回傳 demo 資料 | **P0 — 必做** |
| Property detail API | `client.api.fetch('/api/public/properties/:id')` 被 mock 攔截 | **P0 — 必做** |
| Experience inquiry（體驗查詢） | PropertyDetailPage 表單僅 `console.log`，尚未接後端 | **P0 — 必做** |
| Island owner talk（島主對話） | InvestPage 表單僅 `setSubmitted(true)`，尚未接後端 | **P0 — 必做** |
| Free inspiration guide（免費靈感集） | HomePage 電郵輸入框為靜態，未接後端 | **P0 — 必做** |
| 認證（Auth / Member / Admin） | 登入功能已降級，AdminPage / MemberPage 目前未啟用完整權限 | **P2 — 可選** |
| 管理後台 | 暫以靜態頁面呈現，未來再擴充 | **P2 — 可選** |

### 1.3 不取代的範圍

- EdgeSpark 上非 Stay Islands HK 專案使用的其他資料表與業務邏輯。
- 第三方金流、訂房系統、Email 發送服務（仍需額外整合，例如 Resend / SendGrid / Mailchimp）。

---

## 2. 技術棧

| 層級 | 技術 | 用途 |
|------|------|------|
| Runtime | Cloudflare Workers | Serverless edge runtime，與 Pages 同網路部署 |
| Router | Hono | 輕量、TypeScript-first、Middleware 生態成熟 |
| Database | D1 (SQLite) | properties、room_types、leads 資料儲存 |
| Object Storage | R2 | 圖片與靜態資源（可選，現階段可先用既有外部圖片 URL） |
| CLI / Deploy | Wrangler CLI | 本地開發、schema 遷移、部署與 secrets 管理 |
| ORM / Query | 建議手寫 SQL + D1 prepared statements | 降低依賴；如需要 ORM，可評估 Drizzle ORM（D1 支援良好） |

---

## 3. API Endpoints 規劃

### 3.1 Public Properties

#### `GET /api/public/properties`

回傳 properties 列表（不含 roomTypes 詳細內容，以減少 payload）。

**Response 200**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Stay Mikado",
      "nameZh": "御海閣",
      "description": "Boutique overwater villas.",
      "descriptionZh": "坐落於清澈潟湖之上的奢華水上別墅...",
      "location": "North Malé Atoll",
      "pricePerNight": 4800,
      "maxGuests": 4,
      "imageUrl": "https://images.unsplash.com/...",
      "amenities": "[\"私人泳池\",\"管家服務\",\"水上飛機\"]"
    }
  ]
}
```

#### `GET /api/public/properties/:id`

回傳單一 property 詳情，包含 `roomTypes` 陣列。

**Response 200**

```json
{
  "data": {
    "id": 1,
    "name": "Stay Mikado",
    "nameZh": "御海閣",
    "description": "A boutique overwater villa collection in the Maldives.",
    "descriptionZh": "御海閣坐落於馬爾代夫清澈潟湖之上...",
    "location": "North Malé Atoll, Maldives",
    "pricePerNight": 4800,
    "maxGuests": 4,
    "imageUrl": "https://images.unsplash.com/...",
    "amenities": "[\"私人泳池\",\"水上飛機接送\",\"24 小時管家\",...]",
    "roomTypes": [
      {
        "id": 101,
        "name": "Lagoon Villa",
        "nameZh": "潟湖別墅",
        "description": "Overwater villa with lagoon views.",
        "descriptionZh": "坐擁潟湖美景的水上別墅...",
        "pricePerNight": 4800,
        "maxGuests": 2,
        "inventory": 3,
        "imageUrl": "https://images.unsplash.com/...",
        "amenities": "[\"海景露台\",\"浴缸\",\"空調\",\"Wi-Fi\"]"
      },
      {
        "id": 102,
        "name": "Ocean Suite",
        "nameZh": "海洋套房",
        "description": "Spacious suite with private pool.",
        "descriptionZh": "寬敞海洋套房，設有私人無邊際泳池...",
        "pricePerNight": 7800,
        "maxGuests": 4,
        "inventory": 2,
        "imageUrl": "https://images.unsplash.com/...",
        "amenities": "[\"私人泳池\",\"客廳\",\"管家服務\",\"迎賓香檳\"]"
      }
    ]
  }
}
```

**Response 404**

```json
{ "error": "Property not found" }
```

---

### 3.2 Lead Capture

所有 leads endpoints 皆回傳 `{ "success": true }` 並將資料寫入 `leads` 表；後續可擴充 webhook / email 通知。

#### `POST /api/leads/experience-inquiry`

對應 PropertyDetailPage 的「體驗查詢」表單。

**Request Body**

```json
{
  "propertyId": 1,
  "roomTypeId": 101,
  "name": "陳先生",
  "email": "chan@example.com",
  "phone": "+852 9123 4567",
  "checkIn": "2026-08-15",
  "days": 3,
  "message": "希望安排蜜月行程"
}
```

**欄位驗證**

- `propertyId`：required, integer
- `roomTypeId`：optional, integer
- `name`：required, max 100 chars
- `email`：required, valid email
- `phone`：required, max 50 chars
- `checkIn`：optional, ISO date (YYYY-MM-DD)
- `days`：optional, integer, min 1
- `message`：optional, max 2000 chars

**Response 201**

```json
{ "success": true, "message": "Inquiry received" }
```

**Response 400**

```json
{ "success": false, "error": "Invalid email" }
```

#### `POST /api/leads/island-owner-talk`

對應 InvestPage 的「預約島主對話」表單。

**Request Body**

```json
{
  "name": "林女士",
  "email": "lam@example.com",
  "phone": "+852 9123 4567",
  "vibe": "private",
  "property": "mikado",
  "message": "想了解家族持有的可能性"
}
```

**欄位驗證**

- `name`：required, max 100 chars
- `email`：required, valid email
- `phone`：required, max 50 chars
- `vibe`：optional, enum `['private','active','quiet','family','undecided']`
- `property`：optional, enum `['mikado','private-island','madivaru','undecided']`
- `message`：optional, max 2000 chars

**Response 201**

```json
{ "success": true, "message": "Talk request received" }
```

#### `POST /api/leads/inspiration-guide`

對應 HomePage 的《成為島主的 7 種生活方式》電郵訂閱。

**Request Body**

```json
{
  "email": "user@example.com"
}
```

**欄位驗證**

- `email`：required, valid email, max 255 chars

**Response 201**

```json
{ "success": true, "message": "Guide will be sent to your email" }
```

---

## 4. D1 Schema 建議

Schema 參考現有 `src/api/client.ts` 的 demo properties 結構設計。

### 4.1 `properties` 表

```sql
CREATE TABLE IF NOT EXISTS properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  description TEXT,
  description_zh TEXT,
  location TEXT,
  price_per_night INTEGER NOT NULL,
  max_guests INTEGER,
  image_url TEXT,
  amenities TEXT,              -- JSON array stored as TEXT
  is_active INTEGER DEFAULT 1, -- 0 = hidden, 1 = visible
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_properties_is_active ON properties(is_active);
```

### 4.2 `room_types` 表

為了保持與現有 `Property` interface 一致，room types 獨立成表，並透過 `property_id` 關聯。

```sql
CREATE TABLE IF NOT EXISTS room_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  description TEXT,
  description_zh TEXT,
  price_per_night INTEGER NOT NULL,
  max_guests INTEGER,
  inventory INTEGER DEFAULT 0,
  image_url TEXT,
  amenities TEXT,              -- JSON array stored as TEXT
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_room_types_property_id ON room_types(property_id);
```

> 備註：`amenities` 以 JSON TEXT 儲存，與 `client.ts` 現有格式一致，前端可沿用 `JSON.parse()`。

### 4.3 `leads` 表

統一儲存三種 lead capture 表單，透過 `lead_type` 區分。

```sql
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_type TEXT NOT NULL CHECK(lead_type IN ('experience-inquiry', 'island-owner-talk', 'inspiration-guide')),

  -- Common contact info
  name TEXT,
  email TEXT NOT NULL,
  phone TEXT,

  -- experience-inquiry fields
  property_id INTEGER,
  room_type_id INTEGER,
  check_in TEXT,               -- YYYY-MM-DD
  days INTEGER,

  -- island-owner-talk fields
  vibe TEXT,
  property TEXT,               -- slug: mikado / private-island / madivaru / undecided

  -- free text
  message TEXT,

  -- metadata
  ip_address TEXT,
  user_agent TEXT,
  source TEXT,                 -- e.g. homepage, property-detail, invest-page
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_type ON leads(lead_type);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
```

### 4.4 Seed Data

依據 `client.ts` 的 `demoPropertiesList` 與 `demoPropertiesDetail` 初始化三筆 properties 與對應 room types。

```sql
-- properties
INSERT INTO properties (id, name, name_zh, description, description_zh, location, price_per_night, max_guests, image_url, amenities) VALUES
(1, 'Stay Mikado', '御海閣', 'Boutique overwater villas.', '坐落於清澈潟湖之上的奢華水上別墅，配備私人泳池與管家服務。', 'North Malé Atoll, Maldives', 4800, 4, 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80', '["私人泳池","水上飛機接送","24 小時管家","浮潛裝備","海鮮晚餐","SPA"]'),
(2, 'Private Island', '私享島嶼', 'Exclusive private island retreat.', '整島出租的頂級私人島嶼，適合家族或高端團體的私密度假。', 'Baa Atoll, Maldives', 12800, 12, 'https://images.unsplash.com/photo-1688949078626-a358f500e063?w=1200&q=80', '["私人島嶼","廚師團隊","遊艇","管家服務","SPA","私人影院"]'),
(3, 'Stay Madivaru', '碧海灣', 'Beachfront villas with reef access.', '沙灘別墅直通珊瑚礁，浮潛與潛水愛好者的天堂。', 'South Ari Atoll, Maldives', 3200, 3, 'https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?w=1200&q=80', '["珊瑚礁","浮潛","海灘晚餐","潛水中心","日落巡航"]');

-- room_types for Stay Mikado
INSERT INTO room_types (property_id, name, name_zh, description, description_zh, price_per_night, max_guests, inventory, image_url, amenities) VALUES
(1, 'Lagoon Villa', '潟湖別墅', 'Overwater villa with lagoon views.', '坐擁潟湖美景的水上別墅，配備私人露台與下沉式沙發。', 4800, 2, 3, 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600', '["海景露台","浴缸","空調","Wi-Fi"]'),
(1, 'Ocean Suite', '海洋套房', 'Spacious suite with private pool.', '寬敞海洋套房，設有私人無邊際泳池與獨立客廳。', 7800, 4, 2, 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600', '["私人泳池","客廳","管家服務","迎賓香檳"]');

-- room_types for Private Island
INSERT INTO room_types (property_id, name, name_zh, description, description_zh, price_per_night, max_guests, inventory, image_url, amenities) VALUES
(2, 'Lagoon Villa', '潟湖別墅', 'Overwater villa with lagoon views.', '坐擁潟湖美景的水上別墅，配備私人露台與下沉式沙發。', 12800, 2, 3, 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600', '["海景露台","浴缸","空調","Wi-Fi"]'),
(2, 'Ocean Suite', '海洋套房', 'Spacious suite with private pool.', '寬敞海洋套房，設有私人無邊際泳池與獨立客廳。', 20800, 4, 2, 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600', '["私人泳池","客廳","管家服務","迎賓香檳"]');

-- room_types for Stay Madivaru
INSERT INTO room_types (property_id, name, name_zh, description, description_zh, price_per_night, max_guests, inventory, image_url, amenities) VALUES
(3, 'Lagoon Villa', '潟湖別墅', 'Overwater villa with lagoon views.', '坐擁潟湖美景的水上別墅，配備私人露台與下沉式沙發。', 3200, 2, 3, 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600', '["海景露台","浴缸","空調","Wi-Fi"]'),
(3, 'Ocean Suite', '海洋套房', 'Spacious suite with private pool.', '寬敞海洋套房，設有私人無邊際泳池與獨立客廳。', 5200, 4, 2, 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600', '["私人泳池","客廳","管家服務","迎賓香檳"]');
```

---

## 5. 專案結構建議

建議在 `extracted/` 下新增獨立的 worker 目錄，避免與前端 `src/` 混用。

```
extracted/
├── .ai/TASKS/backend-migration.md   # 本文件
├── src/                             # 前端原始碼（不修改）
├── worker/                          # Cloudflare Worker 專案
│   ├── package.json
│   ├── tsconfig.json
│   ├── wrangler.toml
│   ├── .dev.vars.example
│   └── src/
│       ├── index.ts                 # Hono app entry + CORS + 路由綁定
│       ├── routes/
│       │   ├── properties.ts        # GET /api/public/properties
│       │   ├── propertyDetail.ts    # GET /api/public/properties/:id
│       │   └── leads.ts             # POST /api/leads/*
│       ├── db/
│       │   ├── schema.sql           # D1 schema
│       │   └── seed.sql             # demo seed data
│       ├── types/
│       │   └── index.ts             # TypeScript interfaces
│       └── utils/
│           ├── validators.ts        # Zod / 手寫驗證
│           └── response.ts          # JSON response helpers
└── ...
```

### 5.1 主要檔案說明

| 檔案 | 用途 |
|------|------|
| `src/index.ts` | 建立 Hono app，掛載 middleware（CORS、logger、rate limiter），註冊 routes |
| `src/routes/properties.ts` | public properties 列表與詳情路由 |
| `src/routes/leads.ts` | 三個 lead capture endpoints |
| `src/db/schema.sql` | D1 建表語法 |
| `src/db/seed.sql` | 初始 demo properties / room_types 資料 |
| `src/utils/validators.ts` | 表單輸入驗證，建議使用 Zod 或手寫檢查 |
| `src/utils/response.ts` | 統一 `{ data }` / `{ success, error }` 回傳格式，與前端既有格式對齊 |

---

## 6. 遷移步驟（Checklist）

### Phase 1 — 環境初始化

- [ ] 在 `extracted/worker/` 初始化 Hono + Wrangler 專案：
  ```bash
  npm create cloudflare@latest -- extracted-worker --template hono
  # 或手動建立 worker/ 目錄並安裝 hono / wrangler
  ```
- [ ] 設定 `wrangler.toml`，綁定 D1 database（local + remote）。
- [ ] 建立 `.dev.vars.example`，記錄本地開發需要的環境變數（CORS origin、rate limit secret 等）。
- [ ] 安裝依賴：`hono`、`wrangler`、`zod`（可選）。

### Phase 2 — D1 建表與種子資料

- [ ] 將 `schema.sql` 與 `seed.sql` 放入 `worker/src/db/`。
- [ ] 本地執行：
  ```bash
  wrangler d1 execute stay-islands-db --local --file=./src/db/schema.sql
  wrangler d1 execute stay-islands-db --local --file=./src/db/seed.sql
  ```
- [ ] 驗證本地 D1 可查詢到三筆 properties 與對應 room types。

### Phase 3 — Worker 實作

- [ ] 實作 `GET /api/public/properties`（回傳 `data` 陣列）。
- [ ] 實作 `GET /api/public/properties/:id`（回傳 `data` 物件 + `roomTypes`）。
- [ ] 實作 `POST /api/leads/experience-inquiry`（含輸入驗證、D1 寫入）。
- [ ] 實作 `POST /api/leads/island-owner-talk`（含輸入驗證、D1 寫入）。
- [ ] 實作 `POST /api/leads/inspiration-guide`（含 email 驗證、D1 寫入）。
- [ ] 設定 CORS middleware，允許 Cloudflare Pages 域名（staging + production）。
- [ ] 加入基本 rate limiter（如 `hono-rate-limiter` 或 Cloudflare Cache API）防垃圾提交。

### Phase 4 — 本地整合測試

- [ ] `wrangler dev` 啟動 worker，確認 endpoints 回傳正確。
- [ ] 以 curl / Postman 測試三個 leads endpoints，確認驗證與錯誤格式。
- [ ] 檢查 `wrangler d1 execute ... --local --command="SELECT * FROM leads"` 是否有寫入。

### Phase 5 — 前端 `client.ts` 改接新 worker

- [ ] 新增 `workerUrl` 設定（例如透過環境變數 `VITE_WORKER_URL`）。
- [ ] 修改 `src/api/client.ts`：
  - 移除或停用 mock 攔截（保留 fallback 機制直到新 API 穩定）。
  - 改以 `fetch(\`${workerUrl}/api/public/properties\`)` 取代 `client.api.fetch`。
  - PropertyDetailPage / PropertiesPage 改用新的 fetch helper。
- [ ] 為三個 lead capture 表單接入對應 `POST` endpoints。
- [ ] 移除或標記棄用 `createEdgeSpark` 與 EdgeSpark baseUrl（待驗證無遺漏後再刪除）。

### Phase 6 — 部署與切換

- [ ] 建立遠端 D1 database：
  ```bash
  wrangler d1 create stay-islands-db
  ```
- [ ] 遠端執行 schema + seed：
  ```bash
  wrangler d1 execute stay-islands-db --remote --file=./src/db/schema.sql
  wrangler d1 execute stay-islands-db --remote --file=./src/db/seed.sql
  ```
- [ ] `wrangler deploy` 部署 worker，取得 production URL。
- [ ] 更新 Cloudflare Pages 環境變數 `VITE_WORKER_URL`。
- [ ] 重新部署前端 Pages，驗證新 API 與表單正常運作。

### Phase 7 — 清理 EdgeSpark 依賴

- [ ] 確認沒有任何頁面再呼叫 EdgeSpark staging URL。
- [ ] 從 `package.json` 移除 `@edgespark/client`。
- [ ] 刪除 `src/api/client.ts` 中與 EdgeSpark 相關的初始化與 mock 程式碼。
- [ ] 執行 `pnpm install` / `npm install` 更新 lockfile。
- [ ] 重新 build / deploy 前端驗證。

---

## 7. 風險與注意事項

| 風險 | 影響 | 建議處理方式 |
|------|------|-------------|
| D1 仍為 beta | API 與定價可能變動，部分進階 SQLite 功能有限 | 僅使用基礎 CRUD、保持 schema 簡單、定期查看 Cloudflare changelog |
| R2 公開訪問權限 | 圖片若放在 R2 並公開綁定 custom domain，需注意 bucket policy | 現階段可繼續使用 Unsplash 等外部圖片 URL；未來遷移到 R2 時設定 `r2.dev` subdomain 或 custom domain + 只讀 policy |
| CORS 設定過寬 | 開放 `*` 可能帶來安全風險 | 僅允許 Cloudflare Pages 的 production 與 preview domains；本地開發再額外允許 `localhost:5173` |
| 表單驗證與垃圾訊息 | leads endpoints 公開，可能被濫用 | 加入 rate limit、honeypot 欄位、email 格式驗證；後續可整合 Cloudflare Turnstile |
| Email 發送尚未整合 | 提交表單後目前僅寫入 D1 | 後續透過 Wrangler secret 設定 Resend / SendGrid API key，於 worker 中發送通知郵件 |
| 認證降級 | AdminPage / MemberPage 目前無完整權限控制 | 本次遷移先不實作 auth；未來可選 Cloudflare Access、JWT、或 D1 users 表 |
| 資料遷移 | EdgeSpark 上若有真實 leads 歷史資料需保留 | 評估是否有資料需要匯出；本次以 seed 新資料為主 |
| 環境變數管理 | worker URL、secrets 需區分 local / staging / production | 使用 `.dev.vars`（local）與 Wrangler secrets（remote），不將 secrets 寫入 `wrangler.toml` |

---

## 8. 附錄：與現有 `src/api/client.ts` 的對應

| client.ts 結構 | D1 對應 |
|----------------|---------|
| `Property.id` | `properties.id` |
| `Property.name` / `nameZh` | `properties.name` / `name_zh` |
| `Property.description` / `descriptionZh` | `properties.description` / `description_zh` |
| `Property.location` | `properties.location` |
| `Property.pricePerNight` | `properties.price_per_night` |
| `Property.maxGuests` | `properties.max_guests` |
| `Property.imageUrl` | `properties.image_url` |
| `Property.amenities`（JSON TEXT） | `properties.amenities`（JSON TEXT） |
| `RoomType.*` | `room_types.*` |
| `Property.roomTypes[]` | `JOIN room_types ON room_types.property_id = properties.id` |

此 schema 設計盡量與現有前端 interface 保持一致，減少前端改動幅度。
