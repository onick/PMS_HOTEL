# HotelMate PMS - Laravel Backend Architecture Design

**Date:** 2026-02-12
**Status:** Approved
**Migration:** Supabase Edge Functions → Laravel 11 + MySQL

---

## Stack

- **Laravel 11** + PHP 8.3
- **MySQL 8** on Hostinger VPS
- **Redis** for cache, sessions, queues
- **Laravel Sanctum** for API auth
- **Laravel Horizon** for queue monitoring
- **Stripe SDK** for payments & subscriptions
- **Resend** for transactional emails

## Repository

- Separate repo: `hotelmate-api`
- Frontend (React) stays in `hotelmate-core`, consumes REST API
- Communication: REST API with JSON responses

---

## Models & Relationships

### Hotel & Rooms

```
Hotel
├── hasMany: Room, RoomType, RatePlan, PromoCode
├── hasMany: Reservation, Guest, Folio
├── hasMany: User (through user_roles)
├── hasOne: Subscription
└── hasMany: ChannelConnection, Notification, AuditLog

RoomType
├── belongsTo: Hotel
├── hasMany: Room, InventoryByDay, RateByDay
└── hasMany: ReservationUnit

Room
├── belongsTo: Hotel, RoomType
├── occupancy_status enum: VACANT, OCCUPIED, BLOCKED
├── housekeeping_status enum: CLEAN, DIRTY, INSPECTING, OUT_OF_ORDER
├── hasMany: RoomLock, Incident, Task
└── scope: available() → VACANT + CLEAN
```

### Reservations (multi-room)

```
Reservation
├── belongsTo: Hotel, Guest
├── hasMany: ReservationUnit (1 reserva = N habitaciones)
├── hasOne: Folio
├── hasMany: Payment
├── source enum: DIRECT, BOOKING, EXPEDIA, AIRBNB, WALKIN, PHONE
├── external_reservation_id: string (nullable, OTA conciliation)
├── cancellation_policy_snapshot: JSON
└── status enum: PENDING_PAYMENT, CONFIRMED, CANCELLED, NO_SHOW, CHECKED_IN, CHECKED_OUT

ReservationUnit
├── belongsTo: Reservation, RoomType, Room (nullable), RatePlan
├── adults, children, infants
├── price_breakdown: JSON {nightly_rates: [{date, amount}], subtotal, taxes, fees}
└── room_id assigned at check-in (supports room moves)
```

### Rate & Pricing

```
RatePlan
├── belongsTo: Hotel
├── hasMany: ReservationUnit, RateByDay
├── hasOne: CancellationPolicy

RateByDay
├── belongsTo: Hotel, RoomType, RatePlan
├── date, amount_cents, currency
└── unique: [hotel_id, room_type_id, rate_plan_id, date]

CancellationPolicy
├── belongsTo: RatePlan (or PromoCode)
├── type enum: FREE, NON_REFUNDABLE, PARTIAL
├── deadline_hours, penalty_percent, penalty_fixed_cents
└── no_show_charge_percent
```

### Payments (multi-provider)

```
Payment
├── belongsTo: Hotel, Reservation, Folio
├── provider enum: STRIPE, CASH, CARD_TERMINAL, TRANSFER, MANUAL
├── amount_cents, currency, status
├── hasOne: PaymentProviderDetail
└── processed_by: User

Refund
├── belongsTo: Payment, Folio
├── provider_refund_id (nullable)
├── reason enum: DUPLICATE, FRAUDULENT, CUSTOMER_REQUEST, CANCELLATION, OTHER
└── processed_by: User

CashierShift
├── belongsTo: Hotel, User (opened_by), User (closed_by)
├── opened_at, closed_at
├── opening_balance_cents, closing_balance_cents
└── summary: JSON {cash: X, card: Y, transfer: Z, difference: D}
```

### Guests

```
Guest
├── belongsTo: Hotel
├── hasMany: Reservation, GuestNote
└── computed: total_spent_cents, total_stays
```

### Staff & Permissions

