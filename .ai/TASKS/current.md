# Stay Islands HK — Current Task

## 本輪目標

完成前端靜態展示版收尾與部署，確認線上狀態正常。

## 狀態：✅ 完成

- [x] 確認 `MemberPage.tsx` 降級為靜態引導頁。
- [x] 確認 `client.ts` mock mode 穩定攔截 public properties。
- [x] 確認 `authStore.ts` 容錯初始化。
- [x] 確認 Property/Properties 頁面島主體驗導向文案。
- [x] `pnpm run build` 成功。
- [x] 部署至 Cloudflare Pages（deployment ID: `3e0598b8`）。
- [x] HTTP 200 驗證通過（新 URL、production URL、舊 URL）。
- [x] WebBridge 截圖首頁，確認島主體驗導向文案正確。
- [x] 建立 `.ai/RULES.md`、`.ai/MEMORY.md`、`.ai/TASKS/current.md`。

## 下一步（待業主決策）

1. **後端遷移**：建立 Cloudflare Workers + D1 + R2（Hono），替換 EdgeSpark。
2. **表單落庫**：將體驗查詢、島主對話表單寫入 D1。
3. **真實素材**：替換 Unsplash 圖片、業主故事、顧問照片。
4. **合規審核**：投資回報數字、免責聲明、法律文案。
5. **CI/CD**：GitHub Actions + Wrangler 自動部署。

## 備註

- 所有表單目前僅 console.log 並顯示成功訊息；未來需改為真實 API 調用。
- 若後續僅做文案調整，不再進行 WebBridge 截圖驗證（Rule 39）。
