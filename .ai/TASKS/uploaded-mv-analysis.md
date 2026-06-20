# Stay Islands HK — `uploaded_mv` 前後端分析報告

> 分析目標：`E:\Projects\MV\uploaded_mv` 中的較完整版本（前端 AdminPage / MemberPage / DashboardPage，以及 EdgeSpark 後端）。
> 分析日期：2026-06-20
> 限制：未修改任何原始碼，僅閱讀並整理。

---

## 1. 前端管理頁面功能摘要

### 1.1 AdminPage.tsx（後台管理頁面）

`AdminPage` 是獨立的後台管理入口，採用頁籤（Tabs）布局，根據登入者的 `adminRole` 動態顯示功能：

| 頁籤 | 功能說明 | 權限 |
|------|----------|------|
| **訂單管理** (`bookings`) | 列出所有訂單，可「確認」（狀態改為 `confirmed` + `paid`）或「拒絕」（狀態改為 `cancelled` + `refunded`） | 管理員 / 超級管理員 |
| **旅客諮詢** (`inquiries`) | 查看旅客提交的諮詢訊息，對新訊息輸入回覆，狀態改為 `replied` | 管理員 / 超級管理員 |
| **房型庫存** (`properties`) | 僅靜態展示 3 個物業、5 種房型與庫存/價格，**目前沒有對接編輯 API** | 管理員 / 超級管理員 |
| **帳戶管理** (`accounts`) | 新增/刪除管理員、修改管理員角色（`admin` / `superadmin`） | 僅超級管理員 |

顯示狀態包含：`pending`（待處理）、`confirmed`（已確認）、`cancelled`（已取消）、`completed`（已完成）。

### 1.2 MemberPage.tsx（會員中心 + 管理後台二合一）

`MemberPage` 是更完整的會員中心，同時整合管理功能：

**未登入時**
- 顯示會員權益說明與 EdgeSpark 登入/註冊 UI（`client.auth.renderAuthUI`）。
- 登入後呼叫 `/api/admin/check` 判斷是否為管理員，並設定 `isAdmin` / `adminRole`。

**會員功能**
- **個人資料** (`profile`)：顯示姓名、電郵、身份、帳戶 ID，以及預訂筆數、電子憑證數、消費總額統計。
- **我的預訂** (`bookings`)：列出該用戶的所有預訂，待處理時可取消。
- **電子憑證** (`vouchers`)：顯示帶有 `voucherCode` 的預訂憑證卡片。

**管理功能**（僅在 `isAdmin` 為 true 時顯示）
- `admin-bookings`：與 AdminPage 的訂單管理相同。
- `admin-inquiries`：與 AdminPage 的旅客諮詢相同。
- `admin-properties`：與 AdminPage 一樣僅靜態展示房型庫存。
- `admin-accounts`：僅超級管理員可見，與 AdminPage 的帳戶管理相同。

### 1.3 DashboardPage.tsx（簡易會員儀表板）

`DashboardPage` 是輕量版會員頁面，僅供已登入用戶使用：

- 顯示用戶頭像、姓名、電郵。
- 兩個頁籤：「我的預訂」與「電子憑證」。
- 可對 `pending` 狀態的預訂執行取消。

> **觀察**：DashboardPage 與 MemberPage 的會員功能高度重疊，但 DashboardPage 沒有登入 UI，也沒有管理功能。未來遷移時可考慮整併或明確區分用途（例如 Dashboard 僅供快速查看，MemberPage 作為完整中心）。

---

## 2. 前端頁面呼叫的 API Endpoints

### 2.1 AdminPage.tsx

| Method | Endpoint | 用途 |
|--------|----------|------|
| GET | `/api/admin/bookings` | 取得所有訂單 |
| GET | `/api/admin/inquiries` | 取得所有諮詢 |
| GET | `/api/admin/accounts` | 取得管理員帳戶列表 |
| PATCH | `/api/admin/bookings/:id` | 更新訂單狀態與付款狀態 |
| PATCH | `/api/admin/inquiries/:id` | 回覆諮詢並更新狀態 |
| POST | `/api/admin/accounts` | 新增管理員 |
| DELETE | `/api/admin/accounts/:id` | 刪除管理員 |
| PATCH | `/api/admin/accounts/:id` | 更新管理員角色 |