```
User (extends Authenticatable)
├── belongsToMany: Hotel (through user_roles with role column)
├── hasMany: UserPermission
└── methods: hasRole(), hasPermission(), canAccessModule()

Role enum: SUPER_ADMIN, HOTEL_OWNER, MANAGER, RECEPTION, HOUSEKEEPING, SALES
```

### Subscriptions

```
Subscription
├── belongsTo: Hotel
├── plan enum: FREE, BASIC, PRO, ENTERPRISE
├── status enum: TRIAL, ACTIVE, PAST_DUE, CANCELED
├── stripe_customer_id, stripe_subscription_id
└── trial_ends_at, current_period_start/end
```

---

## API Endpoints

### Auth
```
POST   /api/auth/register           Create hotel + owner
POST   /api/auth/login              Sanctum token
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/me
PUT    /api/auth/me
```

### Hotels
```
GET    /api/hotels/{hotel}
PUT    /api/hotels/{hotel}
GET    /api/hotels/{hotel}/stats
```

### Room Types & Rooms
```
CRUD   /api/room-types
CRUD   /api/rooms
PATCH  /api/rooms/{room}/status
GET    /api/rooms/status-grid
POST   /api/rooms/{room}/mark-clean
POST   /api/rooms/{room}/mark-dirty
POST   /api/rooms/{room}/out-of-order
POST   /api/rooms/{room}/back-in-service
```

### Availability & Quoting
```
POST   /api/availability/search
POST   /api/availability/quote
```

### Reservations
```
CRUD   /api/reservations
POST   /api/reservations/{res}/cancel
POST   /api/reservations/{res}/check-in      (all units shortcut)
POST   /api/reservations/{res}/check-out     (all units shortcut)
POST   /api/reservations/{res}/walk-in
POST   /api/reservations/{res}/extend
POST   /api/reservations/{res}/change-dates
POST   /api/reservations/{res}/change-room-type
GET    /api/reservations/today-arrivals
GET    /api/reservations/today-departures
GET    /api/reservations/in-house
```

### Reservation Units
```
POST   /api/reservation-units/{unit}/assign-room
POST   /api/reservation-units/{unit}/move-room
DELETE /api/reservation-units/{unit}/unassign-room
POST   /api/reservation-units/{unit}/check-in
POST   /api/reservation-units/{unit}/check-out
```

### Guests
```
CRUD   /api/guests
GET    /api/guests/{guest}/reservations
POST   /api/guests/{guest}/notes
```

### Billing & Payments
```
GET    /api/folios
GET    /api/folios/{folio}
POST   /api/folios/{folio}/charges
POST   /api/folios/{folio}/payments
POST   /api/payments/stripe/intent
POST   /api/payments/stripe/confirm
GET    /api/payments/history
GET    /api/payments/reconciliation
POST   /api/refunds
```

### Cashier
```
POST   /api/cashier-shifts/open
POST   /api/cashier-shifts/{id}/close
GET    /api/cashier-shifts/{id}/summary
```

### Night Audit
```
POST   /api/night-audit/run
GET    /api/night-audit/history
```

### Subscriptions
```
POST   /api/subscription/checkout
GET    /api/subscription
POST   /api/subscription/reset
POST   /api/subscription/portal
```

### Staff
```
GET    /api/staff
POST   /api/staff/invite
POST   /api/staff/invitations/{token}/accept
PUT    /api/staff/{user}/role
DELETE /api/staff/{user}
```

### Operations
```
GET    /api/housekeeping/dashboard
CRUD   /api/housekeeping/checklists
CRUD   /api/tasks
CRUD   /api/incidents
```

### Inventory & Rates
```
GET    /api/inventory
PUT    /api/inventory/bulk
CRUD   /api/rate-plans
GET    /api/rates/calendar
PUT    /api/rates/bulk
CRUD   /api/promo-codes
```

### Webhooks (no auth, signature verification)
```
POST   /webhooks/stripe
```

---

## Services (Business Logic)

