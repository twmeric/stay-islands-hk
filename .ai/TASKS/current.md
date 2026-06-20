# Stay Islands HK — Current Task

## 本輪目標

1. 修正 Hero 標語呈現：將「留住。感受。放鬆身心。」改為更優雅的排版。
2. 修正 Hero 行動端布局：改為上下結構，圖片在上（酒店中央偏上），文字與按鈕在下。
3. 同步準備後端遷移規劃。

## 狀態：✅ 完成

- [x] 派發 Agent 重新設計 Hero 文案與響應式布局（桌面左圖右文 + 行動端上下布局）。
- [x] 派發 Agent 建立 `.ai/TASKS/backend-migration.md`。
- [x] `pnpm run build` 成功。
- [x] 手動部署至 Cloudflare Pages（deployment ID: `ef85a2a0`）。
- [x] Push 到 GitHub，`main` 分支觸發 GitHub Actions 自動部署成功。
- [x] WebBridge 截圖驗證桌面端 Hero：度假酒店在左、文案按鈕在右、無遮擋。
- [x] WebBridge + CSS 模擬驗證行動端 Hero：圖片在上、文字按鈕在下、標語垂直三行。
- [x] 更新 `.ai/MEMORY.md` 與 `.ai/TASKS/current.md`。

## 下一步（建議優先順序）

1. **後端遷移**：依照 `.ai/TASKS/backend-migration.md` 建立 Cloudflare Workers + D1 + R2（Hono）。
2. **表單落庫**：將體驗查詢、島主對話、免費靈感集等表單寫入 D1。
3. **真實素材**：替換 Unsplash 圖片、業主故事、顧問照片。
4. **合規審核**：投資回報數字、免責聲明、法律文案。

## 備註

- 所有表單目前僅 console.log 並顯示成功訊息；未來需改為真實 API 調用。
- 後續純文案修改不再進行 WebBridge 截圖驗證（Rule 39）。
- GitHub Actions 已成功驗證，未來 push 到 `main` 會自動部署。
