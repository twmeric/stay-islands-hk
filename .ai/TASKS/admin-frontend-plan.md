# Stay Islands HK — 前端管理界面規劃（Admin Frontend Plan）

> 專案路徑：`E:\Projects\MV\extracted`  
> 目標：配合後端遷移至 Cloudflare Workers + D1，規劃完整的前端管理界面（`/admin`）與會員中心（`/member`）。  
> 建立日期：2026-06-20

---

## 1. 整體架構

### 建議方案：恢復獨立 `/admin` 頁面

目前 `extracted` 版本的 `/admin`、`/dashboard` 已重定向至 `/member`，`MemberPage` 也已被簡化為「即將開放」的靜態頁面。隨著後端遷移至 Cloudflare Workers + D1，並規劃完整的 Admin API，建議**恢復獨立的 `/admin` 後台頁面**，理由如下：

1. **職責分離**：
   - `/member` 面向客戶/會員，僅供查看「我的預訂」「電子憑證」「個人資料」。
   - `/admin` 面向內部營運人員，處理訂單、諮詢、潛客、CMS、CRM、帳戶管理等高頻營運操作。

2. **避免會員中心臃腫**：
   - 原始 `uploaded_mv` 的 `MemberPage.tsx` 同時承載會員功能與管理功能，導致單檔近 740 行、狀態與 UI 混雜。
   - 獨立 `/admin` 後可將管理功能拆分到多個子頁面，提升可維護性與權限控制清晰度。

3. **權限與安全性**：
   - 獨立路由便於統一掛載 `AdminGuard`，未登入一律導向 `/admin/login`。
   - 超級管理員（`superadmin`）與一般管理員（`admin`）的權限區分可在路由層與元件層同步處理。

4. **擴展性**：
   - 未來新增 CMS、WhatsApp Broadcast、CRM 等功能時，`/admin` 有獨立的 Sidebar 與 Layout 可自然擴展，不影響 `/member` 的客戶體驗。

### 架構示意

```
┌─────────────────────────────────────────────────────────┐
│                        Layout                            │
│  ┌─────────────┐  ┌─────────────────────────────────┐   │
│  │  Public Nav │  │         Main Content            │   │
│  └─────────────┘  └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

/public routes        /member              /admin/*
/                     /member/profile      /admin/login
/properties           /member/bookings     /admin/dashboard
/properties/:id       /member/vouchers     /admin/bookings
/invest                                    /admin/inquiries
/guide                                     /admin/leads
                                           /admin/customers
                                           /admin/accounts
                                           /admin/cms/articles
                                           /admin/crm/broadcasts
                                           /admin/crm/templates
                                           /admin/crm/conversations
```

---

## 2. 頁面結構

建議在 `src/pages/admin/` 目錄下集中管理所有後台頁面，並以 React Router 子路由呈現。

| 路由 | 頁面元件 | 用途 | 主要子元件 |
|------|----------|------|------------|
| `/admin/login` | `AdminLoginPage.tsx` | 管理員登入 | 登入表單、錯誤提示、跳轉邏輯 |
| `/admin/dashboard` | `AdminDashboardPage.tsx` | 營運儀表板 | 統計卡片、近期訂單、未回覆諮詢、潛客數 |
| `/admin/bookings` | `AdminBookingsPage.tsx` | 訂單管理 | DataTable、StatusBadge、分頁、篩選 |
| `/admin/inquiries` | `AdminInquiriesPage.tsx` | 旅客諮詢 | 諮詢卡片列表、回覆表單、狀態切換 |
| `/admin/leads` | `AdminLeadsPage.tsx` | 潛客/業主留資 | DataTable、狀態更新、指派下拉 |
| `/admin/customers` | `AdminCustomersPage.tsx` | 客戶列表 | DataTable、搜尋、客戶詳情 |
| `/admin/accounts` | `AdminAccountsPage.tsx` | 管理員帳戶 | 新增表單、角色切換、刪除確認 |
| `/admin/cms/articles` | `AdminArticlesPage.tsx` | CMS 文章列表 | DataTable、新增/編輯 Modal |
| `/admin/cms/articles/:id` | `AdminArticleEditPage.tsx` | 編輯單一文章 | 文章表單、Rich Text / Markdown 編輯器 |
| `/admin/crm/broadcasts` | `AdminBroadcastsPage.tsx` | WhatsApp 群發批次 | DataTable、建立群發表單 |
| `/admin/crm/templates` | `AdminTemplatesPage.tsx` | WhatsApp 模板 | DataTable、模板編輯器 |
| `/admin/crm/conversations` | `AdminConversationsPage.tsx` | WhatsApp 對話 | 對話列表、聊天視窗 |