```
QuoteReservation        Search availability, calculate price, return without committing
CreateReservation       Quote + holds + folio + price snapshot
ModifyReservation       Change dates/room type, recalculate, adjust folio
ProcessCheckIn          Per unit: assign room, lock, change status
ProcessCheckOut         Per unit: validate balance, release room, mark dirty
ProcessRoomMove         Release room A, assign room B, update locks
ProcessWalkIn           Quote + Create + Confirm + CheckIn (all-in-one)
CancelReservation       Apply CancellationPolicy, release inventory, refund if applicable
RunNightAudit           Close day, freeze metrics, mark no-shows, generate report
ManageCashierShift      Open/close shift, reconcile by payment method
ProcessPayment          Handle Stripe/cash/card, register in folio
IssueRefund             Validate amount, Stripe refund if applicable, update folio
CalculateDynamicRate    Occupancy + competition → optimal price
SyncChannelInventory    Push inventory to OTAs
ManageSubscription      Stripe checkout, plan changes, portal
```

## Jobs (Background Queues)

```
SendReservationConfirmation   Email with reservation details
SendStaffInvitation           Email with invitation link
ProcessStripeWebhook          Process Stripe events async
NotifyUpcomingArrivals        Scheduled: daily 7am
NotifyUpcomingDepartures      Scheduled: daily 7am
CheckNoShows                  Scheduled: 2pm
ExpireInventoryHolds          Scheduled: every 5 min
RunNightAudit                 Scheduled: 2am
GenerateDailyReport           Scheduled: nightly
SyncOTAInventory              Scheduled: every 15 min
```

## Middleware Stack

```
1. ForceJsonResponse         All responses are JSON
2. Authenticate (Sanctum)    Validate token/session
3. ResolveHotelTenant        Extract hotel_id from user, set on request
4. EnsureSubscriptionActive  Block if subscription expired/canceled
5. CheckModulePermission     Validate role + permission per route
6. AuditLog                  Record action on POST/PUT/PATCH/DELETE
7. RateLimiter               Per IP + per user
```

## Multi-tenancy

Global Scope on all hotel-scoped models:
```php
class HotelScope implements Scope {
    public function apply(Builder $builder, Model $model) {
        $builder->where('hotel_id', auth()->user()->current_hotel_id);
    }
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- Laravel 11 fresh install
- MySQL schema: ~35 core table migrations
- Eloquent models with relations, enums, casts
- Sanctum auth (register hotel+owner, login, logout)
- Middleware: tenant scope, force JSON
- Seeders: roles, permissions, demo hotel
- Tests: auth flow, model relationships

### Phase 2: Core PMS (Week 3-4)
- CRUD: Hotels, RoomTypes, Rooms, Guests, RatePlans
- Availability search + Quote service
- CreateReservation service (with inventory holds)
- Folio + FolioCharges
- API Resources for each model
- Authorization Policies
- Tests: availability, reservation creation, folio

### Phase 3: Operations (Week 5-6)
- Check-in / Check-out (per unit and per reservation)
- Walk-in full flow
- Room moves + assign/unassign
- Extend stay / Change dates / Change room type
- Housekeeping actions
- Front Desk endpoints (arrivals, departures, in-house)
- Tests: full check-in/out cycle, room moves

### Phase 4: Payments (Week 7-8)
- Payment model (multi-provider)
- Stripe integration (intents, confirm, webhooks)
- Refunds with cancellation policy
- Cashier shifts (open, close, reconciliation)
- Subscription management
- Tests: payment flow, refund, webhook idempotency

### Phase 5: Automation (Week 9)
- Night Audit job
- Expire holds job
- Email notifications
- Scheduled jobs
- Horizon setup
- Tests: jobs, scheduled tasks

### Phase 6: Security & Polish (Week 10)
- Staff invitations
- Role/permission management API
- Audit logs
- GDPR compliance
- Rate limiting
- API documentation
- Integration tests E2E

### Phase 7: Frontend Migration (Week 11-12)
- Replace all Supabase fetch() → Laravel API
- Replace Supabase auth → Sanctum
- Remove Supabase client
- Full frontend + backend testing
- Deploy to Hostinger
