# ¿Por qué migrar de Supabase a Laravel?

**Fecha:** 2026-02-12  
**Autor:** Marcelino Francisco Martinez  
**Proyecto:** HotelMate PMS  
**Estado:** Decisión aprobada — Migración en curso

---

## Contexto

La intención de migrar de Supabase → Laravel en HotelMate PMS es pasar de un backend "rápido para arrancar" a un backend PMS/SaaS de producción, donde se controlan reglas, seguridad y operaciones del hotel de forma robusta.

---

## 1) Un PMS real necesita lógica de negocio centralizada

Con Supabase (Edge Functions + DB + RLS) puedes hacer mucho, pero cuando el PMS crece aparecen reglas difíciles de mantener repartidas entre:

- SQL/RLS en la base
- Edge Functions por endpoint
- Lógica duplicada en el frontend

**Laravel permite tener toda la lógica del PMS en un solo lugar:**

- Disponibilidad
- Holds de inventario
- Políticas de cancelación
- Check-in/out
- Room moves
- Folios, cargos, pagos, refunds
- Night audit, no-shows

> **Resultado:** Reduce errores y hace el sistema más "predecible".

---

## 2) Multi-tenancy y permisos más controlables

Supabase usa RLS (Row Level Security). Funciona, pero cuando necesitas:

- Permisos por módulo
- Overrides por usuario
- Reglas por rol + hotel + suscripción
- Auditoría detallada

**Laravel lo maneja mejor con:**

- Middleware + Policies
- Roles/permisos granulares
- Scopes por hotel
- Logs de auditoría consistentes

### Implementación actual en Laravel:

| Middleware | Función |
|------------|---------|
| `ResolveHotelTenant` | Valida acceso al hotel activo del usuario |
| `EnsureSubscriptionActive` | Bloquea si la suscripción/trial expira (HTTP 402) |
| `CheckModulePermission` | Permisos granulares `permission:module.action` |

**Arquitectura de permisos (4 capas):**

```
1. SUPER_ADMIN     → bypass total
2. HOTEL_OWNER     → acceso completo a su hotel
3. UserPermission  → override explícito (grant/revoke por usuario)
4. RolePermission  → default del rol (Manager, Reception, Housekeeping, Sales)
```

---

## 3) Operaciones asíncronas y automatización (clave en hoteles)

Un hotel no vive solo de requests HTTP. Necesita procesos "en background":

| Proceso | Frecuencia | Descripción |
|---------|------------|-------------|
| Expirar holds | Cada 5 min | Liberar inventario de reservas no confirmadas |
| Enviar emails | On-demand | Confirmaciones, invitaciones staff |
| Procesar webhooks Stripe | Async | Sin bloquear el request principal |
| Night audit | 2:00am diario | Cerrar día, no-shows, room charges, KPI snapshot |
| Alertas arrivals/departures | 7:00am diario | Notificaciones al equipo |
| OTA inventory sync | Cada 15 min | Push disponibilidad a Booking/Expedia |

**Supabase** no da esto de forma nativa (se puede, pero se vuelve artesanal).

**Laravel + Redis + Horizon + Scheduler** está hecho para esto:

```php
// app/Console/Kernel.php
$schedule->command('audit:run-nightly')->dailyAt('02:00');
$schedule->command('holds:expire')->everyFiveMinutes();
$schedule->command('notifications:daily-arrivals')->dailyAt('07:00');
$schedule->command('channels:sync-inventory')->everyFifteenMinutes();
```

---

## 4) Billing y caja: el corazón del PMS

Para un PMS, billing no es solo "Stripe paga y ya". Necesitas:

| Funcionalidad | Supabase | Laravel |
|---------------|----------|---------|
| Folios con cargos itemizados | Edge Function | `FolioService` con transacciones DB |
| Pagos multi-método (cash, terminal, transfer, Stripe) | Parcial (solo Stripe) | ✅ 5 providers con `PaymentService` |
| Refunds parciales con validación | Edge Function | ✅ `PaymentService::refund()` con max validation |
| Cuadre de caja (cashier shifts) | No | ✅ Modelo `CashierShift` con apertura/cierre |
| Night charges automáticos | No | ✅ `FolioService::postRoomCharges()` |
| Auditoría de pagos | Parcial | ✅ `Folio::recalculateBalance()` + audit logs |

