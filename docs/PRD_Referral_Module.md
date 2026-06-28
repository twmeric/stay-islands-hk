# HK Maldivers Referral Module — 產品需求文件（PRD）

> **版本**: v1.0  
> **適用專案**: stay-islands-hk（MV）  
> **目標**: 讓小 B 夥伴可以透過專屬連結協助推廣住宿與體驗，並在客人付款後獲得回饋。

---

## 1. 背景與目標

HK Maldivers 目前主要透過官網承接高客單旅遊諮詢與預約。為了擴大客源，我們希望啟用 **Offline-to-Online 的分享夥伴機制**：

- 由 Admin 主動邀請並建立夥伴資料。
- 夥伴掃描 QR Code 後，只需在 WhatsApp 按發送，即可取得專屬連結。
- 客人透過該連結進站並完成預約付款，系統自動歸因並計算回饋。
- 整個流程對夥伴來說零門檻、無需登入後台。

---

## 2. 名詞定義

| 名詞 | 說明 |
|---|---|
| **分享夥伴 / Referrer / 小 B** | 經 Admin 邀請，擁有專屬推薦連結的推廣者 |
| **Referral Code** | 夥伴唯一推薦碼，格式 `R-XXXXXX`，例如 `R-ABC123` |
| **專屬連結** | 帶有 `?ref=R-XXXXXX` 的官網連結 |
| **Dashboard** | 夥伴查看業績與佣金的公開頁面，靠 secret token 訪問 |
| **Referral Order** | 一筆已付款訂單對應的佣金紀錄 |

---

## 3. 用戶角色與用戶故事

### 3.1 Admin（管理員）

- 身為 Admin，我希望在後台建立分享夥伴，以便控制誰能成為推廣者。
- 身為 Admin，我希望為每個夥伴產生專屬 QR Code 與 WhatsApp deeplink，方便我私下發送給他們。
- 身為 Admin，我希望查看所有夥伴的業績與佣金狀態，以便對帳與發放。
- 身為 Admin，我希望調整佣金規則（% 或定額），因為佣金模式尚未最終確定。

### 3.2 分享夥伴（小 B）

- 身為夥伴，我只需要掃描 QR Code、在 WhatsApp 按發送，就能收到我的專屬連結。
- 身為夥伴，我希望透過 Dashboard 查看我帶來了多少成交與佣金。
- 身為夥伴，我希望在客人付款後收到 WhatsApp 通知，知道成交結果。

### 3.3 客人

- 身為客人，我透過夥伴連結進入官網，體驗與一般訪客一致。
- 身為客人，我完成預約付款後，訂單能正確歸因給推薦我的夥伴。

---

## 4. 核心流程

### 4.1 Admin 建立夥伴並發送 QR Code

1. Admin 登入後台，進入「分享夥伴」tab。
2. 點擊「新增夥伴」，輸入名稱（電話選填）。
3. 系統產生：
   - `referral_code`
   - dashboard `token`
   - 專屬分享連結：`https://stay-islands-hk.pages.dev/?ref=R-XXXXXX`
   - Dashboard 連結：`https://stay-islands-hk.pages.dev/ref/d/{token}`
   - WhatsApp deeplink：`https://wa.me/85262322466?text=HKMaldivers%20R-XXXXXX`
   - QR Code（由 deeplink 生成）
4. Admin 複製 QR Code 或 deeplink，私下發送給夥伴。

### 4.2 夥伴掃碼取得連結

1. 夥伴掃描 QR Code，WhatsApp 自動開啟。
2. 訊息欄已預填：`HKMaldivers R-XXXXXX`。
3. 夥伴按發送。
4. 系統收到訊息，辨識 `R-XXXXXX`，回覆：
   > 歡迎成為 HK Maldivers 分享夥伴！  
   > 你的專屬連結：{link}  
   > 查看業績：{dashboard_link}

### 4.3 客人透過連結預約

1. 客人點擊專屬連結進入官網。
2. 前台 `captureRefCode()` 將 `ref` 存入 `localStorage`。
3. 客人在住宿頁提交預約諮詢。
4. `POST /api/public/bookings` 帶上 `referral_code`。
5. Worker 將 `referral_code` 寫入 `bookings.referral_code`。

### 4.4 訂單付款後發佣

1. Admin 在後台將訂單標記為 `paid`（或付款 webhook 完成）。
2. Worker 檢查 `bookings.referral_code`。
3. 找到對應夥伴後，根據 `referral_settings` 計算佣金。
4. 寫入 `referral_orders`，狀態為 `pending`。
5. 發送 WhatsApp 喜報給夥伴。
6. Admin 後續在「佣金紀錄」中核准並標記為 `paid`。

