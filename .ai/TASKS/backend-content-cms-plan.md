# HK Islanders — 後台內容管理系統（CMS）建置計劃

## 專案目標

將目前寫死在前端程式碼中的住宿豐富資料、海島體驗（Experiences）、主題靜修（Retreats）搬遷至後端 D1 資料庫，並在現有 AdminPage 提供後台管理介面，讓營運團隊可以直接在後台修改內容，前台即時生效。

## 範圍確認

- ✅ 住宿（Properties）：基本資料 + gallery / facilities / activities / location_details / story
- ✅ 房型（Room Types）：擴充 bed_type / view / size_sqm / occupancy / gallery / features
- ✅ 海島體驗（Experiences）：6 個活動後台化管理
- ✅ 主題靜修（Retreats）：4 個 Retreat 後台化管理
- ❌ 首頁 Hero / About / 旅客故事等全站文案（本次不納入，保留寫死）
- ❌ Site Settings（Footer 聯絡資訊等，本次不納入）

## 設計原則

- 前台每次載入都從 API 讀取，即時生效
- AdminPage 維持單頁多 tab 架構
- 資料庫空白時，前台保留 fallback demo 資料
- 所有 JSON 欄位在 Admin 介面中用結構化表單或 JSON editor 編輯

---

## Phase 1：資料庫 Schema 設計

### 1.1 擴充 `room_types` 表

```sql
ALTER TABLE room_types ADD COLUMN bed_type TEXT;
ALTER TABLE room_types ADD COLUMN view TEXT;
ALTER TABLE room_types ADD COLUMN size_sqm INTEGER;
ALTER TABLE room_types ADD COLUMN occupancy TEXT;
ALTER TABLE room_types ADD COLUMN gallery TEXT;     -- JSON array of image URLs
ALTER TABLE room_types ADD COLUMN features TEXT;    -- JSON array of strings
```

### 1.2 新建 `experiences` 表

```sql
CREATE TABLE IF NOT EXISTS experiences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  description_zh TEXT,
  duration TEXT,
  group_size TEXT,
  includes TEXT,        -- JSON array
  price_note TEXT,
  image_url TEXT,
  icon_name TEXT,
  sort_order INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

### 1.3 新建 `retreats` 表

```sql
CREATE TABLE IF NOT EXISTS retreats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  description_zh TEXT,
  duration TEXT,
  location TEXT,
  audience TEXT,
  itinerary TEXT,       -- JSON array of {day, title, desc}
  price_note TEXT,
  image_url TEXT,
  icon_name TEXT,
  sort_order INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

### 1.4 確認 `properties` 既有欄位

已存在的 JSON TEXT 欄位：
- `gallery`
- `facilities`
- `activities`
- `location_details`
- `story`

需要確認 Admin API 的 `PATCH /api/admin/properties/:id` 可以完整讀寫這些欄位。

---

## Phase 2：Worker API 開發

### 2.1 公開 API

| 端點 | 方法 | 用途 |
|---|---|---|
| `/api/public/experiences` | GET | 取得所有 active experiences |
| `/api/public/experiences/:slug` | GET | 取得單一 experience |
| `/api/public/retreats` | GET | 取得所有 active retreats |
| `/api/public/retreats/:slug` | GET | 取得單一 retreat |
| `/api/public/properties/:id` | GET | 回傳完整資料（含 JSON 欄位） |
| `/api/public/properties/:id/rooms` | GET | 回傳該物業所有房型（含新欄位） |

### 2.2 Admin API

| 端點 | 方法 | 用途 |
|---|---|---|
| `/api/admin/experiences` | GET/POST | 列表 / 新增 |
| `/api/admin/experiences/:id` | PATCH/DELETE | 更新 / 刪除 |
| `/api/admin/retreats` | GET/POST | 列表 / 新增 |
| `/api/admin/retreats/:id` | PATCH/DELETE | 更新 / 刪除 |
| `/api/admin/properties/:id` | PATCH | 擴充支援 JSON 欄位更新 |
| `/api/admin/room-types/:id` | PATCH | 擴充支援新欄位更新 |

