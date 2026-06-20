# GoodStore CRM & WhatsApp 推廣分析報告

> 研究目標：分析 `E:\Projects\GoodStore` 的客戶管理與 WhatsApp 推廣功能，為 Stay Islands HK 提出可借鑑的設計建議。
> 分析日期：2026-06-20
> 分析範圍：`GoodStore/src`（前端頁面）、`GoodStore/worker`（後端 API）、`GoodStore/docs`、 `WHATSAPP_WEBHOOK_API.md`

---

## 1. GoodStore 功能摘要

GoodStore（好餸社企）是一套結合 **客戶下單頁 + 管理後台 + WhatsApp 自動通知 + 廣播推廣** 的社企電商平台。與客戶管理、CRM、推廣相關的核心功能如下：

### 1.1 客戶管理相關功能

| 功能 | 說明 | 對應檔案 / API |
|------|------|----------------|
| **客戶名單（Customers）** | 從 `order_records` 聚合出的客戶列表，含姓名、電話、屋苑、最近下單時間、總訂單數、總消費額。 | `GET /api/public/admin/customers` |
| **客戶篩選** | 依付款狀態（全部 / 已付款）、屋苑（estate）、最近下單天數（7/30/90/180 天）篩選。 | `AdminBroadcast.tsx` |
| **客戶搜尋** | 依姓名或電話關鍵字搜尋。 | `AdminBroadcast.tsx` |
| **客戶選擇與群組** | 在「廣播推廣」頁面可勾選個別客戶、全選已篩選結果，作為群發目標。 | `AdminBroadcast.tsx` |
| **訂單與客戶關聯** | 客戶資料來自訂單表（`order_records`），透過電話號碼識別客戶身份。 | `worker/src/index.ts` |
| **推薦碼機制** | 新客下單時可填寫推薦碼（推薦人電話後 8 位），系統自動記錄 `referral_records` 並 WhatsApp 通知推薦人。 | `POST /api/public/orders` |

> **注意**：GoodStore 目前沒有獨立的 `customers` 資料表，客戶身份是透過 `order_records.phone` 即時聚合而來。也沒有「標籤」或「會員等級」機制。

### 1.2 WhatsApp 推廣功能

| 功能 | 說明 | 對應檔案 / API |
|------|------|----------------|
| **訊息模板（Campaign Templates）** | 可建立、編輯、刪除、預覽推廣訊息模板，支援 `{{name}}` 變數替換。 | `broadcast_campaigns` 表 + `AdminBroadcast.tsx` |
| **批次群發（Broadcast Batches）** | 選擇模板 + 目標客戶群組，建立發送批次，記錄目標人數、速率配置、發送進度。 | `broadcast_batches` + `broadcast_logs` |
| **前端速率控制** | 批次發送由前端逐條調用 `POST /api/public/admin/broadcast-send`，隨機間隔 `rate_min_seconds` ~ `rate_max_seconds`（預設 25~120 秒），支援暫停 / 繼續 / 取消。 | `AdminBroadcast.tsx` |
| **發送日誌** | 每個目標一條 `broadcast_logs` 記錄，含狀態（pending/sent/failed）、錯誤訊息、發送時間。 | `broadcast_logs` |
| **對話管理** | 透過 Webhook 接收客戶訊息，儲存於 `whatsapp_messages`，後台可查看對話列表與歷史，並主動回覆。 | `AdminConversations.tsx` |
| **管理員主動發訊** | 在對話視窗輸入訊息，後端調用 CloudWAPI 發送並存入訊息紀錄。 | `POST /api/public/admin/whatsapp/send` |

### 1.3 其他相關管理後台功能

| 功能 | 說明 |
|------|------|
| **儀表板（Dashboard）** | KPI 卡片、近 7 天銷售趨勢、付款狀態分佈、庫存預警、最近訂單。 |
| **訂單管理** | 訂單列表、單筆詳情、更新付款/完成狀態、刪除訂單。 |
| **產品 / 套餐 / 媒體庫** | CMS 產品目錄、套餐配置、圖片上傳至 R2。 |
| **用戶管理（RBAC）** | `super_admin` / `admin` / `supplier` 三種角色；可重設密碼並透過 WhatsApp 發送登入資料。 |
| **系統設置** | 鍵值對設定（銀行帳號、FPS、最小提前下單天數等）。 |
| **審計日誌** | 記錄管理員的 CREATE / UPDATE / DELETE / LOGIN / COMPLETE / SEND_WHATSAPP 等操作。 |