### 說明

- 所有 `/admin/*` 頁面共用 `AdminLayout`（含 Sidebar、Header、Toast Container）。
- `/admin/login` 不套用 `AdminLayout`，使用簡潔的置中登入卡片。
- 未來若需「房型庫存」管理，可新增 `/admin/properties` 與 `/admin/room-types`。

---

## 3. 路由與權限

### 3.1 JWT 儲存方式

建議採用 **HTTP-only Cookie** 為主，**localStorage** 為輔的混合策略：

| 儲存位置 | 用途 | 優點 | 風險 |
|----------|------|------|------|
| `HttpOnly; Secure; SameSite=Strict` Cookie | 儲存 `refreshToken` / 長期 session | XSS 無法竊取、由瀏覽器自動帶上 | 需後端支援設定、CSRF 需額外防護 |
| `localStorage` | 儲存短期 `accessToken` | 前端可讀取、便於手動帶入 `Authorization` header | XSS 可被竊取 |

#### 建議實作

1. 登入成功後，後端回傳：
   - `accessToken`（短期，例如 15 分鐘）寫入 `localStorage`。
   - `refreshToken`（長期，例如 7 天）寫入 HTTP-only Cookie。
2. 前端每次呼叫 Admin API 時，於 `Authorization: Bearer <accessToken>` header 帶入。
3. `accessToken` 過期時，前端呼叫 `POST /api/admin/auth/refresh`（由 Cookie 自動帶上 refreshToken）換發新的 accessToken。
4. 登出時清除 localStorage 並呼叫 `POST /api/admin/auth/logout` 使後端 Cookie 失效。

> 若 Cloudflare Workers 對 Cookie/refresh 支援較簡陋，第一階段可簡化為：僅用 localStorage 儲存 JWT accessToken（有效期設長，例如 24 小時），並在後續強化。

### 3.2 路由守衛（Route Guard）

建立 `AdminGuard` 元件，掛載於 `/admin/*` 子路由：

```tsx
// src/components/admin/AdminGuard.tsx
export default function AdminGuard() {
  const { adminToken, isChecking } = useAdminAuthStore();
  const location = useLocation();

  if (isChecking) return <FullPageSpinner />;
  if (!adminToken) return <Navigate to="/admin/login" state={{ from: location }} replace />;
  return <Outlet />;
}
```

`App.tsx` 路由配置：

```tsx
<Route path="/admin" element={<AdminGuard />}>
  <Route element={<AdminLayout />}>
    <Route index element={<Navigate to="/admin/dashboard" replace />} />
    <Route path="dashboard" element={<AdminDashboardPage />} />
    <Route path="bookings" element={<AdminBookingsPage />} />
    <Route path="inquiries" element={<AdminInquiriesPage />} />
    <Route path="leads" element={<AdminLeadsPage />} />
    <Route path="customers" element={<AdminCustomersPage />} />
    <Route path="accounts" element={<SuperadminGuard><AdminAccountsPage /></SuperadminGuard>} />
    <Route path="cms/articles" element={<AdminArticlesPage />} />
    <Route path="cms/articles/:id" element={<AdminArticleEditPage />} />
    <Route path="crm/broadcasts" element={<AdminBroadcastsPage />} />
    <Route path="crm/templates" element={<AdminTemplatesPage />} />
    <Route path="crm/conversations" element={<AdminConversationsPage />} />
  </Route>
</Route>
<Route path="/admin/login" element={<AdminLoginPage />} />
```

