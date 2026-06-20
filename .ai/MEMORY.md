# HK Islanders — 香港島主俱樂部 | Project Memory

## 專案定位

HK Islanders（香港島主俱樂部）是一個**體驗驅動的物業銷售漏斗**：
- 對外是馬爾代夫海島度假物業的預訂體驗平台；
- 對內是海外度假物業投資案的「活體示範單位」——每一晚真實預訂都在證明「有人租」。

核心敘事：**先以島主身份住進來，讓感覺帶領你，決定是否成為業主。**

> 用詞備註：「島主」為 HK Islanders 對海島物業業主的暱稱，全稱為「海島業主」。

## 技術架構

| 層級 | 技術 | 路徑 |
|---|---|---|
| 前端 | React 18 + TypeScript 5.8 + Vite 7 + Tailwind CSS 3.4 | `E:\Projects\MV\extracted` |
| 後端 | Hono + TypeScript + Cloudflare Workers + D1 + R2 + KV | `E:\Projects\MV\extracted/worker` |
| 套件管理 | pnpm 10.32.1 | — |
| Node.js | v24.14.0 | — |

## 部署狀態

| 資源 | 名稱 / URL |
|---|---|
| Cloudflare Pages 專案 | `stay-islands-hk` |
| 穩定網址 | https://stay-islands-hk.pages.dev |
| Cloudflare Worker | `stay-islands-hk-worker` |
| Worker 網址 | https://stay-islands-hk-worker.jimsbond007.workers.dev |
| D1 Database | `stay-islands-hk-db` |
| R2 Bucket | `stay-islands-hk-assets` |
| KV Namespace | `stay-islands-hk-cache` |
| GitHub Repo | `twmeric/stay-islands-hk` |

## CI/CD

- Workflow: `.github/workflows/deploy.yml`
- 觸發條件：`push` 到 `main`
- GitHub Secret: `CLOUDFLARE_API_TOKEN`
- 前端 build 時使用 `VITE_WORKER_URL=https://stay-islands-hk-worker.jimsbond007.workers.dev`

## 已完成核心功能

### Worker 後端
- D1 schema：18 張業務表（properties、room_types、bookings、payments、customers、leads、inquiries、cms_articles、admins、audit_logs、whatsapp 相關表、coupons 等）
- Public API：properties、articles、inquiries、leads、bookings
- Admin API：auth (JWT)、dashboard、properties、room types、inquiries、leads、bookings、payments、customers、CMS articles、coupons、admin accounts、audit logs
- CRM API：customers、WhatsApp templates、broadcasts、conversations、messages
- Webhooks：CloudWAPI incoming / status
- 自動 seed demo properties / room types / 預設 superadmin
- CORS 允許 `*.stay-islands-hk.pages.dev`、主域與 `localhost`

### 前端
- 品牌統一為 **HK Islanders - 香港島主俱樂部**
- 移除 EdgeSpark，改接自製 Worker API
- 首頁 Hero 右側對齊，避免遮擋度假酒店
- `/invest` Hero 左下角對齊，加入出租實證區塊
- `/properties` Hero 加高，mobile 採上圖下文
- AuthPage 自訂登入表單，儲存 JWT token
- DashboardPage 顯示會員預訂
- AdminPage 管理員後台（待全面改寫為新 Admin API 介面）
- TripPlannerPage 使用 localStorage 本機 mock

## 預設帳號

| 角色 | Email | 密碼 | 說明 |
|---|---|---|---|
| Superadmin | `admin@stayislands.hk` | `stay1234` | Worker seed 自動建立 |

## 待完善項目

1. **Admin 前端改寫**：AdminPage 仍使用舊 EdgeSpark 風格介面，需對應新 Admin API 重新設計。
2. **支付整合**：尚未串接 Stripe / PayMe / AsiaPay，bookings 僅記錄資料。
3. **WhatsApp 實際發送**：`worker/src/lib/cloudwapi.ts` 使用佔位 endpoint，待確認 CloudWAPI 正式 URL。
4. **素材替換**：仍使用 Unsplash demo 圖片與 demo 數據。
5. **合規審核**：投資回報率、業主故事、剩餘名額皆為 demo；正式上線前需法律審核與真實素材替換。
6. **域名與信箱**：目前仍使用 `stayislands.hk`，後續若品牌全面改為 HK Islanders 需同步更新。

## 重要檔案

| 檔案 | 用途 |
|---|---|
| `worker/wrangler.toml` | Worker 綁定 D1 / R2 / KV / secrets |
| `worker/schema.sql` | D1 完整 schema |
| `worker/src/routes/public.ts` | 公開 API |
| `worker/src/routes/admin.ts` | Admin API |
| `worker/src/routes/crm.ts` | CRM + WhatsApp API |
| `worker/src/routes/webhooks.ts` | Webhook handlers |
| `src/api/client.ts` | 前端 API client（原生 fetch + legacy 端點轉換）|
| `.github/workflows/deploy.yml` | Pages 自動部署 |

## 環境變數

前端 build 需要：
```
VITE_WORKER_URL=https://stay-islands-hk-worker.jimsbond007.workers.dev
```

Worker secrets（已設置）：
- `JWT_SECRET`
- `CLOUDWAPI_API_KEY`
- `CLOUDWAPI_SENDER`
- `STRIPE_SECRET_KEY`（可選）

## 本地開發指令

```bash
# 前端
cd E:\Projects\MV\extracted
pnpm install
pnpm dev
pnpm run build

# Worker
cd E:\Projects\MV\extracted/worker
pnpm install
pnpm exec wrangler dev
pnpm exec wrangler deploy
```

## 注意事項

- 統一使用 `pnpm`（MotherBase 會攔截 `npm`）。
- 本地預覽 SPA 請使用 `spa_server.py` 避免 React Router 重新整理 404。
- WebBridge：已根據用戶要求停止使用。
