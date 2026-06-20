# HK Islanders — Agent Rules

## 引用母機守則

- **Rule 39: 批量修改與驗證節制原則**
  - 同一文件避免連續多次 `StrReplaceFile`；優先整段重寫或批量 edit。
  - WebBridge 截圖只用於結構性/互動性變更驗證；純文案修改不截圖。
  - 每個工具調用需有明確目的，避免無謂驗證消耗 token。

## 本專案額外規則

1. **套件管理**：統一使用 `pnpm`（MotherBase 會攔截 `npm`）。
2. **前端構建**：`pnpm run build`。
3. **Worker 構建與部署**：在 `worker/` 目錄執行 `pnpm exec wrangler deploy`。
4. **本地預覽**：使用 `spa_server.py` 避免 React Router 直接重新整理 404。
5. **部署**：Cloudflare Pages，project name `stay-islands-hk`；使用 `wrangler pages deploy dist --project-name stay-islands-hk --branch main`。
6. **認證**：部署時使用 `CLOUDFLARE_API_TOKEN` 環境變數。
7. **文案語調**：「島主體驗導向」優先，避免首屏出現投資/回報數字。
8. **品牌名稱**：統一使用 `HK Islanders`（複數），避免 `HK Islander`（單數）。
9. **後端 API**：所有新 API 優先實作在 `worker/src/routes/`，前端透過 `src/api/client.ts` 呼叫。