### 3.3 權限區分

| 角色 | 可訪問頁面 | 說明 |
|------|------------|------|
| `superadmin` | 全部 `/admin/*` | 可新增/刪除管理員、修改角色、存取所有營運資料 |
| `admin` | 除 `/admin/accounts` 外全部 | 可處理訂單、諮詢、潛客、CMS、CRM，但無法管理其他管理員 |

權限檢查應在兩處進行：
1. **前端路由層**：隱藏無權訪問的 Sidebar 項目，直接輸入 URL 時由 `SuperadminGuard` 導向 `/admin/dashboard`。
2. **後端 API 層**：每個 Admin API 都應驗證 JWT 與 role，防止繞過前端。

---

## 4. 共用 UI 元件

為避免每個後台頁面重複實作表格、表單、Modal，建議在 `src/components/admin/` 下建立以下共用元件：

### 4.1 佈局與導航

| 元件 | 路徑 | 用途 |
|------|------|------|
| `AdminLayout` | `src/components/admin/AdminLayout.tsx` | 後台整體佈局：Sidebar + Header + Main Content |
| `AdminSidebar` | `src/components/admin/AdminSidebar.tsx` | 左側導航，根據 role 動態顯示選項 |
| `AdminHeader` | `src/components/admin/AdminHeader.tsx` | 頂部標題、管理員資訊、登出按鈕 |
| `MobileSidebarToggle` | `src/components/admin/MobileSidebarToggle.tsx` | 行動版 Sidebar 開關 |

### 4.2 資料展示

| 元件 | 路徑 | 用途 |
|------|------|------|
| `DataTable` | `src/components/admin/DataTable.tsx` | 通用表格，支援排序、分頁、載入狀態、空狀態 |
| `StatusBadge` | `src/components/admin/StatusBadge.tsx` | 狀態標籤，統一顏色與文案對照 |
| `StatCard` | `src/components/admin/StatCard.tsx` | 儀表板統計卡片 |
| `EmptyState` | `src/components/admin/EmptyState.tsx` | 無資料時的提示畫面 |
| `LoadingSpinner` | `src/components/admin/LoadingSpinner.tsx` | 全頁/區塊載入動畫 |

### 4.3 互動元件

| 元件 | 路徑 | 用途 |
|------|------|------|
| `Modal` | `src/components/admin/Modal.tsx` | 通用彈窗（新增/編輯/確認刪除） |
| `ConfirmDialog` | `src/components/admin/ConfirmDialog.tsx` | 二次確認對話框 |
| `FormField` | `src/components/admin/FormField.tsx` | 統一表單欄位（label + input + error） |
| `SearchInput` | `src/components/admin/SearchInput.tsx` | 搜尋輸入框（含 debounce） |
| `DateRangePicker` | `src/components/admin/DateRangePicker.tsx` | 日期區間篩選 |
| `Pagination` | `src/components/admin/Pagination.tsx` | 分頁控制 |

### 4.4 反饋元件

| 元件 | 路徑 | 用途 |
|------|------|------|
| `Toast` / `ToastProvider` | `src/components/admin/Toast.tsx` | 操作成功/失敗提示 |
| `ErrorAlert` | `src/components/admin/ErrorAlert.tsx` | API 錯誤提示區塊 |

### 4.5 樣式規範

- 沿用專案現有 **Tailwind CSS**。
- 品牌色：
  - 主色：`#0a4c6b`（深藍）
  - 強調色：`#B8902F`（金沙）
  - 輔助色：`#2ec4b6`（ turquoise）
- 後台整體背景：`bg-gray-50`
- 卡片背景：`bg-white rounded-2xl shadow-sm`
- 主要按鈕：`bg-[#0a4c6b] hover:bg-[#083d56] text-white rounded-lg`
- 危險操作：`bg-red-500 hover:bg-red-600 text-white`
- 狀態標籤統一使用圓角膠囊：`rounded-full text-xs font-medium px-2 py-0.5`

