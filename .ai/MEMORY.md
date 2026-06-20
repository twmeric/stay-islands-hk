# Stay Islands HK — Project Memory

## 戰略定位

從 OTA / 物業投資平台轉型為 **「體驗驅動的物業銷售漏斗」**。核心假設：讓用戶先以「海島業主」身份住進來，透過心理所有權與角色預演，自然產生擁有慾望。

> 文案調整備註：「島主」一詞正在審議中。實際產品是島上度假酒店物業，非整座島嶼，需改用更準確的稱謂（詳見 `.ai/TASKS/wording-island-owner.md`）。

## 已完成（前端靜態展示版）

- 首頁 Hero 改為**左圖右文兩邊布局**：文案與 CTA 置於右側，背景圖片 focal point 左移，避免遮擋度假酒店主體。
- 首頁 Hero 標語改為更優雅呈現：
  - **桌面端**：「留住 · 感受 / 放鬆身心」
  - **行動端**：垂直三行「留住 / 感受 / 放鬆身心」
- 首頁 Hero 行動端改為**上下布局**：上半部 55vh 圖片，下半部深色背景文字與按鈕。
- `/invest` Hero 改為：
  - **桌面端**：文字靠左，圖片 `object-[70%_center]` 讓度假酒店偏右，文字覆蓋左側海面。
  - **行動端**：上下布局，圖片在上（58vh），文字與按鈕在下（`#0d1b2a` 背景）。
- `/invest` 標題簡化為「先體驗，再決定。」，避免尷尬斷行。
- 首頁「為你的島嶼命名」互動（文案待調整）。
- 物業列表頁移除本地 demo，改由 `client.ts` mock fallback 提供 3 筆 demo 島嶼。
- 物業詳情頁雙視角：旅客視角 / 島主視角（名稱待調整）。
- `/invest` 改為「島主計劃」著陸頁（名稱待調整）。
- `/member` 降級為靜態引導頁。
- `App.tsx` 移除 `ProtectedRoute`；`/trip-planner` 公開訪問。
- `client.ts` 加入 mock wrapper。
- `authStore.ts` 加入容錯初始化。

## 部署狀態

- **Cloudflare project**: `stay-islands-hk`
- **最新 deployment**: https://755997ee.stay-islands-hk.pages.dev
- **Production / 穩定 URL**: https://stay-islands-hk.pages.dev

## CI/CD

- **GitHub repository**: https://github.com/twmeric/stay-islands-hk
- **Workflow**: `.github/workflows/deploy.yml`
- **Trigger**: push to `main`
- **Secret**: `CLOUDFLARE_API_TOKEN` 已設置
- 最新 push 已成功觸發 GitHub Actions 自動部署。

## 文案審議（進行中）

- 報告：`.ai/TASKS/wording-island-owner.md`
- 統計：全站 54 處「島主」、47 處「島嶼」、8 處「留下來」。
- 建議方向：從「擁有島嶼」轉向「擁有海島度假物業 / 海島之家」，核心稱謂改為「海島業主」「海島屋主」或「度假屋主」。
- 待業主確認後執行全站替換。

## 後端遷移規劃

- 規劃文件：`.ai/TASKS/backend-migration.md`
- 目標：EdgeSpark → Cloudflare Workers + D1 + R2（Hono）

## 技術債

- `client.ts` 仍指向 EdgeSpark staging URL；所有表單僅為留資，未連接真實後端。
- 尚未建立 Cloudflare Workers + D1 + R2 後端。
- 文案中的「島主」「島嶼」等稱謂需根據業主決策統一替換。

## 合規債

- 投資回報率、業主故事、剩餘名額皆為 demo 數據。
- 正式上線前需法律審核、免責聲明、真實素材替換。

## 工具與環境

- Node.js v24.14.0, pnpm 10.32.1
- React + TypeScript + Vite + Tailwind CSS
- Cloudflare credentials: `E:\Projects\motherbase\SOULS\tokens\cloudflare_credentials.md`
- GitHub token: 環境變量 `GITHUB_TOKEN`
- WebBridge：已根據用戶要求停止使用。
