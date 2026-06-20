# HK Islanders — 香港島主俱樂部

HK Islanders 的前端專案，使用 React + TypeScript + Vite + Tailwind CSS 開發，後端採用 Cloudflare Workers + D1 + R2 + KV。

## 專案定位

體驗驅動的物業銷售漏斗：
- 對外：馬爾代夫海島度假物業預訂體驗平台
- 對內：海外度假物業投資案的活體示範單位

核心敘事：**先以島主身份住進來，讓感覺帶領你，決定是否成為業主。**

## 技術棧

- React 18 + TypeScript 5.8
- Vite 7
- Tailwind CSS 3.4
- pnpm（套件管理）
- Hono + Cloudflare Workers（後端，見 `worker/`）

## 本地開發

```bash
# 安裝依賴
pnpm install

# 啟動開發伺服器
pnpm dev

# 建構生產版本
pnpm run build

# 預覽建構結果
pnpm preview
```

## 部署

此專案使用 GitHub Actions 自動部署到 Cloudflare Pages：

- 觸發條件：`push` 到 `main` 分支
- 部署腳本：`.github/workflows/deploy.yml`
- Cloudflare Pages 專案名稱：`stay-islands-hk`
- Worker 專案：`stay-islands-hk-worker`

請在 GitHub repository 設定 `CLOUDFLARE_API_TOKEN` secret。

## 重要連結

- 穩定網址：https://stay-islands-hk.pages.dev
- Worker 網址：https://stay-islands-hk-worker.jimsbond007.workers.dev
- GitHub Repo：https://github.com/twmeric/stay-islands-hk

## 專案記錄

詳細狀態與決策記錄請見 `.ai/MEMORY.md`。