---

## 5. 各頁面詳細規格

### 5.1 `/admin/login` — 管理員登入

**顯示欄位**
- 電郵地址（email）
- 密碼（password）
- 「記住我」選項（可選，控制 token 有效期）
- 錯誤提示區塊

**可執行操作**
- 提交登入表單
- 前端基本驗證（email 格式、必填）
- 登入成功後儲存 JWT，導向 `/admin/dashboard`
- 已登入者訪問 `/admin/login` 時自動導向 `/admin/dashboard`

**呼叫 API**
- `POST /api/admin/auth/login`

---

### 5.2 `/admin/dashboard` — 儀表板

**顯示資料欄位**
- 今日新訂單數、待處理訂單數
- 本月營業額（HKD）
- 未回覆諮詢數
- 新潛客數
- 最近 5 筆訂單（編號、客戶、金額、狀態）
- 最近 5 則新諮詢

**可執行操作**
- 點擊統計卡片快速導向對應頁面
- 點擊訂單/諮詢項目進入詳情或列表

**呼叫 API**
- `GET /api/admin/dashboard`
- `GET /api/admin/bookings?limit=5`
- `GET /api/admin/inquiries?limit=5&status=new`

---

### 5.3 `/admin/bookings` — 訂單管理

**顯示資料欄位**
- 預訂編號
- 客戶姓名 / Email
- 物業 / 房型
- 入住日期 / 退房日期
- 人數
- 總金額（HKD）
- 訂單狀態（pending / confirmed / cancelled / completed）
- 付款狀態（unpaid / paid / refunded）
- 建立時間

**可執行操作**
- 分頁瀏覽
- 依狀態、日期區間、客戶 email 篩選
- 更新訂單狀態（下拉選擇）
- 更新付款狀態
- 查看訂單詳情（可展開 row 或開啟 Modal）

**呼叫 API**
- `GET /api/admin/bookings`
- `PATCH /api/admin/bookings/:id`

---

### 5.4 `/admin/inquiries` — 旅客諮詢

**顯示資料欄位**
- 諮詢編號
- 主旨（subject）
- 旅客姓名 / Email / 電話
- 訊息內容（可截斷顯示）
- 狀態（new / replied）
- 管理員回覆內容
- 提交時間

**可執行操作**
- 依狀態篩選（新訊息 / 已回覆 / 全部）
- 對新訊息輸入回覆並發送
- 發送後狀態自動改為 `replied`
- 標記為已讀 / 待處理（可選）

**呼叫 API**
- `GET /api/admin/inquiries`
- `PATCH /api/admin/inquiries/:id`

---

### 5.5 `/admin/leads` — 潛客/業主留資

**顯示資料欄位**
- 編號
- Lead 類型（experience-inquiry / island-owner-talk / inspiration-guide）
- 姓名 / Email / 電話
- 來源頁面
- 狀態（new / contacted / qualified / converted / closed）
- 指派給（assignedTo）
- 建立時間

**可執行操作**
- 依類型、狀態篩選
- 更新狀態
- 指派給特定管理員
- 查看詳細內容（Modal 或展開）

**呼叫 API**
- `GET /api/admin/leads`
- `PATCH /api/admin/leads/:id`

---

### 5.6 `/admin/customers` — 客戶列表

**顯示資料欄位**
- 客戶 ID
- 姓名 / Email / 電話
- 訂單數
- 消費總額
- 最後互動時間
- 備註

**可執行操作**
- 搜尋（姓名 / email / 電話）
- 分頁
- 點擊查看客戶詳情（訂單歷史、諮詢記錄、leads）

**呼叫 API**
- `GET /api/admin/crm/customers`

---

### 5.7 `/admin/accounts` — 管理員帳戶

**顯示資料欄位**
- 管理員 ID
- Email
- 角色（admin / superadmin）
- 建立時間
- 最後登入時間（可選）

**可執行操作**
- 新增管理員（輸入 email、選擇 role）
- 修改現有管理員角色
- 刪除管理員（二次確認，不可刪除自己）

