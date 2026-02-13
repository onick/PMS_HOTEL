# HotelMate PMS — Frontend

React SPA for HotelMate, a hotel property management system.

## Tech Stack

- **React 18** + **TypeScript** + **Vite**
- **shadcn/ui** (Radix UI + Tailwind CSS)
- **TanStack Query** — Server state management
- **Zustand** — Client state
- **React Router v6** — Lazy-loaded routes
- **Recharts** — Data visualization
- **Stripe.js** — Payment forms

## Modules

| Module | Page | Components |
|--------|------|------------|
| Dashboard | DashboardHome, ManagerDashboard | StatCard, RoomStatusCard, KpiCard |
| Front Desk | FrontDesk | TodayArrivals, TodayDepartures, InHouseGuests, RoomStatusGrid, WalkInDialog |
| Reservations | Reservations | ReservationsList, Calendar, Timeline, NewReservationDialog |
| Housekeeping | Housekeeping | RoomsByStatus, CleaningPriority, RoomChecklist, IncidentReports |
| Billing | Billing | ActiveFolios, FolioDetails, PaymentMethods, RecentTransactions |
| Channel Manager | Channels | ChannelsList, ChannelMappings, InventorySync, SyncLogs |
| Revenue | Revenue | RateCalendar, CompetitorRates, RevenueSettings |
| CRM | CRM | GuestsList, GuestDetails |
| Reports | Reports, ManagerReports | OccupancyChart, RevenueChart, SparklineChart |
| Booking Engine | BookingEngine | 4-step public wizard (search, select, guest info, confirm) |
| Settings | Settings | HotelSettings, RoomTypes, Rooms, RatePlans, PromoCodes |
| Staff | Staff | AddStaffDialog |
| Security | Security | AuditLogs, PermissionsManager, GDPRRequests |

**90+ components across 24 pages**

## Quick Start

```bash
npm install
cp .env.example .env    # Fill in your values
npm run dev             # http://localhost:8080
```

## Environment Variables

```env
# Laravel API Backend
VITE_API_URL=http://localhost:8000/api

# Supabase (legacy — being migrated to Laravel)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Backend Integration

The app connects to two backends during migration:

- **Laravel API** (`src/lib/api.ts`) — Reports, Channel Manager, Billing, all CRUD
- **Supabase** (`src/integrations/supabase/`) — Legacy auth and edge functions (Demo Mode available)

## Project Structure

```
src/
├── components/          # 90+ components organized by module
├── hooks/               # 10 custom hooks (permissions, subscriptions, etc.)
├── integrations/supabase/ # Supabase client + types (legacy)
├── lib/                 # api.ts (Laravel client), utils
├── pages/               # 24 pages (lazy-loaded)
└── styles/              # Global CSS
```

## Scripts

```bash
npm run dev          # Start dev server (port 8080)
npm run build        # Production build
npm run test         # Unit tests (Vitest)
npm run test:e2e     # E2E tests (Playwright)
npm run lint         # ESLint
```

## Related

- **Backend:** [PMS_HOTEL_API](https://github.com/onick/PMS_HOTEL_API) — Laravel 12 REST API