---

## 2. 技術架構摘要

### 2.1 整體技術棧

| 層級 | 技術 |
|------|------|
| **前端** | React 18 + TypeScript + Vite 7 + Tailwind CSS 3 + React Router 6 + Lucide React |
| **後端** | Hono（Cloudflare Worker）+ TypeScript |
| **資料庫** | Cloudflare D1（SQLite） |
| **快取 / 鍵值儲存** | Cloudflare KV（`CMS_DATA`） |
| **物件儲存** | Cloudflare R2（`PAYMENT_PROOFS`） |
| **WhatsApp 發送** | CloudWAPI（`https://unofficial.cloudwapi.in/send-message`） |
| **認證** | 自製 Bearer Token + RBAC（token 存於 `admin_users.token`） |
| **佈署** | GitHub Actions → Cloudflare Pages + Worker |

### 2.2 後端設計特點

- **單一 Worker 檔案架構**：所有 API 集中在 `worker/src/index.ts`（約 2300 行）。
- **懶加載 DB 初始化**：首次請求時執行 `initDB()`，自動建表、遷移、預設資料。
- **snake_case → camelCase 轉換**：D1 回傳 snake_case，後端統一透過 `snakeToCamel()` 轉換後回傳前端。
- **CORS**：`origin: "*"`，允許 `Authorization` header。
- **密碼雜湊**：SHA-256（單次、無 salt），文件中已標註生產環境建議遷移至 bcrypt/Argon2。
- **審計日誌**：所有管理操作寫入 `admin_audit_logs`。

### 2.3 WhatsApp 整合技術細節

```ts
// 發送函式（worker/src/index.ts）
async function sendWhatsAppMessage(env: Env, phone: string, message: string) {
  const pushUrl = new URL("https://unofficial.cloudwapi.in/send-message");
  pushUrl.searchParams.append("api_key", env.CLOUDWAPI_API_KEY);
  pushUrl.searchParams.append("sender", env.CLOUDWAPI_SENDER);
  pushUrl.searchParams.append("number", phone);
  pushUrl.searchParams.append("message", message);
  const res = await fetch(pushUrl.toString(), {
    headers: { "User-Agent": "GoodSung-Worker/1.0" },
  });
  return { success: res.ok, error?: string };
}
```

- **Webhook 接收**：`POST /api/webhooks/whatsapp`，支援多種格式解析（CloudWAPI、SaleSmartly、標準 WhatsApp Webhook）。
- **驗證碼處理**：偵測 6 位英數驗證碼，更新 `verification_sessions` 與 KV，並回覆「驗證成功」。
- **非驗證碼訊息**：存入 `whatsapp_messages`，供對話管理使用。

### 2.4 資料表總覽

GoodStore Worker 執行時會建立以下 14 張核心表：

| 資料表 | 用途 |
|--------|------|
| `order_records` | 訂單資料 |
| `verification_sessions` | 驗證碼會話 |
| `admin_users` | 管理員帳號與 Token |
| `campaigns` | 落地頁活動配置 |
| `broadcast_campaigns` | 廣播訊息模板 |
| `broadcast_batches` | 發送批次與進度 |
| `broadcast_logs` | 單條發送記錄 |
| `referral_records` | 推薦人記錄 |
| `cms_products` | 產品目錄 |
| `package_configs` | 套餐配置 |
| `admin_audit_logs` | 管理員操作審計 |
| `system_settings` | 系統鍵值設定 |
| `whatsapp_messages` | WhatsApp 對話訊息 |

> **補充**：GoodStore 專案 `src/__generated__` 中還有 EdgeSpark 平台產生的 `whatsapp_conversations`、`whatsapp_message_templates`、`whatsapp_scenarios` 等表，但 Worker 實際未使用，而是使用自行實作的 `broadcast_*` 與 `whatsapp_messages` 表。