**權限**
- 僅 `superadmin` 可訪問

**呼叫 API**
- `GET /api/admin/accounts`
- `POST /api/admin/accounts`
- `DELETE /api/admin/accounts/:id`

> 註：原始 `uploaded_mv` 還包含 `PATCH /api/admin/accounts/:id` 更新角色，後端規劃中未列出，但建議保留以維持彈性。

---

### 5.8 `/admin/cms/articles` — CMS 文章列表

**顯示資料欄位**
- 文章 ID
- 標題（中文 / 英文）
- 狀態（draft / published / archived）
- 作者
- 發布時間
- 最後更新時間

**可執行操作**
- 新增文章（開啟 Modal 或導向 `/admin/cms/articles/new`）
- 編輯文章
- 刪除文章（二次確認）
- 依狀態篩選

**呼叫 API**
- `GET /api/admin/cms/articles`
- `POST /api/admin/cms/articles`
- `PUT /api/admin/cms/articles/:id`
- `DELETE /api/admin/cms/articles/:id`

---

### 5.9 `/admin/cms/articles/:id` — 文章編輯

**顯示資料欄位**
- 標題（多語言）
- 摘要
- 內文（建議使用 Markdown 編輯器或輕量 Rich Text）
- 封面圖片 URL
- SEO meta title / description
- 狀態（draft / published / archived）
- 發布時間

**可執行操作**
- 儲存草稿
- 發布 / 下架
- 預覽

**呼叫 API**
- `GET /api/admin/cms/articles/:id`
- `PUT /api/admin/cms/articles/:id`

---

### 5.10 `/admin/crm/broadcasts` — WhatsApp 群發批次

**顯示資料欄位**
- 批次 ID
- 名稱 / 主題
- 模板名稱
- 目標客群數量
- 狀態（draft / scheduled / sending / sent / failed）
- 預計發送 / 實際發送時間
- 成功 / 失敗數

**可執行操作**
- 建立新群發（選擇模板、對象、預約時間）
- 取消預約群發
- 查看發送報告

**呼叫 API**
- `GET /api/admin/crm/broadcasts`
- `POST /api/admin/crm/broadcasts`

---

### 5.11 `/admin/crm/templates` — WhatsApp 模板

**顯示資料欄位**
- 模板 ID
- 模板名稱
- 語言
- 類別（MARKETING / UTILITY / AUTHENTICATION）
- 狀態（pending / approved / rejected）
- 建立時間

**可執行操作**
- 新增模板
- 編輯模板（僅限 pending / rejected）
- 提交審核
- 刪除模板

**呼叫 API**
- `GET /api/admin/crm/templates`
- `POST /api/admin/crm/templates`

---

### 5.12 `/admin/crm/conversations` — WhatsApp 對話

**顯示資料欄位**
- 對話 ID
- 客戶姓名 / 電話
- 最後訊息預覽
- 未讀數
- 最後互動時間
- 狀態（open / closed / pending）

**可執行操作**
- 搜尋對話
- 點擊進入單一對話
- 標記為已關閉 / 重新開啟

**呼叫 API**
- `GET /api/admin/crm/conversations`

---

## 6. 會員中心 `/member`

### 6.1 設計原則

- `/member` 僅保留客戶端功能，不再承載管理後台。
- 認證方式優先採用「輕量登入」：用戶下單後即成為客戶，無需強制傳統註冊。
- 登入方式可選：
  - **Email + OTP**：輸入訂單 email，後端發送 OTP，驗證後即可查看該 email 相關預訂。
  - **Booking Reference + Email**：輸入預訂編號與 email 查詢單一預訂。
  - **JWT 密碼登入**（可選進階）：提供傳統密碼登入，適合高頻會員。

### 6.2 子頁面規劃