### 2.2 MemberPage.tsx

| Method | Endpoint | 用途 |
|--------|----------|------|
| — | `client.auth.getSession()` | 檢查現有登入 session |
| — | `client.auth.renderAuthUI()` | 渲染登入/註冊 UI |
| GET | `/api/admin/check` | 檢查當前用戶是否為管理員 |
| GET | `/api/bookings` | 取得當前用戶預訂 |
| GET | `/api/admin/bookings` | 管理員：取得所有訂單 |
| GET | `/api/admin/inquiries` | 管理員：取得所有諮詢 |
| GET | `/api/admin/accounts` | 超級管理員：取得管理員列表 |
| PATCH | `/api/bookings/:id/cancel` | 用戶取消自己的預訂 |
| PATCH | `/api/admin/bookings/:id` | 管理員更新訂單狀態 |
| PATCH | `/api/admin/inquiries/:id` | 管理員回覆諮詢 |
| POST | `/api/admin/accounts` | 超級管理員新增管理員 |
| DELETE | `/api/admin/accounts/:id` | 超級管理員刪除管理員 |
| PATCH | `/api/admin/accounts/:id` | 超級管理員更新角色 |

### 2.3 DashboardPage.tsx

| Method | Endpoint | 用途 |
|--------|----------|------|
| GET | `/api/bookings` | 取得當前用戶預訂 |
| PATCH | `/api/bookings/:id/cancel` | 取消待處理預訂 |

---

## 3. 後端 API 摘要

後端位於 `backend/server/src/index.ts`，採用 **Hono** 框架，並透過 EdgeSpark Client 操作資料庫（Drizzle ORM 風格）。

### 3.1 管理員檢查

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/admin/check` | 檢查當前登入用戶是否為管理員，回傳 `{ isAdmin, role }`；若管理員的 `userId` 為 placeholder，會自動更新為真實 userId |

### 3.2 公開路由（Public）

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/public/properties` | 取得所有 `status = 'active'` 的物業，依建立時間降序 |
| GET | `/api/public/properties/:id` | 取得單一物業，並包含其下 `status = 'available'` 的房型 |
| POST | `/api/public/inquiries` | 提交旅客諮詢，必填 `name`、`email`、`subject`、`message` |

### 3.3 需登入路由（Authenticated）

| Method | Endpoint | 說明 |
|--------|----------|------|
| POST | `/api/bookings` | 建立預訂，自動產生 `voucherCode`，預設狀態 `pending` / `unpaid` |
| GET | `/api/bookings` | 取得當前用戶的所有預訂 |
| GET | `/api/bookings/:id` | 取得單一預訂（僅限本人） |
| PATCH | `/api/bookings/:id/cancel` | 用戶取消本人預訂（不可重複取消） |
| POST | `/api/trip-plans` | 建立行程規劃 |
| GET | `/api/trip-plans` | 取得當前用戶的行程規劃 |
| PUT | `/api/trip-plans/:id` | 更新行程規劃（`items` 會 JSON 字串化） |
| DELETE | `/api/trip-plans/:id` | 刪除行程規劃 |
| GET | `/api/profile` | 取得當前用戶基本資料 |

### 3.4 管理員路由（Admin，需 `isAdmin`）

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/admin/bookings` | 取得所有訂單，支援 `page` / `limit` 分頁 |
| PATCH | `/api/admin/bookings/:id` | 更新訂單狀態與付款狀態 |
| GET | `/api/admin/inquiries` | 取得所有諮詢 |
| PATCH | `/api/admin/inquiries/:id` | 回覆諮詢 |
| POST | `/api/admin/properties` | 新增物業（`gallery`、`amenities` 會 JSON 字串化） |
| PUT | `/api/admin/properties/:id` | 更新物業 |
| POST | `/api/admin/room-types` | 新增房型（`amenities` 會 JSON 字串化） |
| PATCH | `/api/admin/room-types/:id` | 更新房型庫存、狀態、每晚價格 |

### 3.5 超級管理員路由（Superadmin only）

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/admin/accounts` | 取得所有管理員帳戶 |
| POST | `/api/admin/accounts` | 以 email 新增管理員（userId 可為 placeholder） |
| PATCH | `/api/admin/accounts/:id` | 更新管理員角色 |
| DELETE | `/api/admin/accounts/:id` | 刪除管理員（不可刪除自己） |

