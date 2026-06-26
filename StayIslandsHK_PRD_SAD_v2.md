



STAY ISLANDS HK
香港高端馬爾代夫度假與物業投資平台
產品需求文件（PRD）暨系統分析及設計文件（SA&D） v2.0

Version: v2.0 | Date: 2026 年 6 月 | Confidential
「Stay. Feel. Own. Earn — 先住進島嶼，再擁有島嶼」

# v2.0 主要變更摘要
本文件標誌 Stay Islands HK 由單純的高端馬爾代夫住宿預訂平台，升級為「體驗驅動的物業銷售漏斗」。Booking 不再是終點，而是讓高淨值客戶（HNWI）在真實入住過程中體驗、愛上並最終擁有物業單位的「示範單位」與種子工具。
## v1.0 與 v2.0 對比
透過這次轉型，平台不僅提升每筆交易的終身價值（LTV），更在客戶生命週期早期建立信任與情感連結，降低海外物業銷售常見的冷啟動阻力。

# PART A — 產品需求文件（PRD）
## A1. 目的與範圍
本文檔定義 Stay Islands HK v2.0 的產品願景、功能需求、非功能需求、用戶旅程及設計方向，涵蓋前端消費者體驗、後台管理系統及投資物業銷售漏斗所需的業務流程與合規要求。
對象：產品經理、UX/UI 設計師、開發團隊、法務與合規顧問、投資關係經理（IRM）。
範圍：網站（桌面及流動裝置）、會員系統、預訂與支付、投資諮詢、後台 CRM、內容管理。
不包含：馬爾代夫當地物業開發商的建造管理、機票預訂自營、虛擬貨幣支付。

## A2. 執行摘要：四大升級維度
v2.0 並非功能堆砌，而是圍繞四大維度的系統性升級：

## A3. 市場機遇與商業模式重塑

### A3.1 戰略揭示：體驗驅動的物業銷售漏斗
對於高淨值人士而言，海外物業投資最大的摩擦並非資金，而是「距離感」與「不確定性」。Stay Islands HK 以真實入住作為信任起點，讓客戶在享受假期的同時，親身驗證物業質素、管理服務及租賃潛力，最終順理成章地進入物業所有權（全權或分權）諮詢。

### A3.2 新漏斗：Stay → Feel → Desire → Own → Earn

### A3.3 三層收入模型
v2.0 的收入來源由單層擴展至三層，形成相互強化的飛輪：

### A3.4 市場機遇摘要
香港高淨值人士對海外避險資產及度假物業需求持續增加。
馬爾代夫政治相對穩定、旅遊需求旺盛、租賃回報具吸引力。
傳統海外物業代理缺乏「先住後買」的信任橋樑，存在體驗缺口。
透過數碼化漏斗，可追蹤從住宿到投資的完整轉化路徑，提升銷售效率。

## A4. 目標客群與用戶角色
平台需同時服務「度假消費者」與「投資者」兩種身份，並理解同一人可能在旅程中由前者轉化為後者。

## A5. 產品定位與差異化
品牌承諾：「由香港出發，先住進島嶼，再擁有島嶼。」
### 差異化比較

## A6. 資訊架構與網站地圖
首頁（/）—— 雙 CTA：「預訂假期」與「探索物業投資」
度假村與房間（/resorts, /resorts/{slug}, /room-types/{slug}）
投資專區（/invest）—— 投資理念、流程、常見問題
投資試算機（/invest/calculator）
業主專區（/owner）—— 收益、預訂、文件、IRM 對話
禮賓服務（/concierge）—— 機場接送、餐飲、島嶼活動、物業導賞
會員中心（/member）—— 個人檔案、投資檔案、我的資產、收藏單位
行程規劃（/trip-planner）—— 資產願景清單、收藏、分享
內容與教育（/journal, /invest/education）
後台管理（/admin）—— 訂單、庫存、CRM、內容、合規審批

## A7. 用戶角色與權限矩陣
v2.0 新增與投資、物業所有權相關的角色，並以旅程階段標籤輔助 CRM。
旅程階段標籤（Journey Stage Tags）會在 CRM 中動態標示：Leisure、Feeling、Desiring、Consulting、Owner、Advocate。

