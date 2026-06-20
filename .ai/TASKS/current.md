# HK Islanders — Current Task

## 本輪目標

整理本地檔案與目錄：
1. 記錄截至目前為止的重要決策與狀態。
2. 刪除不再需要的舊檔案（EdgeSpark/Youbase 後端、備份檔、Youware 相關檔案、佔位 README）。
3. 讓專案結構清晰、易於後續維護。

## 狀態：✅ 完成

- [x] 更新 `.ai/MEMORY.md` 為最新專案狀態（HK Islanders 品牌、Worker 後端、部署資訊、待辦）。
- [x] 更新 `.ai/RULES.md` 移除 EdgeSpark/Youware 相關規則，加入 HK Islanders 品牌規則。
- [x] 更新根目錄 `README.md`。
- [x] 刪除舊 `backend/` 目錄（EdgeSpark/Youbase）。
- [x] 刪除備份檔：`HomePage.tsx.bak`、`PropertyDetailPage.tsx.bak`。
- [x] 刪除 Youware 相關檔案：`youware-bg.png`、`yw_manifest.json`、`YOUWARE.md`。
- [x] 刪除佔位 README 與舊待辦：`TO-DO.json`、`src/**/README.md`。
- [x] 從 `package.json` 與 `vite.config.ts` 移除 `@youware/vite-plugin-react`。
- [x] 將 `package.json` 的 `name` 改為 `hk-islanders-frontend`。
- [x] `pnpm install`、`pnpm run build`、`pnpm exec tsc --noEmit` 皆成功。

## 下一步（建議優先順序）

1. **Admin 前端改寫**：AdminPage 仍使用舊 EdgeSpark 風格，需對應新 Admin API 重新設計。
2. **支付整合**：串接 Stripe / PayMe / AsiaPay，完成 booking → payment 流程。
3. **WhatsApp 實際發送**：確認 CloudWAPI 正式 endpoint 並更新 `worker/src/lib/cloudwapi.ts`。
4. **真實素材**：替換 Unsplash 圖片、業主故事、顧問照片、支付圖示。
5. **合規審核**：投資回報數字、免責聲明、法律文案、真實數據。
6. **會員中心 `/member`**：目前為靜態引導頁，可擴充為完整會員功能。

## 備註

- WebBridge 已根據用戶要求停止使用；後續視覺驗證以本地預覽或部署後檢查為主。
- 預設管理員：`admin@stayislands.hk` / `stay1234`。