### 3.6 權限設計觀察

- 後端使用 `edgespark.auth.user` 取得當前用戶，並在每個 admin route 上透過 `app.use()` middleware 呼叫 `isAdmin()` 做權限檢查。
- `superadmin` 才能管理其他管理員帳戶。
- 沒有獨立的「登入/註冊」API，身份驗證由 EdgeSpark 內建 auth 處理（`es_system__auth_user` 表）。

---

## 4. 資料庫 Schema 摘要

資料庫來自 `backend/server/src/__generated__/db_raw_schema.sql`，使用 SQLite，由 EdgeSpark 產生與管理。

### 4.1 核心業務表

| 資料表 | 用途 | 關鍵欄位 |
|--------|------|----------|
| **properties** | 度假物業/島嶼 | `name`、`name_zh`、`description`、`location`、`price_per_night`、`max_guests`、`image_url`、`gallery`（JSON）、`amenities`（JSON）、`status`（`active`） |
| **room_types** | 房型 | 關聯 `property_id`、`name`、`name_zh`、`price_per_night`、`max_guests`、`inventory`、`status`（`available`） |
| **bookings** | 預訂訂單 | 關聯 `user_id`、`property_id`、`room_type_id`、`check_in`、`check_out`、`guests`、`total_price`、`currency`、`status`、`payment_status`、`payment_method`、`voucher_code` |
| **inquiries** | 旅客諮詢 | `user_id`（可為 null）、`name`、`email`、`phone`、`subject`、`message`、`status`（`new` / `replied`）、`admin_reply` |
| **trip_plans** | 行程規劃 | `user_id`、`name`、`destination`、`start_date`、`end_date`、`items`（JSON）、`notes`、`status` |

### 4.2 權限與身份表

| 資料表 | 用途 | 關鍵欄位 |
|--------|------|----------|
| **admins** | 管理員名單 | `user_id`、`email`（UNIQUE）、`role`（`admin` / `superadmin`） |
| **es_system__auth_user** | EdgeSpark 內建用戶表 | `id`、`name`、`email`、`email_verified`、`image`、`created_at`、`updated_at`、`is_anonymous`、`banned` 等 |

### 4.3 索引

- `admins_email_idx`、`admins_user_id_idx`：管理員查詢加速。
- `idx_bookings_property`、`idx_bookings_status`、`idx_bookings_user`：訂單查詢加速。
- `idx_inquiries_status`、`idx_inquiries_user`：諮詢查詢加速。
- `idx_properties_status`、`idx_room_types_property`、`idx_room_types_status`：物業與房型列表加速。
- `idx_trip_plans_user`：行程規劃查詢加速。

---

## 5. 對 Stay Islands HK 後端遷移的啟示

### 5.1 可以直接借鑑的功能與設計

1. **資料模型相對完整**
   - `properties` + `room_types` 的分層設計適合「物業-房型」業務，可直接沿用。
   - `bookings` 表的欄位涵蓋狀態、付款、憑證、特殊需求，已具備基本訂單管理所需。
   - `inquiries` 諮詢表結構簡潔，包含 `admin_reply` 與 `status`，適合小團隊營運。

2. **權限模型簡單實用**
   - `admins` 表僅記錄 `user_id`、`email`、`role`，配合 EdgeSpark auth 即可運作。
   - `superadmin` / `admin` 兩層權限足以支撐初期營運需求。

3. **API 設計風格統一**
   - 回應格式多為 `{ data: ... }` 或 `{ data: ..., total, page, limit }`（分頁），遷移時可保持一致。
   - RESTful 路徑清晰：`/api/public/*`、`/api/bookings/*`、`/api/admin/*`。

