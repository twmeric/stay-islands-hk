# HK Maldivers Referral Module — 軟體架構與設計文件（SA&D）

> **版本**: v1.0  
> **對應 PRD**: `docs/PRD_Referral_Module.md`

---

## 1. 架構總覽

Referral Module 內建於現有 `stay-islands-hk` 專案中，复用既有基礎設施：

- **Worker**: Cloudflare Worker + Hono（現有 `worker/src/routes/`）
- **Database**: Cloudflare D1（新增 referral 相關表）
- **WhatsApp**: CloudWAPI（現有 `worker/src/lib/cloudwapi.ts`）
- **Frontend**: React + Vite（現有 `src/pages/`）
- **Admin UI**: 現有 `AdminPage.tsx` 新增 tab

```
┌─────────────┐      QR/deeplink      ┌─────────────┐
│    Admin    │ ────────────────────→ │   分享夥伴   │
│   後台      │                       │  (WhatsApp) │
└──────┬──────┘                       └──────┬──────┘
       │                                      │
       │ 建立 referrers / 產生 code           │ 發送 HKMaldivers R-XXXXXX
       │                                      ▼
       │                               ┌─────────────┐
       │                               │  CloudWAPI  │
       │                               │  incoming   │
       │                               └──────┬──────┘
       │                                      │
       ▼                                      ▼
┌─────────────┐      專屬連結 + Dashboard    ┌─────────────┐
│  D1 Database │ ◄───────────────────────── │    Worker   │
│ referrers   │                            │ auto reply  │
└─────────────┘                            └──────┬──────┘
                                                  │
                       ┌──────────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  客人點擊專屬連結  │
              │  ?ref=R-XXXXXX   │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ 前台 captureRefCode()
              │ localStorage    │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ 提交預約          │
              │ POST /bookings   │
              │ 帶 referral_code │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ 後台標記 paid     │
              │ 計算佣金          │
              │ 通知夥伴          │
              └─────────────────┘
```

---

## 2. 資料模型

### 2.1 `referrers`

| 欄位 | 類型 | 說明 |
|---|---|---|
| `id` | INTEGER PK | |
| `name` | TEXT | 夥伴名稱 |
| `phone` | TEXT NULL | 夥伴電話（選填，供參考） |
| `referral_code` | TEXT UNIQUE | 如 `R-ABC123` |
| `token` | TEXT UNIQUE | Dashboard 密鑰 |
| `status` | TEXT | `active` / `inactive` |
| `total_referrals` | INTEGER DEFAULT 0 | 累計成交單數 |
| `total_commission` | INTEGER DEFAULT 0 | 累計佣金（分） |
| `paid_commission` | INTEGER DEFAULT 0 | 已發放佣金（分） |
| `created_at` | INTEGER | unixepoch |
| `updated_at` | INTEGER | unixepoch |

### 2.2 `referral_orders`

| 欄位 | 類型 | 說明 |
|---|---|---|
| `id` | INTEGER PK | |
| `booking_id` | INTEGER FK | 對應 `bookings.id` |
| `referrer_id` | INTEGER FK | 對應 `referrers.id` |
| `order_amount` | INTEGER | 訂單金額（分） |
| `commission_amount` | INTEGER | 佣金金額（分） |
| `currency` | TEXT | 預設 `HKD` |
| `status` | TEXT | `pending` / `approved` / `paid` / `cancelled` |
| `paid_at` | INTEGER NULL | |
| `created_at` | INTEGER | unixepoch |
| `updated_at` | INTEGER | unixepoch |

### 2.3 `referral_settings`

| 欄位 | 類型 | 說明 |
|---|---|---|
| `id` | INTEGER PK | 固定為 1 |
| `rules` | TEXT | JSON 規則 |
| `updated_at` | INTEGER | unixepoch |

預設 `rules`：
```json
{
  "mode": "percentage",
  "percentage": 5,
  "fixed_amount": 0,
  "currency": "HKD"
}
```

### 2.4 `bookings` 擴充

新增欄位：

| 欄位 | 類型 | 說明 |
|---|---|---|
| `referral_code` | TEXT NULL | 帶來此訂單的夥伴 code |

---

## 3. API 規格

### 3.1 Public API

#### `GET /api/public/referral/dashboard/:token`

取得夥伴 Dashboard 資料。

**Response 200:**
```json
{
  "data": {
    "name": "陳小B",
    "referral_code": "R-ABC123",
    "referral_link": "https://stay-islands-hk.pages.dev/?ref=R-ABC123",
    "total_referrals": 3,
    "pending_commission": 15000,
    "approved_commission": 0,
    "paid_commission": 5000,
    "recent_orders": [
      {
        "booking_id": 42,
        "order_amount": 100000,
        "commission_amount": 5000,
        "status": "paid",
        "created_at": 1751000000
      }
    ]
  }
}
```