## A8. 功能需求（MoSCoW 優先級）
### A8.1 首頁（雙 CTA）
### A8.2 度假村與房間類型（雙重身份）
### A8.3 預訂與付款
### A8.4 會員區域
### A8.5 行程規劃（Trip Planner）
### A8.6 物業投資模組（新增）
### A8.7 後台管理
### A8.8 旅遊指南 / 投資教育軌跡

## A9. 非功能需求

## A10. 高端體驗設計方向
設計系統：採用海洋藍、沙白、金屬灰為主色，留白充足，字體統一使用 Microsoft JhengHei。
動態敘事：以高質影片、視差滾動、360° 房間預覽帶出「島嶼生活」氛圍。
微互動：價格試算即時反饋、收藏動畫、諮詢進度條。
文案語調：禮賓式、知識型，避免硬銷，例如「讓我們為你安排一次難忘的島嶼體驗」。
儀式化服務接觸點：入住期間安排物業導賞、退房後發送投資諮詢邀請與專屬報告。

## A11. 關鍵績效指標與北極星指標
北極星指標：體驗至投資諮詢轉化率（Experience-to-Investment-Consultation Conversion Rate）

## A12. 風險登記冊

## A13. 發布計劃

# PART B — 系統分析及設計（SA&D）
## B1. 現有代碼庫技術評估
由於本項目在現有工作目錄中未包含歷史源代碼，以下評估基於官方合作網站 stayislands.mv 的公開觀察、同類型平台常見架構及客戶提供的 v1.0 描述。最終結論須待技術團隊進行實際代碼審計後確認。
建議策略：保留並封裝現有預訂核心，逐步以新模組擴充，優先實現投資漏斗與後台 CRM。

## B2. 目標系統架構（漸進式升級策略）
展示層（Presentation）：Next.js / React 網站、PWA、未來可擴展至原生 APP。
API 閘道層：REST / GraphQL API，統一認證（OAuth2 / JWT）、速率限制、日誌。
業務服務層：用戶服務、預訂服務、庫存服務、投資服務、業主服務、通知服務、CMS 服務。
資料層：PostgreSQL（主要交易資料）、Redis（快取與庫存鎖）、對象儲存（媒體檔案）。
整合層：Stripe / PayPal、電郵 / SMS / WhatsApp、CRM（HubSpot / Salesforce）、會計系統。
監控與安全：Datadog / Sentry、WAF、滲透測試、定期備份。

## B3. 情境圖（Context Diagram）
系統與以下外部實體互動：訪客 / 會員 / 準業主 / 業主、IRM / 銷售團隊、後台管理員、支付閘道、銀行 / 託管、電郵與訊息服務、KYC/AML 服務（未來）、會計與報表系統、物業開發商 / 管理公司。
核心平台負責：內容展示、搜尋與預訂、投資諮詢工作流、業主管理、通知、數據分析與合規審計。

## B4. 資料模型設計
以下列出關鍵資料表及其主要欄位。欄位名稱與類型可根據實際技術棧調整。

### B4.1 現有表調整
表：properties
表：room_types
表：bookings
表：inquiries
表：trip_plans
表：admins

### B4.2 新增資料表
表：investment_inquiries
表：investment_calculator_logs
表：saved_units
表：user_investment_profiles
表：ownership_units
表：owner_rental_records
表：owner_bookings
表：lead_scores
表：payment_transactions
表：membership_tiers
表：user_membership
表：coupons
表：trip_plan_items
表：notifications_log
表：cms_articles
表：audit_logs

## B5. 關鍵業務流程設計

### B5.1 預訂流程（含庫存鎖）
用戶選擇房間與日期，前端呼叫庫存 API。
系統在 Redis 建立臨時庫存鎖（如 15 分鐘），防止超賣。
用戶進入結帳頁，確認價格與加購項目。
系統調用支付閘道創建付款意圖。
付款成功後，預訂狀態改為 confirmed，庫存鎖釋放並寫入正式庫存減扣。
若付款逾時或失敗，庫存鎖自動釋放，通知用戶。
系統發送確認電郵與入住指南。

### B5.2 投資興趣觸發與諮詢流程
用戶在房間頁或投資專區使用試算機。
系統記錄試算輸入與結果，並更新潛在客戶評分。
用戶提交投資意向表，須先閱讀並確認風險披露聲明。
後台根據評分與負載自動分配 IRM。
IRM 在合規框架下進行諮詢，記錄互動日誌。
若用戶符合條件並進入成交階段，轉介至持牌代理或法律顧問處理。