---

## Phase 3：AdminPage 後台介面擴充

在 `src/pages/AdminPage.tsx` 中新增以下 tab：

### 3.1 Experiences Tab

- 列表：name_zh、duration、status、sort_order
- 新增 / 編輯表單：
  - name, name_zh
  - slug
  - description, description_zh
  - duration, group_size
  - includes（textarea，每行一項）
  - price_note
  - image_url
  - icon_name（下拉選擇 lucide icon）
  - sort_order
  - status（active/inactive）

### 3.2 Retreats Tab

- 列表：name_zh、duration、location、status
- 新增 / 編輯表單：
  - name, name_zh
  - slug
  - description, description_zh
  - duration, location, audience
  - itinerary（JSON textarea 或動態表單：day / title / desc）
  - price_note
  - image_url
  - icon_name
  - sort_order
  - status

### 3.3 Properties 編輯擴充

在現有 Property 編輯表單中新增 JSON editor：
- Gallery（圖片 URL 陣列）
- Facilities（{icon, label} 陣列）
- Activities（{image, name, description} 陣列）
- Location Details（{description, mapImage, nearby}）
- Story（{title, content}）

### 3.4 Room Types 編輯擴充

在現有 Room Type 編輯表單中新增：
- bed_type（text input）
- view（text input）
- size_sqm（number input）
- occupancy（text input）
- gallery（圖片 URL 陣列）
- features（textarea，每行一項）

---

## Phase 4：前端頁面修改

### 4.1 `src/pages/ExperiencesPage.tsx`

**修改內容記錄：**
- 移除寫死的 `experiences` 常數陣列
- 新增 `useState` 儲存從 API 載入的 experiences
- 新增 `useEffect` 呼叫 `GET /api/public/experiences`
- 新增 loading / error / empty 狀態 UI
- 諮詢表單維持不變
- 若 API 回傳空陣列，保留現有寫死資料作為 fallback

### 4.2 `src/pages/RetreatsPage.tsx`

**修改內容記錄：**
- 移除寫死的 `retreats` 常數陣列
- 新增 `useState` 儲存從 API 載入的 retreats
- 新增 `useEffect` 呼叫 `GET /api/public/retreats`
- 新增 loading / error / empty 狀態 UI
- 若 API 回傳空陣列，保留現有寫死資料作為 fallback

### 4.3 `src/pages/PropertyDetailPage.tsx`

**修改內容記錄：**
- 房型展示改為「卡片 grid + 點擊展開詳情」：
  - 每個房型獨立卡片：圖片、名稱、床型、景觀、面積、入住人數、特色
  - 點擊卡片展開詳情：gallery 輪播、更多描述、設施、預訂諮詢按鈕
- 確保 gallery / facilities / activities / locationDetails / story 從 API property 物件讀取
- 維持 API 失敗或資料缺失時的 fallback demo 資料

### 4.4 `src/pages/HomePage.tsx`

**修改內容記錄：**
- Experiences Preview：從 API 讀取前 3 筆 active experiences
- Retreats Preview：從 API 讀取前 2 筆 active retreats
- Properties Preview：從 API 讀取所有 active properties，取代寫死 3 個
- 新增 loading skeleton 或保留靜態 fallback

### 4.5 `src/api/client.ts`（如有需要）

**修改內容記錄：**
- 確保 `client.api.fetch` 可以正確處理新的 public endpoints
- 無需新增 wrapper，直接使用既有 `client.api.fetch`

---

## Phase 5：資料遷移

### 5.1 Experiences 種子資料

將目前 `ExperiencesPage.tsx` 中的 6 個活動轉換為 SQL INSERT：
- Night Fishing Trip / 夜釣之旅
- Snorkeling & Diving / 浮潛與潛水
- Sunset Cruise / 日落巡航
- Island Hopping / 跳島探索
- Whale Shark & Manta / 鯨鯊與魔鬼魚
- Local Island Visit / 本地島嶼文化體驗

### 5.2 Retreats 種子資料