**Response 404:** token 不存在或夥伴 inactive。

---

### 3.2 Admin API

全部需 Admin 認證（`requireAdmin`）。

#### `GET /api/admin/referrals`

夥伴列表。

#### `POST /api/admin/referrals`

建立新夥伴。

**Body:**
```json
{
  "name": "陳小B",
  "phone": "85291234567"
}
```

**Response 201:**
```json
{
  "data": {
    "id": 1,
    "name": "陳小B",
    "phone": "85291234567",
    "referral_code": "R-ABC123",
    "token": "abc123...",
    "status": "active",
    "referral_link": "https://stay-islands-hk.pages.dev/?ref=R-ABC123",
    "dashboard_link": "https://stay-islands-hk.pages.dev/ref/d/abc123...",
    "whatsapp_deeplink": "https://wa.me/85262322466?text=HKMaldivers%20R-ABC123",
    "qr_code_url": "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=..."
  }
}
```

#### `PATCH /api/admin/referrals/:id/status`

啟用 / 停用夥伴。

**Body:**
```json
{ "status": "inactive" }
```

#### `POST /api/admin/referrals/:id/resend`

重新發送歡迎訊息到夥伴 WhatsApp（若 `phone` 存在）。

#### `GET /api/admin/referral-orders`

佣金紀錄列表，支援 query params：`referrer_id`, `status`, `limit`, `offset`。

#### `PATCH /api/admin/referral-orders/:id/status`

更新佣金狀態。

**Body:**
```json
{ "status": "approved" }
```

#### `GET /api/admin/referral-settings`

讀取佣金規則。

#### `PUT /api/admin/referral-settings`

更新佣金規則。

**Body:**
```json
{
  "mode": "percentage",
  "percentage": 5,
  "fixed_amount": 0,
  "currency": "HKD"
}
```

---

## 4. 流程詳細設計

### 4.1 Admin 建立夥伴並產生 QR Code

```ts
function generateReferralCode() {
  return 'R-' + crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()
}

function generateDashboardToken() {
  return crypto.randomUUID().replace(/-/g, '')
}
```

QR Code URL：
```
https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={encodeURIComponent(whatsapp_deeplink)}
```

### 4.2 WhatsApp 自動回覆

修改 `worker/src/routes/webhooks.ts` 的 `/cloudwapi/incoming`：

```ts
const REFERRAL_KEYWORD = 'HKMaldivers'
const REFERRAL_CODE_REGEX = /R-[A-Z0-9]{6}/i

if (message.includes(REFERRAL_KEYWORD)) {
  const match = message.match(REFERRAL_CODE_REGEX)
  if (match) {
    const referrer = await findReferrerByCode(match[0])
    if (referrer && referrer.status === 'active') {
      await sendCloudwapiMessage(env, {
        phone: from,
        message: buildWelcomeMessage(referrer),
      })
    } else {
      await sendCloudwapiMessage(env, {
        phone: from,
        message: '感謝你的查詢！分享夥伴計劃為邀請制，請聯繫我們了解詳情。',
      })
    }
  }
}
```

> 自動回覆不影響原有 webhook 的儲存邏輯，訊息仍會存入 `whatsapp_messages`。

### 4.3 前台追蹤

新增 `src/lib/referral.ts`：

```ts
const STORAGE_KEY = 'hkm_referral_code'

export function captureRefCode() {
  const ref = new URL(window.location.href).searchParams.get('ref')
  if (ref) {
    localStorage.setItem(STORAGE_KEY, ref)
  }
}

export function getRefCode() {
  return localStorage.getItem(STORAGE_KEY)
}

export function clearRefCode() {
  localStorage.removeItem(STORAGE_KEY)
}
```

在以下頁面 `useEffect` 中呼叫 `captureRefCode()`：
- `HomePage`
- `PropertyDetailPage`
- `ExperiencesPage`
- `PlanPage`

### 4.4 預約帶入 referral_code

`PropertyDetailPage` 提交預約時：

```ts
body: JSON.stringify({
  ...,
  referral_code: getRefCode(),
})
```

`worker/src/routes/public.ts` 的 `POST /bookings`：

```ts
const referralCode = typeof body.referral_code === 'string'
  ? body.referral_code.trim().toUpperCase()
  : null
```

寫入 `bookings.referral_code`。

### 4.5 發佣觸發

在「標記訂單為 paid」的流程中（例如 `PATCH /api/admin/bookings/:id/mark-paid`）：

