# HOTELMATE PMS — ROADMAP DE MIGRACIÓN Y LANZAMIENTO
**Última actualización: 13 Feb 2026**

---

## ARQUITECTURA ACTUAL

| Capa | Tecnología | Estado |
|------|-----------|--------|
| Frontend | React 18 + TypeScript + Vite + shadcn/ui | Producción |
| Backend API | Laravel 12 + PHP 8.4 + Sanctum | Producción |
| Base de datos | MySQL 8 (via Laravel) | Producción |
| Auth legacy | Supabase Auth (en migración) | Temporal |
| Hosting frontend | Por definir (Vercel/Netlify) | Pendiente |
| Hosting backend | Por definir (Railway/Forge) | Pendiente |

**Repos:**
- Frontend: `github.com/onick/PMS_HOTEL` (branch: main)
- Backend: `github.com/onick/PMS_HOTEL_API` (branch: main)

---

## ESTADO DE MIGRACIÓN SUPABASE → LARAVEL API

### Módulos 100% Migrados a Laravel API
| Módulo | Archivos | Notas |
|--------|----------|-------|
| Dashboard Home | DashboardHome.tsx, useDashboardMetrics.ts | 4 endpoints en paralelo |
| Front Desk | FrontDesk, TodayArrivals, TodayDepartures, InHouseGuests, RoomStatusGrid, RoomStatus, WalkInDialog | Check-in/out, walk-in, status grid |
| CRM (Huéspedes) | GuestsList, GuestDetails | Lista, detalle, notas, VIP |
| Settings | HotelSettings, RoomTypesSettings, RoomsSettings, RatePlansSettings, PromoCodesSettings | CRUD completo |
| Inventario | Inventory page, InventoryMovementDialog | Items + movimientos de stock |
| Reservaciones (crear) | NewReservationDialog | Crea guest + reservation via API |
| Channel Manager | ChannelsList, ChannelMappingsDialog | Conexiones, mappings, sync |
| Reports | ManagerDashboard, ManagerReports (useReports hook) | KPIs, occupancy, ADR, RevPAR, revenue |

### Módulos Pendientes de Migrar (aún usan Supabase)

#### PRIORIDAD ALTA — Funcionalidad Core
| Módulo | Archivos | Dependencia Supabase | Endpoint Laravel |
|--------|----------|---------------------|-----------------|
| **Auth/Login** | Auth.tsx, Dashboard.tsx | supabase.auth.signIn/signUp, getUser | Crear: /auth/login, /auth/register (ya existen) — migrar UI |
| **Sidebar/Permisos** | AppSidebar.tsx, usePermissions.ts | user_roles, permissions, role_permissions | Crear: /auth/permissions endpoint |
| **Reservaciones (listar)** | ReservationsList, ReservationsCalendar, ReservationsTimeline, ReservationDetails | Queries directos a reservations table | Ya existe: /reservations con filtros |
| **Billing/Folios** | ActiveFolios, BillingStats, FolioDetails, RecentTransactions, PaymentMethods | Queries a folios, transactions | Ya existe: /folios/{id}, /folios/{id}/payments |

#### PRIORIDAD MEDIA — Reportes y Analytics
| Módulo | Archivos | Dependencia Supabase |
|--------|----------|---------------------|
| **Analytics** | AnalyticsMetrics, OccupancyChart, RevenueChart, RevenueByRoomType, RevenueByChannel, ChannelDistribution | Queries complejos con aggregates |
| **Reports page** | Reports.tsx | user_roles + rooms + reservations |
| **Revenue** | Revenue.tsx, CompetitorRates, RateCalendar, RevenueSettings | Queries directos |

#### PRIORIDAD BAJA — Módulos Secundarios
| Módulo | Archivos | Dependencia Supabase |
|--------|----------|---------------------|
| **Housekeeping** | 7 componentes | rooms status, incidents, checklists |
| **Tasks** | Tasks.tsx | CRUD tareas |
| **Staff** | Staff.tsx | user_roles, profiles |
| **Security** | 5 componentes | permisos, audit logs, GDPR |
| **Subscriptions** | 5 componentes | Stripe + Supabase |
| **Profile** | Profile.tsx | auth + subscription |

---

## PLAN DE TRABAJO — PRÓXIMAS SESIONES

### FASE 1: Migrar Auth Completo (Crítico)
**Objetivo:** Eliminar dependencia de Supabase Auth

- [ ] Migrar `Auth.tsx` para usar `api.login()` / `api.register()` (endpoints ya existen)
- [ ] Migrar `Dashboard.tsx` (layout) para obtener usuario de `api.me()` en vez de supabase.auth
- [ ] Migrar `AppSidebar.tsx` — reemplazar supabase user_roles con datos del token/API
- [ ] Crear endpoint `GET /auth/permissions` en Laravel que devuelva permisos del usuario
- [ ] Migrar `usePermissions.ts` hook a usar API
- [ ] Eliminar `supabase.auth` de todos los componentes

### FASE 2: Migrar Reservaciones Completas
**Objetivo:** ReservationsList, Calendar, Timeline, Details usando Laravel API

- [ ] Migrar `ReservationsList.tsx` → `api.getReservations()` (ya existe con filtros)
- [ ] Migrar `ReservationsCalendar.tsx` → crear endpoint calendar o usar getReservations con rango
- [ ] Migrar `ReservationsTimeline.tsx` → similar al calendar
- [ ] Migrar `ReservationDetails.tsx` → `api.getReservation(id)` (ya existe)
- [ ] Migrar `CRMStats.tsx` → crear endpoint o calcular desde datos existentes

