# Stay Islands HK — Project Memory

## 戰略定位

從 OTA / 物業投資平台轉型為 **「體驗驅動的物業銷售漏斗」**。核心假設：讓用戶先以「島主」身份住進來，透過心理所有權與角色預演，自然產生擁有慾望。

## 已完成（前端靜態展示版）

- 首頁 Hero 改為**左圖右文兩邊布局**：文案與 CTA 置於右側，背景圖片 focal point 左移，避免遮擋度假酒店主體。
- 首頁「為你的島嶼命名」互動，強調「感覺優先」。
- 物業列表頁移除本地 demo，改由 `client.ts` mock fallback 提供 3 筆 demo 島嶼。
- 物業詳情頁雙視角：旅客視角（體驗查詢表單）/ 島主視角（生活場景預演）。
- `/invest` 改為「島主計劃」著陸頁，回報數字後置於權威區塊。
- `/member` 降級為靜態引導頁，移除 EdgeSpark 登入 UI。
- `App.tsx` 移除 `ProtectedRoute`；`/trip-planner` 公開訪問。
- `client.ts` 加入 mock wrapper，攔截 public properties API，其他端點返回空響應避免 crash。
- `authStore.ts` 加入容錯初始化，persist 失敗時 fallback 為非持久化登出狀態。

## 部署狀態

- **Cloudflare project**: `stay-islands-hk`
- **最新 deployment**: https://e1abbefa.stay-islands-hk.pages.dev
- **Production / 穩定 URL**: https://stay-islands-hk.pages.dev（同樣 200）
- 舊 deployment IDs（`3e0598b8`、`05e740de`）仍可訪問，但內容落後。

## CI/CD

- **GitHub repository**: https://github.com/twmeric/stay-islands-hk
- **Workflow**: `.github/workflows/deploy.yml`
- **Trigger**: push to `main`
- **Secret**: `CLOUDFLARE_API_TOKEN` 已設置
- 未來 push 到 `main` 會自動 build 並部署到 Cloudflare Pages。

## 技術債

- `client.ts` 仍指向 EdgeSpark staging URL；所有表單僅為留資（lead capture），未連接真實後端。
- 尚未建立 Cloudflare Workers + D1 + R2 後端（Hono）。
- `.github/workflows/deploy.yml` 已配置，但需等待首次自動部署驗證。

## 合規債

- 投資回報率、業主故事、剩餘名額皆為 demo 數據。
- 正式上線前需法律審核、免責聲明、真實素材替換。

## 工具與環境

- Node.js v24.14.0, pnpm 10.32.1
- React + TypeScript + Vite + Tailwind CSS
- Cloudflare credentials: `E:\Projects\motherbase\SOULS\tokens\cloudflare_credentials.md`
- GitHub token: 環境變量 `GITHUB_TOKEN`（於當前會話可用）