1. 更新 `bookings.payment_status = 'paid'` 與 `paid_at`。
2. 若 `bookings.referral_code` 存在：
   - 查 `referrers` 表。
   - 若找到 active referrer：
     - 讀取 `referral_settings.rules`。
     - 計算 `commission_amount`。
     - 寫入 `referral_orders`（status = `pending`）。
     - 更新 `referrers.total_referrals` 與 `referrers.total_commission`。
     - 發送 WhatsApp 喜報。

佣金計算邏輯：

```ts
function calculateCommission(amount: number, rules: ReferralRules) {
  if (rules.mode === 'fixed') {
    return rules.fixed_amount
  }
  return Math.round(amount * rules.percentage / 100)
}
```

金額單位：資料庫以「分」儲存，計算時注意整數處理。

### 4.6 佣金狀態流

```
pending → approved → paid
   ↑        ↑
 建立      Admin 核准
           Admin 標記付款
```

- `pending`: 訂單已 paid，等待 Admin 核准。
- `approved`: Admin 已核准，待實際付款。
- `paid`: Admin 已實際發放佣金。
- `cancelled`: 訂單取消時連動取消佣金（可選，首期可手動處理）。

---

## 5. 與現有系統整合點

| 現有模組 | 整合方式 |
|---|---|
| `bookings` | 新增 `referral_code` 欄位 |
| `payments` / mark-paid | 觸發佣金計算 |
| `customers` | 不直接關聯；夥伴獨立 `referrers` 表 |
| `whatsapp_messages` / CloudWAPI | 複用 incoming webhook 與發送函數 |
| `AdminPage.tsx` | 新增「分享夥伴」tab |
| `audit_logs` | Admin 異動寫入稽核 |

---

## 6. 安全設計

| 項目 | 措施 |
|---|---|
| Dashboard 訪問 | 僅靠 32 字元隨機 token，不洩露則無法猜測 |
| Admin API | 沿用 `requireAdmin` middleware |
| WhatsApp 回覆 | 僅回覆給已建立且 `active` 的 referrer |
| 佣金計算 | 只在 `paid` 時觸發，避免詢問階段誤發 |
| 未知 code | 不回覆任何敏感連結，僅提示邀請制 |

---

## 7. 部署與環境變數

現有 `wrangler.toml` 已包含：
- `CLOUDWAPI_API_KEY`
- `CLOUDWAPI_SENDER`

需要確認：
- `CLOUDWAPI_SENDER` 是否為 `85262322466`？若是，可直接使用；若否，新增 `BUSINESS_WHATSAPP_NUMBER = "85262322466"`。

Migration:
- `worker/migrations/0011_add_referral_tables.sql`

---

## 8. 目錄與檔案規劃

```
worker/
  src/
    routes/
      referral.ts          # Admin + Public Referral API
      webhooks.ts          # 修改 /cloudwapi/incoming 加入關鍵字回覆
    lib/
      referral.ts          # 佣金計算、歡迎訊息產生
  migrations/
    0011_add_referral_tables.sql

src/
  lib/
    referral.ts            # captureRefCode / getRefCode helper
  pages/
    PropertyDetailPage.tsx # 預約帶 referral_code
    AdminPage.tsx          # 新增「分享夥伴」tab
    ReferralDashboardPage.tsx # 公開 Dashboard /ref/d/:token

docs/
  PRD_Referral_Module.md
  SAD_Referral_Module.md
```

---

## 9. 風險與注意事項

| 風險 | 應對 |
|---|---|
| CloudWAPI 回覆延遲或失敗 | 記錄 log，不阻塞 webhook 回應 |
| 夥伴 code 被猜測 | code 為 6 位英數組合，且 Dashboard 靠獨立 token |
| 佣金規則後續調整 | 規則以 JSON 儲存，調整不需改 schema |
| 訂單取消 | 初期由 Admin 手動取消對應 `referral_orders`；未來可自動連動 |

---

## 10. 附錄：訊息範本

### 夥伴註冊成功回覆
```
歡迎成為 HK Maldivers 分享夥伴！

你的專屬連結：
https://stay-islands-hk.pages.dev/?ref=R-ABC123

朋友透過此連結預約並付款後，你即可獲得回饋。

隨時查看業績：
https://stay-islands-hk.pages.dev/ref/d/xxxxxxxxxxxxxxxx
```

### 成交喜報
```
🎉 喜報！你推薦的客人已完成付款。

訂單編號：#{booking.token}
訂單金額：HK$10,000
預計回饋：HK$500

查看業績：
https://stay-islands-hk.pages.dev/ref/d/xxxxxxxxxxxxxxxx
```
