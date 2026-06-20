# HK Islanders — 內容擴充計劃

## 背景

合作夥伴網站 `https://www.stayislands.mv/` 提供了豐富的物業詳情、活動體驗（Excursions）與主題套餐（Retreats）。為了讓 HK Islanders 俱樂部網站內容更豐富、更符合高端度假物業定位，需要擴充以下內容。

由於活動與 Retreats 多為客製化服務，頁面以**展示 + 引導諮詢**為主，不開放直接下單。

## 整體調性

- 品牌：HK Islanders — 香港島主俱樂部
- 色調：深海藍 `#0a4c6b`、深藍黑 `#0d1b2a`、金色 `#B8902F`、湖水綠 `#2ec4b6`
- 字體：`Noto Sans TC` + `Playfair Display`
- 風格：簡潔、高端、沉浸式圖片、右對齊或置中 Hero、圓角卡片、金色強調
- 文案語調：體驗導向、詩意、強調「先體驗，再決定」

## 任務拆分

### 任務一：豐富物業詳情頁

**目標檔案**：
- `worker/src/lib/seed.ts`
- `worker/schema.sql`（如需要新增欄位）
- `src/pages/PropertyDetailPage.tsx`

**內容要求**：
- 為 3 個 demo properties（御海閣、私享島嶼、碧海灣）增加更豐富的資料：
  - 更多圖片（gallery）
  - 設施區塊（facilities）
  - 可體驗活動清單（activities）
  - 位置與週邊描述
  - 獨特性故事
- 如果 Worker schema 需要支援 gallery、facilities、activities，新增相應 JSON 欄位
- PropertyDetailPage 新增圖片輪播、設施區塊、活動區塊、諮詢表單

### 任務二：新增 Experiences / Excursions 頁面

**目標檔案**：
- `src/pages/ExperiencesPage.tsx`（新建）

**內容要求**：
- Hero：「海島體驗」主題，參考 `/properties` 佈局
- 展示 6 個活動：
  1. Night Fishing Trip（夜釣）
  2. Snorkeling & Diving（浮潛與潛水）
  3. Sunset Cruise（日落巡航）
  4. Island Hopping（跳島）
  5. Whale Shark & Manta Encounter（鯨鯊與魔鬼魚）
  6. Local Island Visit（本地島嶼文化體驗）
- 每個活動卡片包含：圖片、名稱、簡介、時長、建議人數、包含項目、參考價格（可標示「按行程報價」）
- CTA：「客製化此體驗」→ 開啟諮詢表單，提交到 `/api/public/inquiries`

### 任務三：新增 Retreats 頁面

**目標檔案**：
- `src/pages/RetreatsPage.tsx`（新建）

**內容要求**：
- Hero：「主題靜修」主題
- 展示 4 個 Retreat：
  1. Yoga & Adventure Retreat（8 天）
  2. Surf Retreat（8 天）
  3. Couple Getaway（8 天）
  4. Fishing Package（10 天）
- 每個 Retreat 卡片包含：圖片、名稱、天數、地點、簡介、每日行程概覽、適合對象、參考價格
- CTA：「諮詢此 Retreat」→ 開啟諮詢表單，提交到 `/api/public/inquiries`

### 任務四：整合路由、導航與首頁預覽

**目標檔案**：
- `src/App.tsx`
- `src/layouts/Layout.tsx`
- `src/pages/HomePage.tsx`

**內容要求**：
- App.tsx 新增 `/experiences` 與 `/retreats` 路由
- Layout.tsx 導航加入「海島體驗」「主題 Retreats」
- HomePage 新增兩個預覽區塊：
  - 「精選海島體驗」展示 3 個活動，連到 `/experiences`
  - 「主題 Retreats」展示 2 個 Retreat，連到 `/retreats`

## 資料來源

- 合作夥伴網站文字可參考，但需改寫為 HK Islanders 語調
- 圖片暫時使用 Unsplash，標註為 demo，之後替換

## 驗證標準

- `pnpm exec tsc --noEmit` 無錯誤
- `pnpm run build` 成功
- 新頁面風格與現有頁面一致
- 所有諮詢表單正確提交到 Worker API