### FASE 3: Migrar Billing/Folios
**Objetivo:** Folios, pagos, transacciones via Laravel API

- [ ] Migrar `FolioDetails.tsx` → `api.getFolio(id)`, `api.postCharge()`, `api.recordPayment()`
- [ ] Migrar `ActiveFolios.tsx` → crear endpoint `/folios?status=open`
- [ ] Migrar `BillingStats.tsx` → crear endpoint o agregar a dashboard
- [ ] Migrar `RecentTransactions.tsx` → endpoint de transacciones
- [ ] Migrar `PaymentMethods.tsx` → endpoint Stripe

### FASE 4: Migrar Analytics y Reports
**Objetivo:** Reportes completos desde Laravel API

- [ ] Migrar `Reports.tsx` → usa endpoints de /reports/ que ya existen
- [ ] Migrar analytics components → crear endpoints agregados o usar /reports/
- [ ] Migrar `Revenue.tsx` → /reports/revenue ya existe

### FASE 5: Migrar Módulos Secundarios
- [ ] Housekeeping (7 componentes)
- [ ] Tasks
- [ ] Staff management
- [ ] Security/Audit logs

### FASE 6: Eliminar Supabase
- [ ] Remover `@supabase/supabase-js` de dependencias
- [ ] Remover `src/integrations/supabase/` completo
- [ ] Remover variables VITE_SUPABASE_* de .env
- [ ] Actualizar documentación

---

## ESTADO DEL BACKEND LARAVEL (hotelmate-api)

### Endpoints Implementados y Funcionando
```
AUTH:     POST /login, /register, /logout, GET /me, PUT /me, POST /switch-hotel
HOTEL:    GET /hotel, PUT /hotel, GET /hotel/stats
ROOMS:    GET /rooms (filtros), POST /rooms, GET/PUT/DELETE /rooms/{id}
          GET /rooms/status-grid
          POST /rooms/{id}/mark-clean, mark-dirty, mark-inspecting, out-of-order, back-in-service
ROOM-TYPES: CRUD completo
RATE-PLANS: CRUD completo
PROMO-CODES: CRUD completo
GUESTS:   CRUD + GET /{id}/reservations, POST /{id}/notes
RESERVATIONS: CRUD + today-arrivals, today-departures, in-house
              POST /{id}/check-in, /{id}/check-out, /walk-in
              POST /reservation-units/{id}/check-in, /check-out
AVAILABILITY: POST /search, /quote
FOLIOS:   GET /{id}, /{id}/summary, POST /{id}/charges, /{id}/adjustments,
          DELETE /{id}/charges/{chargeId}, POST /{id}/post-room-charges
PAYMENTS: GET /folios/{id}/payments, POST /folios/{id}/payments
          GET /payments/{id}, POST /payments/{id}/refund
          GET /payments/by-reservation/{id}
NIGHT-AUDITS: GET, GET /{id}, POST /run
NOTIFICATIONS: GET, GET /unread-count, POST /{id}/read, POST /read-all
REPORTS:  GET /dashboard, /occupancy, /adr, /revpar, /revenue, /no-shows, /payments
CHANNELS: CRUD + sync, sync-inventory, sync-rates, pull-reservations, validate
          Room-type-mappings, rate-plan-mappings, outbox
INVENTORY: CRUD items + POST /{id}/movements
BOOKING:  GET /{slug}, POST /{slug}/search, /{slug}/quote, /{slug}/reserve
```

### Endpoints por Crear
```
GET  /auth/permissions          — Permisos del usuario actual
GET  /housekeeping/rooms        — Vista housekeeping de habitaciones
POST /housekeeping/incidents    — Reportar incidencia
GET  /tasks                     — CRUD tareas
GET  /staff                     — Lista de staff del hotel
GET  /audit-logs                — Logs de auditoría
```

---

## COMMITS RECIENTES (Migración)

```
7462e50 feat: migrate Front Desk & Reservations from Supabase to Laravel API
9a82fab feat: migrate Dashboard, GuestsList, GuestDetails from Supabase to Laravel API
e0e302b feat: migrate Settings + Inventory to Laravel API, fix UX issues
adc41b7 fix: security audit — remove .env from tracking, complete API client
```

---

## PARA CONTINUAR DESARROLLO

### Setup en nueva máquina:
```bash
# Frontend
git clone https://github.com/onick/PMS_HOTEL.git hotelmate-core
cd hotelmate-core
npm install
cp .env.example .env  # Configurar VITE_API_URL

# Backend
git clone https://github.com/onick/PMS_HOTEL_API.git hotelmate-api
cd hotelmate-api
composer install
cp .env.example .env  # Configurar DB, APP_KEY, etc.
php artisan key:generate
php artisan migrate --seed
php artisan serve  # http://localhost:8000

# Frontend dev server
cd ../hotelmate-core
npm run dev  # http://localhost:5173
```

### Variables de entorno clave:
```
# Frontend (.env)
VITE_API_URL=http://localhost:8000/api

# Backend (.env)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=hotelmate
DB_USERNAME=root
DB_PASSWORD=
```

---

**Progreso general migración Supabase → Laravel: ~35% de archivos migrados**
**Módulos core (Front Desk, Dashboard, Settings, CRM): 100% migrados**
**Siguiente prioridad: Auth + Reservaciones lista/detalle + Billing**