### B5.3 業主租賃管理與收益分配流程
平台或管理公司將單位納入租賃池。
業主可於業主後台查看入住日曆與租賃表現。
每月 / 每季度結算總租金收入、管理費及其他開支。
計算每位業主應得淨收益（按擁有份額比例）。
生成業主報表並經審批後執行匯款。
紀錄於 owner_rental_records，並觸發通知。

### B5.4 支付對賬
每日自動比對 payment_transactions 與閘道報表，標記差異。管理員可於後台查看對賬報告並處理退款、手續費調整及託管釋放。

### B5.5 會員等級與通知流程
根據住宿晚數、投資狀態與互動深度計算會員等級，觸發個人化通知。通知渠道包括電郵、SMS、WhatsApp，內容須遵循用戶同意與 PDPO 要求。

## B6. API 概覽

## B7. 支付閘道整合架構
住宿付款：透過 Stripe / PayPal 處理信用卡，支援 3D Secure。
高單價投資訂金：建議採用銀行轉帳或託管帳戶，並由人工對賬。
退款：依據退款政策，經後台審批後透過原閘道退回。
對賬：每日自動拉取閘道結算報表，與 payment_transactions 比對。
安全：PCI DSS 合規由閘端代碼化處理，平台不儲存完整卡號。

## B8. 安全與合規設計

## B9. 庫存並發控制
採用 Redis 分散式鎖處理熱門房間的高並發預訂。鎖定時間設定為 15 分鐘，結帳成功或逾時釋放。資料庫層以事務與樂觀鎖避免雙重扣減。定期執行庫存對賬，修復因異常導致的差異。

## B10. 效能與基建建議
使用 CDN（CloudFront / Cloudflare）加速圖片與影片內容。
資料庫讀寫分離，查詢頻繁的房間與庫存資料使用 Redis 快取。
採用容器化部署（Docker + Kubernetes）或 Serverless 以應對季節性流量。
建立監控儀表板（Grafana）與警報機制（PagerDuty）。
定期進行負載測試，確保預訂高峰（如長假期）系統穩定。

## B11. 測試與 QA 策略

## B12. 開發里程碑與資源估算

## B13. 附錄：差距分析摘要表


# B14. 合規風險特別章節（關鍵）
由於 v2.0 涉及物業投資與被動收入，平台必須在產品設計階段即將香港監管要求納入核心。本章節並非法律意見，僅供內部產品與技術團隊參考，所有最終結構須由香港執業律師確認。

## B14.1 CIS（集體投資計劃）風險 —— 證券及期貨條例（SFO）
根據香港《證券及期貨條例》第 104 條及相關定義，「集體投資計劃」（Collective Investment Scheme, CIS）通常包含四個元素。若平台安排被認定為 CIS，則可能須受證監會（SFC）監管，包括須獲認可或僅向專業投資者發售。
### CIS 四元素

### B14.2 須向香港證券律師釐清的三個關鍵問題
分權擁有（fractional ownership）的具體法律結構是否構成 CIS？若構成，可否以僅限專業投資者（Professional Investor）方式發售？
平台在物業管理與租賃收益分配中所扮演的角色，是否會被視為「營運者」（operator）或「管理公司」？
投資試算機、回報預測及教育內容的呈現方式，會否被認定為《證券及期貨條例》下的「投資建議」或「受規管活動」？

### B14.3 路徑比較：純物業銷售 vs CIS / 專業投資者路徑

## B14.4 地產代理牌照風險 —— 《地產代理條例》
在香港從事「地產代理工作」（包括海外物業）可能須持有地產代理牌照。若平台協助買賣、租賃或推廣海外物業，並從中收取佣金，須評估是否觸發牌照要求。建議方案包括：與持牌地產代理合作、將平台定位為純資訊或轉介平台，或申請相應牌照。

### B14.5 產品設計合規建議
所有投資相關數字（租金回報、升值、管理費）必須標示「僅供參考，並非投資建議」。
試算機輸入與結果須記錄於 investment_calculator_logs，並在用戶提交意向前強制閱讀風險披露。
避免使用保證回報、零風險、穩賺等字眼。
投資意向表單須包含風險承受能力與財務狀況自我聲明。
後台須記錄每位用戶的風險披露確認時間、IP 與版本號。
分權擁有結構須經法律確認，避免落入 CIS 定義或設計為僅限專業投資者產品。

