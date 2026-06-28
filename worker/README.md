# HK Maldivers Worker

Cloudflare Worker 後端專案，採用 [Hono](https://hono.dev/) + D1 + R2 + KV 架構，為前端 `https://stay-islands-hk.pages.dev` 提供 API 服務。

## 目錄結構

```
worker/
├── src/
│   └── index.ts          # Hono 應用程式入口
├── package.json
├── wrangler.toml         # Wrangler / Cloudflare 設定
├── schema.sql            # D1 初始結構（待建立）
└── README.md
```

## 開發指令

```bash
# 本地開發
pnpm dev

# 執行本地 SQL 到 D1
pnpm db:local

# 套用資料庫 migration
pnpm db:migrate

# 部署到 Cloudflare Workers
pnpm deploy
```

## 部署前需設定的 Secrets

請使用 `wrangler secret put <NAME>` 逐一設置，**切勿**將值寫入 `wrangler.toml`：

- `CLOUDWAPI_API_KEY` — CloudWAPI / SMS 服務 API Key
- `CLOUDWAPI_SENDER` — 發送者名稱
- `JWT_SECRET` — 簽發與驗證 JWT 用的密鑰
- `STRIPE_SECRET_KEY`（可選）— Stripe 金流密鑰

## 路由結構

- `GET /` — 健康檢查
- `/api/public/*` — 公開 API（如 `GET /api/public/properties`）
- `/api/admin/*` — 管理員 API（需驗證）
- `/api/webhooks/*` — 外部 Webhook（如 Stripe）

## 綁定資源

| Binding | 類型 | 名稱 |
|---|---|---|
| `DB` | D1 Database | `stay-islands-hk-db` |
| `ASSETS` | R2 Bucket | `stay-islands-hk-assets` |
| `CACHE` | KV Namespace | `stay-islands-hk-cache` |
