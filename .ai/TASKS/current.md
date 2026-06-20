# Stay Islands HK — Current Task

## 本輪目標

1. 修正 Hero 布局：文案與按鈕靠右，圖片中心左移，避免遮擋度假酒店。
2. 設置 GitHub Actions CI/CD，連接 Cloudflare Pages 自動部署。

## 狀態：✅ 完成

- [x] 派發 Agent 修改 `src/pages/HomePage.tsx` Hero 區域為左圖右文布局。
- [x] 派發 Agent 建立 `.github/workflows/deploy.yml`、`.gitignore`、`README.md`。
- [x] `pnpm run build` 成功。
- [x] 手動部署至 Cloudflare Pages（deployment ID: `e1abbefa`）。
- [x] 創建 GitHub repository：`twmeric/stay-islands-hk`。
- [x] Push 初始 commit 到 `main` 分支。
- [x] 設置 repository secret：`CLOUDFLARE_API_TOKEN`。
- [x] WebBridge 截圖驗證 Hero 新布局清晰，度假酒店不再被文字遮擋。
- [x] 更新 `.ai/MEMORY.md` 與 `.ai/TASKS/current.md`。

## 下一步（建議優先順序）

1. **後端遷移**：建立 Cloudflare Workers + D1 + R2（Hono），替換 EdgeSpark staging。
2. **表單落庫**：將體驗查詢、島主對話、免費靈感集等表單寫入 D1。
3. **真實素材**：替換 Unsplash 圖片、業主故事、顧問照片。
4. **合規審核**：投資回報數字、免責聲明、法律文案。
5. **自動部署驗證**：下次 push 到 main 時確認 GitHub Actions 成功觸發。

## 備註

- 所有表單目前僅 console.log 並顯示成功訊息；未來需改為真實 API 調用。
- 後續純文案修改不再進行 WebBridge 截圖驗證（Rule 39）。
