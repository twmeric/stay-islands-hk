# Stay Islands HK

Stay Islands HK 的前端專案，使用 React + TypeScript + Vite + Tailwind CSS 開發。

## 技術棧

- React 18 + TypeScript 5.8
- Vite 7
- Tailwind CSS 3.4
- pnpm（套件管理）

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

請在 GitHub repository 設定 `CLOUDFLARE_API_TOKEN` secret，其餘部署參數已寫在 workflow 中。