### B14.6 建議合規時間線

### B14.7 風險披露聲明範本（中文，須由律師最終審閱）
本網站所載有關馬爾代夫物業投資、租金回報、升值潛力及管理費用之任何資料、數據、預測或試算結果，僅供參考及教育用途，並不構成任何投資建議、招攬、要約或邀請作出要約購買任何物業或證券。投資海外物業涉及重大風險，包括但不限於市場風險、匯率風險、法律及稅務風險、流動性風險、租賃空置風險及開發商 / 管理公司履約風險。過往表現並不代表未來回報。在作出任何投資決定前，閣下應尋求獨立法律、稅務及財務顧問之意見，並仔細閱讀相關銷售文件。Stay Islands HK 並非持牌地產代理或受規管財務顧問，平台可能僅作為資訊及轉介用途。
本章節的所有條款、文案與流程必須經香港執業律師最終審閱，並根據實際業務結構調整。

# PART C — 內容管理系統（CMS）設計

## C1. CMS 目標與範圍

為了讓營運團隊無需修改前端程式碼即可更新網站內容，本系統在現有 Admin 後台擴充內容管理功能。本次 CMS 建置範圍涵蓋：

- **住宿（Properties）**：基本資料、圖片畫廊（gallery）、設施（facilities）、可體驗活動（activities）、位置與週邊（location_details）、物業故事（story）
- **房型（Room Types）**：擴充床型（bed_type）、景觀（view）、面積（size_sqm）、入住人數（occupancy）、房型圖片（gallery）、房型特色（features）
- **海島體驗（Experiences）**：6 個活動的完整資訊與排序管理
- **主題靜修（Retreats）**：4 個 Retreat 的完整資訊、行程與排序管理

以下內容**不納入**本次 CMS 範圍，保留寫死於前端：首頁 Hero 文案、About 文案、旅客故事、全站靜態文案、Footer 聯絡資訊。

## C2. 資料模型設計

### C2.1 `properties` 表既有 JSON 欄位

| 欄位 | 型別 | 說明 |
|---|---|---|
| `gallery` | TEXT (JSON) | 圖片 URL 陣列 |
| `facilities` | TEXT (JSON) | `{icon, label}` 陣列 |
| `activities` | TEXT (JSON) | `{image, name, description}` 陣列 |
| `location_details` | TEXT (JSON) | `{description, mapImage, nearby}` |
| `story` | TEXT (JSON) | `{title, content}` |

### C2.2 `room_types` 表擴充欄位

| 欄位 | 型別 | 說明 |
|---|---|---|
| `bed_type` | TEXT | 床型，例如 King / Twin / Queen |
| `view` | TEXT | 景觀，例如 Ocean View / Lagoon View |
| `size_sqm` | INTEGER | 房間面積（平方公尺） |
| `occupancy` | TEXT | 入住人數描述 |
| `gallery` | TEXT (JSON) | 房型圖片 URL 陣列 |
| `features` | TEXT (JSON) | 房型特色文字陣列 |

### C2.3 `experiences` 表

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | INTEGER PK | 主鍵 |
| `name` / `name_zh` | TEXT | 英文 / 中文名稱 |
| `slug` | TEXT UNIQUE | URL 用識別碼 |
| `description` / `description_zh` | TEXT | 英文 / 中文描述 |
| `duration` | TEXT | 活動時長 |
| `group_size` | TEXT | 建議人數 |
| `includes` | TEXT (JSON) | 包含項目陣列 |
| `price_note` | TEXT | 價格說明 |
| `image_url` | TEXT | 主圖 URL |
| `icon_name` | TEXT | Lucide icon 名稱 |
| `sort_order` | INTEGER | 排序權重 |
| `status` | TEXT | active / inactive |

### C2.4 `retreats` 表

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | INTEGER PK | 主鍵 |
| `name` / `name_zh` | TEXT | 英文 / 中文名稱 |
| `slug` | TEXT UNIQUE | URL 用識別碼 |
| `description` / `description_zh` | TEXT | 英文 / 中文描述 |
| `duration` | TEXT | 天數 |
| `location` | TEXT | 地點 |
| `audience` | TEXT | 適合對象 |
| `itinerary` | TEXT (JSON) | 每日行程 `{day, title, desc}` 陣列 |
| `price_note` | TEXT | 價格說明 |
| `image_url` | TEXT | 主圖 URL |
| `icon_name` | TEXT | Lucide icon 名稱 |
| `sort_order` | INTEGER | 排序權重 |
| `status` | TEXT | active / inactive |