| 路由 | 頁面元件 | 用途 |
|------|----------|------|
| `/member` | `MemberPage.tsx` | 會員中心首頁，顯示個人資料與快速統計 |
| `/member/bookings` | `MemberBookingsPage.tsx` | 我的預訂列表 |
| `/member/vouchers` | `MemberVouchersPage.tsx` | 電子憑證列表 |
| `/member/profile` | `MemberProfilePage.tsx` | 個人資料編輯 |

### 6.3 顯示內容

**個人資料**
- 姓名、Email、電話
- 帳戶 ID
- 統計：預訂筆數、電子憑證數、消費總額

**我的預訂**
- 預訂編號、物業/房型、入住/退房日期、人數、金額、狀態、付款狀態
- `pending` 狀態可取消預訂

**電子憑證**
- 憑證編號、對應預訂、入住/退房日期、金額
- 可下載/分享憑證（未來可擴充 PDF 產生）

### 6.4 呼叫 API

- `GET /api/bookings` — 取得當前用戶預訂
- `PATCH /api/bookings/:id/cancel` — 取消預訂
- `GET /api/profile` — 取得個人資料
- `PUT /api/profile` — 更新個人資料

---

## 7. 參考原始版本

### 7.1 `uploaded_mv` 的 `AdminPage.tsx`

**可借鑑之處**
- 頁籤式管理界面已驗證可用，「訂單管理」「旅客諮詢」「帳戶管理」的資料結構與操作流程成熟。
- 訂單狀態更新邏輯（pending → confirmed/cancelled）可直接複用。
- 諮詢回覆的卡片式 UI 與狀態切換設計直觀。
- 管理員帳戶的新增/刪除/角色修改表單完整。
- 狀態顏色對照（`statusColors`）與 Tailwind 樣式可沿用。

**需要重新設計之處**
- 目前所有功能擠在單一頁面（Tabs），未來應拆分為獨立子路由與頁面元件。
- 「房型庫存」頁籤目前為硬編碼靜態資料，未對接 API，需補完整 CRUD。
- 缺少 Dashboard、Leads、Customers、CMS、CRM 等新版功能。
- 缺少統一的權限守衛與 JWT 登入流程。

### 7.2 `uploaded_mv` 的 `MemberPage.tsx`

**可借鑑之處**
- 未登入時的會員權益說明與登入 UI 布局可參考。
- 登入後的 Sidebar 會員/管理功能分區設計清晰。
- 個人資料、我的預訂、電子憑證的資料呈現完整。
- 電子憑證的漸層卡片視覺效果可沿用。
- 統計卡片（預訂筆數、憑證數、消費總額）實用。

**需要重新設計之處**
- 會員功能與管理功能不應再混合於同一頁面。
- EdgeSpark 的 `client.auth.renderAuthUI` 將被替換為自訂 JWT 登入或 Email + OTP。
- `/api/admin/check` 將由新的 `/api/admin/me` 取代。
- 管理功能應遷移至獨立 `/admin` 路由。

### 7.3 `uploaded_mv` 的 `DashboardPage.tsx`

**可借鑑之處**
- 輕量會員儀表板的概念（預訂 + 憑證兩個頁籤）可保留。
- 預訂卡片與憑證卡片的 UI 可直接複用到 `/member/bookings` 與 `/member/vouchers`。

**需要重新設計之處**
- DashboardPage 與 MemberPage 功能高度重疊，遷移後建議由 `/member` 統一承載會員功能，`/dashboard` 持續 redirect 至 `/member`。
- 沒有登入 UI，未來 `/member` 需補上輕量登入流程。

---

## 8. 實施順序建議

建議採用 **階段式開發**，優先完成營運最核心、資料最即時的功能，再逐步擴充 CMS 與 CRM。

### Phase 1 — Admin 登入 + Layout + Dashboard

- [ ] 建立 `AdminLoginPage` 與 JWT 儲存機制
- [ ] 建立 `AdminLayout`、`AdminSidebar`、`AdminHeader`
- [ ] 建立 `AdminGuard` 與 `SuperadminGuard`
- [ ] 建立 `AdminDashboardPage`（串接 `/api/admin/dashboard`）
- [ ] 建立共用元件：`LoadingSpinner`、`StatCard`、`ErrorAlert`、`ToastProvider`