### 4.5 夥伴查看 Dashboard

1. 夥伴開啟 Dashboard 連結 `/ref/d/{token}`。
2. 頁面顯示：名稱、專屬連結、累計成交、pending / approved / paid 佣金、最近成交紀錄。

---

## 5. 功能需求

### 5.1 後台夥伴管理（Admin only）

| 功能 | 說明 |
|---|---|
| 新增夥伴 | 輸入名稱，自動產生 code / token / 連結 / QR |
| 夥伴列表 | 顯示名稱、code、狀態、累計成交、累計佣金 |
| 啟用/停用 | 可切換夥伴狀態 |
| 複製連結 | 分享連結、Dashboard 連結、WhatsApp deeplink |
| 重新發送訊息 | 手動觸發再次發送歡迎訊息到夥伴 WhatsApp |

### 5.2 QR Code / WhatsApp Deeplink 生成

- 每個夥伴擁有唯一 deeplink，內含 `R-XXXXXX`。
- QR Code 由外部 API（如 `api.qrserver.com`）根據 deeplink 生成。
- Admin 可直接在後台預覽與下載。

### 5.3 WhatsApp 自動回覆

- 監聽現有 `/cloudwapi/incoming` webhook。
- 當訊息包含「`HKMaldivers`」時：
  - 提取 `R-XXXXXX`。
  - 若 code 存在且有效：回覆專屬連結 + Dashboard 連結。
  - 若無效或不存在：回覆邀請制提示。

### 5.4 前台 ref code 追蹤

- 頁面載入時檢查 `?ref=R-XXXXXX`。
- 存入 `localStorage`，key 為 `hkm_referral_code`。
- 適用頁面：首頁、住宿詳情頁、體驗頁、`/plan`。
- 預約提交時帶入 `referral_code`。

### 5.5 佣金計算與發佣

- 佣金規則儲存於 `referral_settings`。
- 預設模式：`percentage`，數值 `5`。
- 發佣時機：`bookings.paymentStatus = 'paid'`。
- 計算公式：
  - percentage：`commission = booking.total_amount * percentage / 100`
  - fixed：`commission = fixed_amount`
- 寫入 `referral_orders`，狀態 `pending`。
- 發送 WhatsApp 成交喜報。
- Admin 可手動 `pending` → `approved` → `paid`。

### 5.6 夥伴 Dashboard

- 公開頁面 `/ref/d/:token`。
- 顯示：名稱、專屬連結、累計成交單數、各狀態佣金總額、最近成交紀錄。
- 不需要登入，僅靠 token 識別。

### 5.7 佣金規則設定

- 後台可切換 `percentage` / `fixed`。
- 可輸入數值。
- 預設 HKD。

---

## 6. 佣金規則（暫定）

| 項目 | 設定 |
|---|---|
| 模式 | percentage |
| 數值 | 5% |
| 貨幣 | HKD |
| 發佣時機 | 訂單 paymentStatus = paid |
| 自購 | 允許 |
| 佣金狀態流 | pending → approved → paid |

> 備註：此規則為初期上線值，後續可在 Admin 後台調整，無需改動 schema。

---

## 7. 非功能需求

| 項目 | 要求 |
|---|---|
| 安全 | Dashboard 僅靠 secret token；Admin API 需認證 |
| 效能 | 佣金計算在標記 paid 時同步完成，不影響預約流程 |
| 可用性 | WhatsApp 回覆失敗不阻塞原 webhook 回應 |
| 擴展性 | 佣金規則以 JSON 儲存，未來可支援階梯式規則 |
| 稽核 | Admin 操作寫入 `audit_logs` |

---

## 8. 驗收標準

- [ ] Admin 可在後台新增夥伴並看到 QR Code 與 deeplink。
- [ ] 夥伴掃描 QR Code 發送 `HKMaldivers R-XXXXXX` 後，收到專屬連結與 Dashboard。
- [ ] 客人透過 `?ref=R-XXXXXX` 進站，預約後 `bookings.referral_code` 正確記錄。
- [ ] 訂單標記 paid 後，`referral_orders` 產生一筆 pending 佣金。
- [ ] 夥伴收到 WhatsApp 成交通知。
- [ ] 夥伴可透過 Dashboard 連結查看業績。
- [ ] Admin 可在後台核准 / 標記佣金為 paid，並修改佣金規則。

---

## 9. 附錄

- 公司 WhatsApp 號碼：`85262322466`
- 關鍵字：`HKMaldivers`
- 專屬連結範例：`https://stay-islands-hk.pages.dev/?ref=R-ABC123`
- Dashboard 範例：`https://stay-islands-hk.pages.dev/ref/d/{token}`