---

## 3. 可直接借鑑到 Stay Islands HK 的功能清單

針對 Stay Islands HK 的需求（預約/諮詢/客戶旅程/CRM/推廣），以下 GoodStore 功能可直接借鑑：

### 3.1 客戶管理（建議優先導入）

| 借鑑項目 | 應用於 Stay Islands HK |
|----------|------------------------|
| **以電話為客戶唯一識別碼** | 將 `inquiries.phone` 與 `bookings` 中的客戶電話統一，建立客戶聚合視圖。 |
| **客戶列表與篩選** | 依「最近互動時間」、「預約狀態」、「諮詢主題」、「來源」篩選客戶。 |
| **客戶總覽卡片** | 顯示總預約數、總諮詢數、總消費、最近互動時間。 |
| **Journey Stage Tags** | 結合 PRD 提到的 `Leisure → Feeling → Desiring → Consulting → Owner → Advocate` 旅程標籤，取代 GoodStore 簡單的訂單狀態分群。 |

### 3.2 WhatsApp 推廣（建議優先導入）

| 借鑑項目 | 應用於 Stay Islands HK |
|----------|------------------------|
| **訊息模板管理** | 建立「節日優惠」、「新島嶼上架」、「預約提醒」、「會員專屬」等模板，支援 `{{name}}`、`{{property_name}}` 等變數。 |
| **批次群發 + 速率控制** | 針對特定客戶群組（如對某島嶼有興趣的潛在客戶）發送 WhatsApp 推廣，前端控制發送間隔避免被封鎖。 |
| **發送日誌與統計** | 記錄每則訊息的發送狀態，管理員可查看成功/失敗數量與錯誤原因。 |
| **對話管理** | 接收客戶 WhatsApp 訊息，統一在後台查看並回覆，避免訊息散落於個人手機。 |
| **自動通知觸發** | 預約成功、付款確認、諮詢回覆後自動發送 WhatsApp 通知。 |

### 3.3 管理後台（建議參考）

| 借鑑項目 | 應用於 Stay Islands HK |
|----------|------------------------|
| **RBAC 角色權限** | `superadmin` / `admin` / `island_owner`（對應 GoodStore 的 supplier）。 |
| **審計日誌** | 記錄管理員對客戶、預約、內容、推廣的操作，提升合規性（配合 PDPO）。 |
| **儀表板 KPI** | 總銷售額、總預約數、客戶數、付款狀態分佈、近期熱門島嶼。 |
| **系統設置** | 銀行帳號、WhatsApp 業務號碼、管理員電話、預設語言等。 |

---

## 4. 建議的 Stay Islands HK 客戶管理 + WhatsApp 推廣功能規格