### Phase 2 — Orders + Inquiries

- [ ] 建立 `AdminBookingsPage`（串接 `/api/admin/bookings`）
- [ ] 建立 `DataTable`、`StatusBadge`、`Pagination`、`SearchInput`
- [ ] 實作訂單狀態與付款狀態更新
- [ ] 建立 `AdminInquiriesPage`（串接 `/api/admin/inquiries`）
- [ ] 實作諮詢回覆功能

### Phase 3 — Leads + Customers

- [ ] 建立 `AdminLeadsPage`（串接 `/api/admin/leads`）
- [ ] 實作狀態更新與指派功能
- [ ] 建立 `AdminCustomersPage`（串接 `/api/admin/crm/customers`）
- [ ] 實作客戶搜尋與詳情查看

### Phase 4 — Accounts + CMS Articles

- [ ] 建立 `AdminAccountsPage`（串接 `/api/admin/accounts`）
- [ ] 實作新增/刪除/修改角色（限 superadmin）
- [ ] 建立 `AdminArticlesPage` 與 `AdminArticleEditPage`
- [ ] 整合 Markdown 編輯器

### Phase 5 — WhatsApp Broadcast + Templates + Conversations

- [ ] 建立 `AdminBroadcastsPage`（串接 `/api/admin/crm/broadcasts`）
- [ ] 建立 `AdminTemplatesPage`（串接 `/api/admin/crm/templates`）
- [ ] 建立 `AdminConversationsPage`（串接 `/api/admin/crm/conversations`）

### Phase 6 — 會員中心 `/member` 強化

- [ ] 設計輕量登入（Email + OTP / Booking Reference）
- [ ] 重建 `/member` 為包含 Sidebar 的會員中心
- [ ] 建立 `/member/bookings`、`/member/vouchers`、`/member/profile`
- [ ] 移除 `/admin`、`/dashboard` 重定向至 `/member` 的設定，改為獨立後台路由

### Phase 7 — 收尾與優化

- [ ] 統一錯誤處理與 Toast 反饋
- [ ] 加入單元測試（Vitest + React Testing Library）
- [ ] 優化行動版 Sidebar 與表格體驗
- [ ] 文件更新：API 對照表、權限矩陣、部署說明

---

## 9. 附錄：前端 API 對照表

| 頁面 | Method | Endpoint |
|------|--------|----------|
| 登入 | POST | `/api/admin/auth/login` |
| 當前管理員 | GET | `/api/admin/me` |
| 儀表板 | GET | `/api/admin/dashboard` |
| 訂單列表 | GET | `/api/admin/bookings` |
| 更新訂單 | PATCH | `/api/admin/bookings/:id` |
| 諮詢列表 | GET | `/api/admin/inquiries` |
| 回覆諮詢 | PATCH | `/api/admin/inquiries/:id` |
| 潛客列表 | GET | `/api/admin/leads` |
| 更新潛客 | PATCH | `/api/admin/leads/:id` |
| 客戶列表 | GET | `/api/admin/crm/customers` |
| 管理員列表 | GET | `/api/admin/accounts` |
| 新增管理員 | POST | `/api/admin/accounts` |
| 刪除管理員 | DELETE | `/api/admin/accounts/:id` |
| 文章列表 | GET | `/api/admin/cms/articles` |
| 新增文章 | POST | `/api/admin/cms/articles` |
| 更新文章 | PUT | `/api/admin/cms/articles/:id` |
| 刪除文章 | DELETE | `/api/admin/cms/articles/:id` |
| 群發列表 | GET | `/api/admin/crm/broadcasts` |
| 建立群發 | POST | `/api/admin/crm/broadcasts` |
| 模板列表 | GET | `/api/admin/crm/templates` |
| 新增模板 | POST | `/api/admin/crm/templates` |
| 對話列表 | GET | `/api/admin/crm/conversations` |

---

*文件位置：`E:\Projects\MV\extracted\.ai\TASKS\admin-frontend-plan.md`*