將目前 `RetreatsPage.tsx` 中的 4 個 Retreat 轉換為 SQL INSERT：
- Yoga & Adventure Retreat / 瑜伽與冒險靜修
- Surf Retreat / 衝浪靜修
- Couple Getaway / 浪漫雙人靜修
- Fishing Package / 釣魚套餐

### 5.3 Properties 豐富資料

將 `PropertyDetailPage.tsx` 中三個 demo properties 的 JSON 資料 update 到 D1 `properties` 表的對應欄位。

### 5.4 Room Types 資料擴充

為現有 demo room types 補上：
- bed_type
- view
- size_sqm
- occupancy
- gallery
- features

---

## Phase 6：部署與驗證

### 6.1 後端部署

1. 建立 D1 migration 檔案（`worker/migrations/0002_add_cms_tables.sql`）
2. 執行 `wrangler d1 migrations apply stay-islands-hk-db --remote`
3. 執行種子腳本填充 experiences / retreats / properties / room_types 資料
4. 執行 `wrangler deploy`

### 6.2 前端部署

1. `pnpm exec tsc --noEmit`
2. `pnpm run build`
3. `git add / commit / push origin main`
4. 等待 Cloudflare Pages 自動部署

### 6.3 測試清單

- [ ] Admin 可新增 / 編輯 / 刪除 Experience
- [ ] Admin 可新增 / 編輯 / 刪除 Retreat
- [ ] Admin 可編輯 Property 的 gallery / facilities / activities / locationDetails / story
- [ ] Admin 可編輯 Room Type 的 bed_type / view / gallery / features 等
- [ ] 前台 `/experiences` 正確顯示資料庫內容
- [ ] 前台 `/retreats` 正確顯示資料庫內容
- [ ] 前台 `/properties/:id` 房型展示為「卡片 grid + 展開詳情」
- [ ] 首頁 Experiences / Retreats / Properties Preview 從 API 讀取
- [ ] API 資料缺失時，fallback demo 資料正常顯示

---

## 前端內容修改總覽

| 頁面 / 檔案 | 修改類型 | 主要變更 |
|---|---|---|
| `src/pages/ExperiencesPage.tsx` | 資料來源改 API | 移除寫死陣列，改為 `useEffect` 載入 |
| `src/pages/RetreatsPage.tsx` | 資料來源改 API | 移除寫死陣列，改為 `useEffect` 載入 |
| `src/pages/PropertyDetailPage.tsx` | UI 改版 + 資料來源確認 | 房型改為卡片 grid + 展開詳情，確認 JSON 欄位從 API 讀取 |
| `src/pages/HomePage.tsx` | 資料來源改 API | Experiences / Retreats / Properties Preview 改 API 載入 |
| `src/pages/AdminPage.tsx` | 新增 tab | 新增 Experiences / Retreats，擴充 Properties / Room Types 編輯 |
| `worker/src/routes/public.ts` | 新增端點 | Experiences / Retreats / Property rooms endpoints |
| `worker/src/routes/admin.ts` | 新增端點 + 擴充 | Experiences / Retreats CRUD，擴充 Properties / Room Types update |
| `worker/src/db/schema.ts` | 擴充 interface | Room Type 新欄位、Experience interface、Retreat interface |
| `worker/schema.sql` | 新增表 + 擴充表 | experiences / retreats 表，room_types 新欄位 |
| `worker/migrations/0002_add_cms_tables.sql` | 新建 migration | Schema 變更 |
| `worker/src/lib/seed.ts` | 擴充種子 | Experiences / Retreats / Properties / Room Types 資料 |

---

## 後續延續與維護說明

- 未來新增體驗或 Retreat，只需在 Admin 後台新增，無需改程式碼
- 未來調整房型資訊或圖片，只需在 Admin 後台編輯
- 未來若要將首頁 Hero / About / 旅客故事也後台化，可再新增 `site_content` 或 `cms_blocks` 表
- 所有 Admin API 變更都應記錄 audit log（現有 `audit_logs` 表已支援）