## C3. API 設計

### C3.1 公開 API（前台讀取）

| 端點 | 說明 |
|---|---|
| `GET /api/public/experiences` | 取得所有 active experiences |
| `GET /api/public/experiences/:slug` | 取得單一 experience |
| `GET /api/public/retreats` | 取得所有 active retreats |
| `GET /api/public/retreats/:slug` | 取得單一 retreat |
| `GET /api/public/properties/:id` | 取得完整物業資料（含 JSON 欄位） |
| `GET /api/public/properties/:id/rooms` | 取得該物業所有房型（含新欄位） |

### C3.2 Admin API（後台管理）

| 端點 | 說明 |
|---|---|
| `GET /api/admin/experiences` | 列表 |
| `POST /api/admin/experiences` | 新增 |
| `PATCH /api/admin/experiences/:id` | 更新 |
| `DELETE /api/admin/experiences/:id` | 刪除 |
| `GET /api/admin/retreats` | 列表 |
| `POST /api/admin/retreats` | 新增 |
| `PATCH /api/admin/retreats/:id` | 更新 |
| `DELETE /api/admin/retreats/:id` | 刪除 |
| `PATCH /api/admin/properties/:id` | 擴充支援 JSON 欄位更新 |
| `PATCH /api/admin/room-types/:id` | 擴充支援新欄位更新 |

## C4. Admin 介面設計

AdminPage 維持單頁多 tab 架構，新增以下 tab：

### C4.1 Experiences Tab
- 列表顯示 name_zh、duration、status、sort_order
- 新增 / 編輯表單包含所有欄位
- includes 使用 textarea，每行一項

### C4.2 Retreats Tab
- 列表顯示 name_zh、duration、location、status
- 新增 / 編輯表單包含所有欄位
- itinerary 使用動態表單或 JSON editor

### C4.3 Properties 編輯擴充
- 在現有 Property 編輯表單中新增 JSON editor：
  - Gallery 圖片 URL 列表
  - Facilities `{icon, label}` 列表
  - Activities `{image, name, description}` 列表
  - Location Details `{description, mapImage, nearby}`
  - Story `{title, content}`

### C4.4 Room Types 編輯擴充
- 在現有 Room Type 編輯表單中新增：
  - bed_type、view、size_sqm、occupancy
  - gallery 圖片 URL 列表
  - features 特色清單

## C5. 前台頁面串接

### C5.1 ExperiencesPage
- 移除寫死資料陣列
- 透過 `useEffect` 呼叫 `GET /api/public/experiences`
- 保留 API 回傳空陣列時的 fallback demo 資料

### C5.2 RetreatsPage
- 移除寫死資料陣列
- 透過 `useEffect` 呼叫 `GET /api/public/retreats`
- 保留 API 回傳空陣列時的 fallback demo 資料

### C5.3 PropertyDetailPage
- 房型展示改為「卡片 grid + 點擊展開詳情」
- 每個房型卡片顯示：圖片、名稱、床型、景觀、面積、入住人數、特色
- 點擊展開：房型圖片輪播、更多描述、預訂諮詢按鈕
- 確保所有豐富資料從 API 讀取

### C5.4 HomePage
- Experiences Preview 從 API 讀取前 3 筆 active experiences
- Retreats Preview 從 API 讀取前 2 筆 active retreats
- Properties Preview 從 API 讀取所有 active properties

## C6. 資料遷移與種子

### C6.1 既有寫死資料遷移
將目前寫死於前台的 Experiences、Retreats、PropertyDetailPage demo 資料，透過種子腳本寫入 D1。

### C6.2 未來維護
- 新增體驗或 Retreat：直接在 Admin 後台新增
- 調整房型資訊：直接在 Admin 後台編輯
- 更換物業圖片或設施：直接在 Admin 後台編輯 Property

## C7. 部署與驗證

1. 建立 D1 migration 檔案並應用
2. 執行種子腳本填充初始資料
3. 部署 Worker
4. 前端 build 並 push 到 main 觸發 Pages 部署
5. 驗證 Admin CRUD 與前台顯示

— 文件結束 —
Stay Islands HK PRD/SA&D v2.0 | 2026 年 6 月 | 機密文件