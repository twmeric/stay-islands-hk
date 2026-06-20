# Stay Islands HK - 馬爾代夫海島度假預訂平台

專為香港旅客打造的馬爾代夫頂級度假體驗平台。

## Project Status

- **Project Type**: React + TypeScript + Vite + Tailwind CSS + Youbase Backend
- **Backend URL**: `https://staging--4ea90hamxnhi5jzf7tqf.youbase.cloud`
- **Language**: 繁體中文 (Traditional Chinese)
- **Currency**: HKD (港幣)

## Architecture

### Frontend (React SPA)
- **Home**: 沉浸式海島背景首頁
- **Properties**: 度假物業列表及詳情
- **Booking**: 預訂下單系統（支援多種港幣支付方式）
- **Auth**: 會員系統（使用 @edgespark/client 內建 UI）
- **Dashboard**: 會員中心（預訂記錄、電子憑證）
- **Trip Planner**: 行程規劃工具（個人化度假清單）
- **Admin**: 後台管理（訂單管理、旅客諮詢、房型庫存）
- **Guide**: 香港人馬爾代夫旅遊指南

### Backend (Youbase - Hono + D1)
- Properties CRUD (public + admin)
- Room types management
- Booking system with voucher codes
- Trip plans CRUD
- Inquiries system with admin reply
- Auth: built-in via EdgeSpark

### Database Tables
- `properties` - 度假物業
- `room_types` - 房型
- `bookings` - 預訂訂單
- `inquiries` - 旅客諮詢
- `trip_plans` - 行程計劃
- `admins` - 管理員角色 (role: 'superadmin' | 'admin')

### Member System (三合一頁面: /member)
- **未登入** → 顯示登入/註冊界面 + 會員權益介紹
- **一般會員** → 個人資料 + 預訂記錄 + 電子憑證
- **管理員** → 以上全部 + 訂單管理 + 旅客諮詢 + 房型庫存
- **超級管理員** → 以上全部 + 帳戶管理
- Sidebar 導航，根據角色動態顯示功能選項
- `/auth`, `/dashboard`, `/admin` 舊路由自動重導至 `/member`

### Admin System
- Superuser: twmeric@gmail.com (superadmin)
- All `/api/admin/*` routes are protected by admin middleware
- `/api/admin/accounts` routes restricted to superadmin only
- `/api/admin/check` endpoint returns admin status for the logged-in user

### Payment Methods Supported
- Credit Card (Visa/Mastercard)
- PayMe
- FPS 轉數快
- AlipayHK
- WeChat Pay HK
- Apple Pay
- Google Pay

## Build Commands
```bash
npm run build    # Production build
npm run dev      # Development server
```

## Key Files
- `src/api/client.ts` - EdgeSpark client configuration
- `src/store/authStore.ts` - Auth state management (Zustand + persist)
- `src/layouts/Layout.tsx` - Main layout with navigation
- `src/pages/` - All page components
- `backend/server/src/index.ts` - Backend API routes