### 4.1 功能模組

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin CRM / 推廣後台                      │
├─────────────────────────────────────────────────────────────┤
│  客戶管理 (Customers)                                        │
│    ├─ 客戶列表（聚合自 inquiries + bookings + whatsapp）     │
│    ├─ 客戶詳情（基本資料 + 互動時間軸 + 標籤 + 備註）        │
│    ├─ 標籤管理（Journey Stage + 自訂標籤）                   │
│    └─ 分群篩選（互動時間、來源、興趣島嶼、會員狀態）         │
├─────────────────────────────────────────────────────────────┤
│  WhatsApp 推廣 (Broadcast)                                   │
│    ├─ 訊息模板（變數支援、多語言預留）                       │
│    ├─ 批次發送（選擇客群 + 模板 + 速率配置）                 │
│    ├─ 發送進度與日誌（sent / failed / pending）              │
│    └─ 一對一對話（接收 + 回覆）                              │
├─────────────────────────────────────────────────────────────┤
│  自動通知 (Automated Notifications)                          │
│    ├─ 諮詢已收到確認                                         │
│    ├─ 預約成功確認                                           │
│    ├─ 付款確認                                               │
│    └─ 管理員新訊息提醒                                       │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 建議 API 端點

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/api/admin/customers` | 客戶列表（含篩選、搜尋、分頁） |
| GET | `/api/admin/customers/:id` | 客戶詳情 + 互動時間軸 |
| PATCH | `/api/admin/customers/:id` | 更新客戶標籤、備註、來源 |
| GET | `/api/admin/customer-tags` | 取得所有標籤 |
| POST | `/api/admin/customer-tags` | 新增標籤 |
| GET | `/api/admin/whatsapp/templates` | 訊息模板列表 |
| POST | `/api/admin/whatsapp/templates` | 新增模板 |
| PUT | `/api/admin/whatsapp/templates/:id` | 更新模板 |
| DELETE | `/api/admin/whatsapp/templates/:id` | 刪除模板 |
| POST | `/api/admin/whatsapp/broadcasts` | 建立批次群發 |
| GET | `/api/admin/whatsapp/broadcasts` | 批次列表 |
| GET | `/api/admin/whatsapp/broadcasts/:id/logs` | 批次發送日誌 |
| POST | `/api/admin/whatsapp/send` | 單一客戶發送 / 對話回覆 |
| GET | `/api/admin/whatsapp/conversations` | 對話列表 |
| GET | `/api/admin/whatsapp/conversations/:phone` | 單一對話歷史 |
| POST | `/api/webhooks/whatsapp` | 接收 WhatsApp Webhook |

### 4.3 建議前端頁面

| 頁面 | 路徑 | 權限 |
|------|------|------|
| 客戶管理 | `/admin/crm/customers` | admin, superadmin |
| 客戶詳情 | `/admin/crm/customers/:id` | admin, superadmin |
| 標籤管理 | `/admin/crm/tags` | admin, superadmin |
| WhatsApp 模板 | `/admin/crm/whatsapp/templates` | admin, superadmin |
| WhatsApp 群發 | `/admin/crm/whatsapp/broadcasts` | admin, superadmin |
| WhatsApp 對話 | `/admin/crm/whatsapp/conversations` | admin, superadmin |

### 4.4 變數與模板設計

建議模板支援以下變數：

| 變數 | 說明 |
|------|------|
| `{{name}}` | 客戶姓名 |
| `{{phone}}` | 客戶電話 |
| `{{property_name}}` | 感興趣的島嶼/物業名稱 |
| `{{check_in}}` | 入住日期 |
| `{{booking_id}}` | 預約編號 |
| `{{voucher_code}}` | 優惠碼 |

### 4.5 自動通知場景

| 場景 | 觸發條件 | 接收者 |
|------|----------|--------|
| 諮詢確認 | `POST /api/public/inquiries` 成功 | 客戶 |
| 預約確認 | `POST /api/bookings` 成功 | 客戶 |
| 付款確認 | 管理員更新 `payment_status` 為 `paid` | 客戶 |
| 新諮詢提醒 | 收到新 inquiry | 管理員 |
| 新預約提醒 | 收到新 booking | 管理員 |

---

## 5. 建議的資料表結構

以下資料表設計參考 GoodStore 的 `broadcast_campaigns`、`broadcast_batches`、`broadcast_logs`、`whatsapp_messages`，並針對 Stay Islands HK 的 CRM 需求進行擴充。

### 5.1 客戶主檔

```sql
CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL UNIQUE,           -- 標準化為 852XXXXXXXX
  name TEXT,
  email TEXT,
  preferred_language TEXT DEFAULT 'zh', -- zh / en
  source TEXT,                          -- inquiry / booking / whatsapp / referral
  journey_stage TEXT DEFAULT 'leisure', -- leisure / feeling / desiring / consulting / owner / advocate
  notes TEXT,
  total_inquiries INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,        -- 以「分」為單位
  last_contact_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE UNIQUE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_journey_stage ON customers(journey_stage);