### Ejemplo de flujo verificado:

```
CHARGES:
  ROOM Unit #1  $2,500 × 1 noche  = $2,500
  ROOM Unit #2  $1,400 × 1 noche  = $1,400
  TAX (IVA+ISH)                    =   $534
  MINIBAR (cargo extra)            =   $200
  ────────────────────────────────────────
  Total Charges                    = $4,634

PAYMENTS:
  CASH    $2,000 → SUCCEEDED
  CARD    $1,634 → SUCCEEDED
  STRIPE  $1,000 → PENDING → SUCCEEDED (webhook)
  ────────────────────────────────────────
  Total Payments                   = $4,634

REFUND:
  STRIPE -$200 (REQUESTED_BY_CUSTOMER)
  ────────────────────────────────────────
  Net Balance = $200 (owed by guest)
```

---

## 5) Menos dependencia de un proveedor en el core

### Con Supabase, el core depende de:
- ❌ Su auth (Supabase Auth)
- ❌ Su DB (Supabase Postgres managed)
- ❌ Su runtime de edge (Deno Edge Functions)
- ❌ Su forma de hacer RLS

### Con Laravel:
- ✅ Backend **portable**: Hostinger, DigitalOcean, AWS, donde sea
- ✅ Si mañana cambias de proveedor, tu PMS no se rompe
- ✅ Auth propia con Sanctum (tokens + sessions)
- ✅ DB portable (MySQL, PostgreSQL, SQLite)
- ✅ Cache/Queues portable (Redis, SQS, database driver)

---

## 6) Escalabilidad real en equipo y mantenimiento

Cuando el proyecto crece (más endpoints, más dominios, más bugs edge-case):

| Aspecto | Supabase | Laravel |
|---------|----------|---------|
| Arquitectura por dominios | Edge Functions individuales | Services + Controllers + Requests |
| Tests feature/unit | Limitado | PHPUnit + Pest + Feature tests |
| Migraciones controladas | SQL raw | Schema Builder con rollback |
| Versionado de API | Manual | Route groups con prefijos |
| Code review y CI/CD | Posible | Nativo con Pint, Pail, CI pipelines |
| Onboarding de devs | "Lee las Edge Functions" | Swagger/OpenAPI + Resource docs |

> **Esto es lo que permite mantener el PMS por años.**

---

## Resumen

> **Migrar de Supabase a Laravel para que el PMS deje de ser un conjunto de funciones y reglas dispersas, y se convierta en un backend centralizado, auditable, automatizable y escalable, con control total del negocio hotelero.**

---

## Arquitectura objetivo

```
┌─────────────────────────────────────────────────┐
│                  FRONTEND                        │
│  React 18 + Vite + TypeScript + shadcn-ui        │
│  API Client Layer (src/lib/api.ts)               │
└────────────────────┬────────────────────────────┘
                     │ REST API (JSON + Sanctum)
                     ▼
┌─────────────────────────────────────────────────┐
│              LARAVEL BACKEND                     │
│                                                  │
│  ┌─────────┐  ┌──────────┐  ┌────────────────┐ │
│  │ Auth    │  │ Services │  │ Controllers    │ │
│  │ Sanctum │  │ (8 svc)  │  │ (11 ctrl)      │ │
│  └─────────┘  └──────────┘  └────────────────┘ │
│                                                  │
│  ┌─────────┐  ┌──────────┐  ┌────────────────┐ │
│  │ Models  │  │ Enums    │  │ Middleware     │ │
│  │ (43)    │  │ (17)     │  │ (4 custom)     │ │
│  └─────────┘  └──────────┘  └────────────────┘ │
│                                                  │
│  ┌─────────┐  ┌──────────┐  ┌────────────────┐ │
│  │ Queues  │  │ Schedule │  │ Webhooks       │ │
│  │ Horizon │  │ (cron)   │  │ (Stripe async) │ │
│  └─────────┘  └──────────┘  └────────────────┘ │
└────────────────────┬────────────────────────────┘
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
     ┌────────┐ ┌────────┐ ┌────────┐
     │ MySQL  │ │ Redis  │ │ Stripe │
     │ (data) │ │(queue) │ │(pay)   │
     └────────┘ └────────┘ └────────┘
```

---

*Documento parte del ADR (Architecture Decision Record) del proyecto HotelMate PMS.*
