# HotelMate PMS — Contexto del Proyecto

## Qué es
HotelMate es un Property Management System (PMS) para hoteles. Frontend en React + TypeScript, backend en Laravel 12 + PHP 8.4. Estamos migrando de Supabase a Laravel API propia.

## Repos
- **Frontend**: Este repo (`hotelmate-core`) — React 18 + Vite + shadcn/ui + TanStack Query
- **Backend**: `../hotelmate-api` (o `github.com/onick/PMS_HOTEL_API`) — Laravel 12 + Sanctum + MySQL

## Arquitectura
- **API Client**: `src/lib/api.ts` — Singleton `api` con Bearer token (localStorage `api_token`)
- **Auth**: Laravel Sanctum tokens. Login devuelve token, se guarda en localStorage, se envía en cada request
- **Multi-tenancy**: Backend usa `BelongsToHotel` trait + middleware `hotel.tenant`. El hotel se deduce del token del usuario
- **Estado del servidor**: TanStack Query (useQuery/useMutation) para todo el data fetching
- **UI**: shadcn/ui + Tailwind CSS. Interfaz en español (labels, toasts, etc.)

## Estado de Migración Supabase → Laravel

### YA MIGRADO (usar `api.*` de `@/lib/api`):
- Dashboard Home + métricas (`useDashboardMetrics.ts`)
- Front Desk completo (arrivals, departures, in-house, room grid, walk-in)
- CRM (GuestsList, GuestDetails)
- Settings (Hotel, RoomTypes, Rooms, RatePlans, PromoCodes)
- Inventario (items + movimientos)
- NewReservationDialog
- Channel Manager (lista, mappings)
- Reports/Manager Dashboard

### PENDIENTE DE MIGRAR (aún usa `supabase` de `@/integrations/supabase/client`):
- **Auth/Login** (Auth.tsx, Dashboard.tsx layout) — PRIORIDAD ALTA
- **Sidebar/Permisos** (AppSidebar.tsx, usePermissions.ts)
- **Reservaciones lista** (ReservationsList, Calendar, Timeline, Details)
- **Billing/Folios** (ActiveFolios, FolioDetails, BillingStats, Transactions)
- **Analytics** (6 componentes)
- **Housekeeping** (7 componentes)
- **Tasks, Staff, Security, Subscriptions, Profile**

## Patrón de Migración
Cuando migres un componente de Supabase a Laravel:
1. Reemplazar `import { supabase } from "@/integrations/supabase/client"` por `import { api } from "@/lib/api"`
2. Reemplazar queries Supabase con métodos `api.*` (ver api.ts para lista completa)
3. Reemplazar edge functions con endpoints API
4. Eliminar `hotelId` prop si existía (la API lo deduce del token)
5. Actualizar field names: `customer.name` → `guest.full_name`, `check_in` → `check_in_date`, `room_number` → `number`, `room_types.name` → `room_type.name`, `folios[0]` → `folio`
6. Verificar con `npx tsc --noEmit` que no haya errores TypeScript

## Endpoints Laravel Disponibles
Ver `src/lib/api.ts` para la lista completa de métodos. Los principales:
- Auth: login, register, logout, me, switchHotel
- Hotel: getHotel, updateHotel, getHotelStats
- Rooms: getRooms (con filtros), getStatusGrid, markClean/Dirty/etc
- Reservations: CRUD, todayArrivals, todayDepartures, inHouse, checkIn, checkOut, walkIn
- Guests: CRUD, reservations, notes
- Folios: getFolio, postCharge, recordPayment, refundPayment
- Reports: dashboard, occupancy, adr, revpar, revenue, no-shows, payments
- Channels: CRUD, sync, mappings

## Convenciones
- Commits en inglés, UI en español
- Usar `useMutation` + `queryClient.invalidateQueries` para mutations
- Toasts con `sonner`: `toast.success()`, `toast.error()`
- Colores por módulo: `text-front-desk`, `bg-crm`, `bg-gradient-ocean`, etc.
- Ver `ROADMAP.md` para el plan detallado de fases pendientes