CREATE INDEX idx_customers_last_contact ON customers(last_contact_at);
```

### 5.2 客戶標籤

```sql
CREATE TABLE customer_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#ea580c',         -- UI 顯示顏色
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE customer_tag_mappings (
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES customer_tags(id) ON DELETE CASCADE,
  created_at INTEGER DEFAULT (unixepoch()),
  PRIMARY KEY (customer_id, tag_id)
);
```

### 5.3 客戶互動時間軸

```sql
CREATE TABLE customer_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,          -- inquiry / booking / whatsapp_in / whatsapp_out / note / tag_change
  reference_id INTEGER,                 -- 關聯的 inquiry_id / booking_id / message_id
  title TEXT NOT NULL,
  details TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_activities_customer ON customer_activities(customer_id);
CREATE INDEX idx_activities_type ON customer_activities(activity_type);
```

### 5.4 WhatsApp 對話與訊息

```sql
CREATE TABLE whatsapp_conversations (
  phone TEXT PRIMARY KEY NOT NULL,
  customer_id INTEGER REFERENCES customers(id),
  last_message_at INTEGER,
  unread_count INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE whatsapp_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL,
  customer_id INTEGER REFERENCES customers(id),
  message TEXT NOT NULL,
  sender TEXT NOT NULL,                 -- 'user' / 'bot' / 'admin'
  admin_id INTEGER REFERENCES admins(id),
  direction TEXT NOT NULL,              -- 'inbound' / 'outbound'
  status TEXT DEFAULT 'received',       -- received / sent / delivered / read / failed
  error_message TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_whatsapp_messages_phone ON whatsapp_messages(phone);
CREATE INDEX idx_whatsapp_messages_created ON whatsapp_messages(created_at);
```

### 5.5 WhatsApp 訊息模板

```sql
CREATE TABLE whatsapp_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  scenario_key TEXT NOT NULL,           -- broadcast / booking_confirmation / payment_confirmation 等
  lang TEXT NOT NULL DEFAULT 'zh',
  content TEXT NOT NULL,
  variables_json TEXT DEFAULT '[]',     -- ["name", "property_name", "check_in"]
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_by INTEGER REFERENCES admins(id),
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE UNIQUE INDEX uq_whatsapp_templates_active
  ON whatsapp_templates(scenario_key, lang) WHERE is_active = 1;
```

### 5.6 廣播批次與日誌

```sql
CREATE TABLE broadcast_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL REFERENCES whatsapp_templates(id),
  name TEXT NOT NULL,
  target_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',        -- pending / sending / completed / cancelled
  rate_min_seconds INTEGER DEFAULT 25,
  rate_max_seconds INTEGER DEFAULT 120,
  wave_size INTEGER DEFAULT 50,
  wave_interval_seconds INTEGER DEFAULT 300,
  filters_json TEXT,                    -- 儲存篩選條件 JSON
  created_by INTEGER REFERENCES admins(id),
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE broadcast_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL REFERENCES broadcast_batches(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES customers(id),
  phone TEXT NOT NULL,
  name TEXT,
  message_content TEXT NOT NULL,
  status TEXT DEFAULT 'pending',        -- pending / sent / failed
  error_message TEXT,
  sent_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_broadcast_logs_batch ON broadcast_logs(batch_id);
CREATE INDEX idx_broadcast_logs_status ON broadcast_logs(status);
```

### 5.7 管理員與審計日誌（擴充現有 `admins` 表）

```sql
-- 擴充現有 admins 表（若尚未存在則新增欄位）
ALTER TABLE admins ADD COLUMN display_name TEXT;
ALTER TABLE admins ADD COLUMN phone TEXT;
ALTER TABLE admins ADD COLUMN is_active INTEGER DEFAULT 1;
ALTER TABLE admins ADD COLUMN last_login_at INTEGER;
ALTER TABLE admins ADD COLUMN updated_at INTEGER DEFAULT (unixepoch());

CREATE TABLE admin_audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER REFERENCES admins(id),
  admin_email TEXT,
  admin_role TEXT,
  action TEXT NOT NULL,                 -- CREATE / UPDATE / DELETE / LOGIN / SEND_WHATSAPP / BROADCAST
  target_type TEXT,                     -- customer / booking / inquiry / template / broadcast_batch / message
  target_id TEXT,
  details TEXT,                         -- JSON
  ip_address TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_audit_logs_admin ON admin_audit_logs(admin_id);
CREATE INDEX idx_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_audit_logs_target ON admin_audit_logs(target_type, target_id);
CREATE INDEX idx_audit_logs_created ON admin_audit_logs(created_at);
```

### 5.8 系統設定

```sql
CREATE TABLE system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_by INTEGER REFERENCES admins(id),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- 建議預設值
INSERT INTO system_settings (key, value, description) VALUES
('whatsapp_business_phone', '85200000000', 'WhatsApp Business 號碼'),
('whatsapp_admin_phone', '85200000000', '接收管理員提醒的 WhatsApp 號碼'),
('broadcast_rate_min_seconds', '25', '群發最小間隔（秒）'),
('broadcast_rate_max_seconds', '120', '群發最大間隔（秒）'),
('default_language', 'zh', '預設語言');
```

---

## 6. 實施建議與注意事項

### 6.1 分階段導入

1. **第一階段：客戶聚合與對話管理**
   - 建立 `customers` 聚合視圖（從 `inquiries` + `bookings`）。
   - 建立 `whatsapp_messages` 與 Webhook 接收。
   - 後台可查看客戶與對話。

2. **第二階段：標籤與分群**
   - 加入 `customer_tags` 與 Journey Stage Tags。
   - 客戶詳情頁顯示互動時間軸。

3. **第三階段：群發推廣**
   - 建立 `whatsapp_templates`、`broadcast_batches`、`broadcast_logs`。
   - 前端批次發送介面（參考 GoodStore `AdminBroadcast.tsx`）。

4. **第四階段：自動通知**
   - 預約、付款、諮詢等關鍵事件自動發送 WhatsApp。

### 6.2 合規與風險

- **PDPO（香港個人資料私隱條例）**：發送推廣訊息前應取得客戶同意（opt-in），並提供取消訂閱機制。
- **WhatsApp 商業政策**：避免過度群發導致號碼被封鎖，務必實作速率控制與發送上限。
- **資料留存**：訊息紀錄、審計日誌建議保留合理期限，並定期清理失敗日誌。

### 6.3 相較 GoodStore 的改進點

| GoodStore 現況 | Stay Islands HK 建議改進 |
|----------------|--------------------------|
| 無獨立 `customers` 表，客戶由訂單聚合 | 建立獨立 `customers` 主檔，統一管理客戶資料。 |
| 無標籤與旅程階段 | 引入 Journey Stage Tags + 自訂標籤，支援精準分群。 |
| 群發由前端控制速率 | 可考慮 Worker 端增加佇列/排程機制，提升穩定性。 |
| 使用 CloudWAPI（第三方） | 評估是否改用官方 WhatsApp Business API 或 Meta Cloud API，提升可靠性。 |
| SHA-256 無 salt | 管理員密碼應使用 bcrypt/Argon2（EdgeSpark 已處理則可忽略）。 |

---

## 7. 參考文件

| 文件 | 路徑 |
|------|------|
| GoodStore 系統架構 | `E:\Projects\GoodStore\docs\ARCHITECTURE.md` |
| GoodStore 資料庫架構 | `E:\Projects\GoodStore\docs\DATABASE.md` |
| GoodStore API 文件 | `E:\Projects\GoodStore\docs\API.md` |
| WhatsApp Webhook API | `E:\Projects\GoodStore\WHATSAPP_WEBHOOK_API.md` |
| Worker 入口 | `E:\Projects\GoodStore\worker\src\index.ts` |
| 廣播推廣前端 | `E:\Projects\GoodStore\src\pages\AdminBroadcast.tsx` |
| WhatsApp 對話前端 | `E:\Projects\GoodStore\src\pages\AdminConversations.tsx` |
| Stay Islands HK 後端 | `E:\Projects\MV\extracted\backend\server\src\index.ts` |
| Stay Islands HK 資料庫結構 | `E:\Projects\MV\extracted\backend\server\src\__generated__\db_raw_schema.sql` |

---

*本報告由 AI 代理根據程式碼與文件分析產生，未修改任何原始碼。*