4. **可複用的前端頁面邏輯**
   - AdminPage / MemberPage 的訂單確認/拒絕、諮詢回覆、管理員帳戶管理邏輯成熟，可整段參考。
   - 電子憑證（voucher）UI 與產生邏輯（`SI-` 前綴 + timestamp + random）可直接沿用。

5. **EdgeSpark 整合經驗**
   - `edgespark.auth.user`、`edgespark.db` 的使用方式、generated types / schema 的引入路徑，對新後端有參考價值。
   - placeholder userId 的處理機制（先以 email 建立 admin，登入後更新 userId）可借鏡。

### 5.2 需要重新設計或強化的部分

1. **房型庫存管理尚未真正對接 API**
   - AdminPage 與 MemberPage 的「房型庫存」頁籤目前都是**硬編碼靜態資料**（3 物業 5 房型）。
   - 雖然後端已有 `POST /api/admin/properties`、`PUT /api/admin/properties/:id`、`POST /api/admin/room-types`、`PATCH /api/admin/room-types/:id`，但前端完全沒有呼叫。
   - **遷移時需要**：補上完整的 CRUD UI，並實作庫存扣除/釋放邏輯（目前 `bookings` 建立時不檢查房量）。

2. **訂單建立缺少庫存與價格驗證**
   - `POST /api/bookings` 直接使用前端傳入的 `totalPrice`，沒有根據 `roomTypeId`、`checkIn/checkOut` 重新計算價格。
   - 也沒有檢查所選日期是否已有足夠庫存。
   - **遷移時需要**：後端必須驗證價格與房量，避免前端竄改。

3. **沒有真正的支付整合**
   - 目前僅有 `paymentStatus` 欄位與 `paymentMethod` 記錄，確認訂單時直接標記為 `paid`。
   - **遷移時需要**：若需真實收款，必須整合 Stripe、PayPal 或其他金流閘道，並以 webhook 更新付款狀態。

4. **分頁與搜尋能力不足**
   - 只有 `/api/admin/bookings` 有分頁，其他列表（如諮詢、用戶預訂）都無分頁。
   - 沒有搜尋、篩選、排序功能。
   - **遷移時需要**：隨著資料量增加，必須補上分頁與篩選（例如按日期、狀態、email）。

5. **管理員權限 middleware 重複且可優化**
   - 目前為每個 admin route 單獨註冊 `app.use()`，程式碼重複。
   - **遷移時建議**：改為一個統一的 admin middleware（例如 `app.use('/api/admin/*', ...)`），再針對 accounts 路徑加 superadmin 檢查。

6. **trip_plans 功能在前端未被引用**
   - 後端已實作行程規劃 CRUD，但 AdminPage / MemberPage / DashboardPage 都沒有使用。
   - **遷移時需要**：決定是否保留此功能，若保留則需補上對應 UI。

7. **資料庫欄位與型別細節**
   - `bookings.total_price` 與 `properties.price_per_night` 皆為 `INTEGER`，適合以「分」為單位儲存；遷移時需確認前端顯示與後端儲存的單位一致。
   - JSON 欄位（`gallery`、`amenities`、`items`）目前以字串儲存，使用時需序列化/反序列化，遷移時可考慮是否改用 JSON 原生型別（若資料庫支援）。

8. **用戶資料擴充性**
   - 目前僅記錄 `name` / `email`，沒有電話、地址、會員等級等欄位。
   - **遷移時需要**：根據業務需求擴充 `users` / `profiles` 表，或考慮使用 EdgeSpark auth 的 metadata 機制。

---

## 6. 結論

`uploaded_mv` 已具備 Stay Islands HK 的核心前後端骨架：

- 前端有清晰的會員中心與管理後台頁面。
- 後端有完整的物業、房型、預訂、諮詢、管理員、行程規劃 API。
- 資料庫 schema 簡潔且關聯合理。

對於後端遷移，**最大的可借鑑資產是資料模型與 API 路徑設計**；**最需要補強的是庫存/價格驗證、支付整合、以及房型庫存管理的完整前端 UI**。若能在這些環節補強，此版本已能支撐一個小型的度假租賃平台營運。

---

*報告建立位置：`E:\Projects\MV\extracted\.ai\TASKS\uploaded-mv-analysis.md`*
