# Stay Islands HK — Current Task

## 本輪目標

1. 調整 `/invest` 頁面 Hero 布局：桌面與行動端都將文字放在海的位置，避免遮擋度假酒店。
2. 作為 CMO 與用戶交流「島主」文案是否過度，並提供替換建議。
3. 同步梳理全站「島主」相關文案。

## 狀態：✅ 完成

- [x] 派發 Agent 調整 `src/pages/InvestPage.tsx` Hero 區域：
  - 桌面端：文字靠左 + 圖片 `object-[70%_center]`，度假酒店在右側，文字覆蓋左側海面。
  - 行動端：上下布局，圖片在上（58vh），文字與按鈕在下（`#0d1b2a`）。
- [x] 將 `/invest` Hero 標題簡化為「先體驗，再決定。」，避免斷行。
- [x] `pnpm run build` 成功。
- [x] 部署至 Cloudflare Pages（deployment ID: `755997ee`）。
- [x] Push 到 GitHub，觸發 GitHub Actions 自動部署。
- [x] WebBridge 截圖驗證桌面端效果（用戶隨後要求停止使用 WebBridge，已關閉 session）。
- [x] 建立 `.ai/TASKS/wording-island-owner.md`，統計全站 54 處「島主」、47 處「島嶼」並提供替換建議。
- [x] 更新 `.ai/MEMORY.md` 與 `.ai/TASKS/current.md`。

## 待確認事項

1. **「島主」文案替換方向**：
   - 建議採用「海島業主」「海島屋主」或「度假屋主」作為核心稱謂。
   - 「島主計劃」→「海島業權計劃」「海島物業計劃」或「業主計劃」。
   - 「島主體驗」→「業主體驗」或「海島業主體驗」。
   - 詳見 `.ai/TASKS/wording-island-owner.md`。

2. **是否立即執行全站文案替換？**

## 下一步（建議優先順序）

1. **文案替換**：根據用戶確認的方向，執行全站「島主」→「海島業主/屋主」替換。
2. **後端遷移**：依照 `.ai/TASKS/backend-migration.md` 建立 Cloudflare Workers + D1 + R2。
3. **表單落庫**：將體驗查詢、島主對話、免費靈感集等表單寫入 D1。
4. **真實素材**：替換 Unsplash 圖片、業主故事、顧問照片。
5. **合規審核**：投資回報數字、免責聲明、法律文案。

## 備註

- 所有表單目前僅 console.log 並顯示成功訊息；未來需改為真實 API 調用。
- WebBridge 已根據用戶要求停止使用；後續視覺驗證改用其他方式（如 Playwright、本地預覽）或不再截圖。
