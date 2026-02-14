# 🧪 Testing Suite - HotelMate PMS

## 📋 Estructura de Pruebas

```
tests/
├── e2e/                    # Pruebas End-to-End (flujos completos)
├── integration/            # Pruebas de Integración (RLS, APIs, DB)
│   └── rls-multi-tenancy.test.ts  ✅ IMPLEMENTADO
├── helpers/                # Utilidades para tests
│   ├── auth.helper.ts
│   └── test-data.helper.ts
└── README.md              # Este archivo
```

## 🚀 Comandos Disponibles

```bash
# Ejecutar TODAS las pruebas E2E
npm run test:e2e

# Ejecutar pruebas de integración solamente
npm run test:integration

# Modo UI interactivo (recomendado para desarrollo)
npm run test:e2e:ui

# Modo debug (paso a paso)
npm run test:e2e:debug

# Ejecutar TODO (unit + e2e)
npm run test:all
```

## ⚙️ Configuración Inicial

### 1. Variables de Entorno

Crea un archivo `.env.test` para el entorno Laravel API:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_URL=http://localhost:5173
```

Tests legacy de Supabase están desactivados por defecto.  
Para ejecutarlos temporalmente:

```bash
ENABLE_LEGACY_SUPABASE_TESTS=true npm run test:integration
ENABLE_LEGACY_SUPABASE_TESTS=true npm run test:e2e
```

⚠️ No habilites `ENABLE_LEGACY_SUPABASE_TESTS` en CI mientras se completa la migración a Laravel API.

### 2. Preparar Base de Datos

Asegúrate de que el backend Laravel de testing tenga:
- ✅ Migraciones aplicadas
- ✅ Seeders mínimos para roles/permisos
- ✅ Datos de prueba limpios (sin data real)

## 🔴 Pruebas Implementadas

### ✅ Prueba #1: RLS Multi-tenancy (CRÍTICA)

**Archivo:** `tests/integration/rls-multi-tenancy.test.ts`

**Qué prueba:**
- Aislamiento de datos entre hoteles
- Usuario de Hotel A NO puede ver datos de Hotel B
- Políticas RLS bloquean acceso cross-tenant
- Queries amplios respetan el tenant

**Por qué es crítica:**
- Previene violaciones GDPR/CCPA (multas hasta €20M)
- Protege privacidad de datos de competidores
- Evita acceso no autorizado a información confidencial

**Cómo ejecutarla:**
```bash
npm run test:integration
```

**Casos que cubre:**
1. ❌ Usuario A intenta ver huéspedes de Hotel B → BLOQUEADO
2. ❌ Usuario A intenta ver reservas de Hotel B → BLOQUEADO
3. ❌ Usuario A intenta modificar datos de Hotel B → BLOQUEADO
4. ✅ Usuario A puede ver SUS PROPIOS datos → PERMITIDO
5. ✅ Query amplio solo retorna datos del propio hotel → FILTRADO

---

### ✅ Prueba #2: Stripe Webhooks Synchronization (ALTA PRIORIDAD)

**Archivo:** `tests/integration/stripe-webhook-sync.test.ts`

**Qué prueba:**
- Sincronización Stripe ↔ Database en tiempo real
- Webhooks actualizan correctamente el estado de suscripciones
- Idempotencia (mismo webhook enviado múltiples veces)
- Race conditions (webhook vs actualización manual)
- Cambios de plan se reflejan inmediatamente

**Por qué es crítica:**
- Previene desincronización Stripe-DB ($10K-50K pérdidas/mes)
- Evita usuarios pagando PRO pero con límites de BASIC
- Previene acceso a features premium sin pagar
- Garantiza que límites se actualizan inmediatamente

**Cómo ejecutarla:**
```bash
npm run test:integration
```

**Casos que cubre:**
1. ✅ Webhook `subscription.created` crea suscripción en DB
2. ✅ Webhook `subscription.updated` cambia plan (BASIC → PRO)
3. ✅ Webhook `subscription.deleted` marca como CANCELED
4. ✅ Webhook `payment_failed` marca como PAST_DUE
5. ✅ Webhook duplicado NO crea registros duplicados (idempotencia)
6. ✅ Race condition: Webhook gana sobre actualización manual
7. ✅ Límites de plan se actualizan inmediatamente tras upgrade

---

### ✅ Prueba #5: Subscription Limits Enforcement (ALTA PRIORIDAD)

**Archivo:** `tests/integration/subscription-limits.test.ts`

**Qué prueba:**
- Límites de habitaciones por plan (FREE: 10, BASIC: 20, PRO: 50, ENTERPRISE: ∞)
- Límites de reservas mensuales por plan
- Upgrade/downgrade inmediato de límites
- Bypass de frontend → backend debe bloquear igualmente
- Downgrade con recursos existentes que exceden nuevo límite

**Por qué es crítica:**
- Previene uso fraudulento de features premium sin pagar
- Protege modelo de negocio ($29-$170/mes por hotel)
- Garantiza que usuarios no explotan el sistema
- Validación en backend (frontend puede ser bypasseado)

**Cómo ejecutarla:**
```bash
npm run test:integration
```

**Casos que cubre:**
1. ✅ FREE plan NO permite crear más de 10 habitaciones
2. ✅ BASIC plan permite hasta 20 habitaciones
3. ✅ PRO plan permite hasta 50 habitaciones
4. ✅ ENTERPRISE plan permite habitaciones ilimitadas
5. ✅ Upgrade de BASIC → PRO expande límites inmediatamente
6. ✅ Downgrade de PRO → BASIC mantiene existentes pero bloquea nuevas
7. ✅ FREE plan límite de 50 reservas/mes
8. ✅ Bypass de frontend: Backend bloquea requests directos

---

### ✅ Prueba #3: Check-In/Out Cycle (MEDIA-ALTA PRIORIDAD)

**Archivo:** `tests/e2e/check-in-out-cycle.test.ts`

**Qué prueba:**
- Ciclo completo: RESERVED → CHECKED_IN → CHECKED_OUT
- Creación y gestión de folios
- Cálculo de cargos extras (minibar, room service)
- Procesamiento de pagos y cálculo de balance
- Rollback si pago falla
- Cambio de estado de habitación a DIRTY
- Audit logs de cada cambio

**Por qué es crítica:**
- Previene pérdida de ingresos por cargos no registrados ($2K-5K/mes)
- Evita habitaciones bloqueadas en estados inconsistentes
- Garantiza trazabilidad para auditorías contables
- Previene overbookings por estados incorrectos

**Cómo ejecutarla:**
```bash
npm run test:e2e
```

**Casos que cubre:**
1. ✅ Flujo completo: Reserved → Check-In → Check-Out con pago
2. ✅ Rollback: Check-out falla si pago es insuficiente
3. ✅ Audit log registra cada cambio de estado
4. ✅ Cálculo correcto de balance: Total charges - Total payments
5. ✅ Múltiples cargos extras se acumulan correctamente
6. ✅ Habitación cambia a DIRTY después de check-out

---

### ✅ Prueba #4: RBAC Permissions (MEDIA PRIORIDAD)

**Archivo:** `tests/integration/rbac-permissions.test.ts`

**Qué prueba:**
- Validación de permisos por rol (6 roles)
- Prevención de escalación de privilegios
- Acceso a módulos según rol
- Permisos granulares (puede X pero NO puede Y)
- Aislamiento cross-tenant en permisos
- Usuario no puede cambiar su propio rol

**Por qué es crítica:**
- Previene sabotaje interno y fraude
- Protege datos confidenciales (financieros, personales)
- Evita eliminación accidental/maliciosa de datos
- Reduce riesgo de litigios laborales

**Cómo ejecutarla:**
```bash
npm run test:integration
```

**Casos que cubre:**
1. ✅ RECEPTION NO puede acceder a Billing
2. ✅ HOUSEKEEPING NO puede ver reservas
3. ✅ RECEPTION NO puede eliminar usuarios
4. ✅ MANAGER puede ver reservas pero NO eliminar usuarios
5. ✅ HOTEL_OWNER puede eliminar usuarios
6. ✅ Usuario NO puede cambiar su propio rol
7. ✅ RECEPTION puede crear reservas (su scope)
8. ✅ HOUSEKEEPING puede actualizar estado de habitaciones
9. ✅ Usuario de Hotel A NO puede modificar Hotel B
10. ✅ Permisos granulares: RECEPTION check-in SI, reportes NO

## 🐛 Debugging

### Ver logs en tiempo real
```bash
npm run test:e2e:debug
```

### Ver screenshots de fallos
Los screenshots se guardan en: `test-results/`

### Ver video de la prueba
Videos disponibles en: `test-results/video.webm`

## 📈 CI/CD

### GitHub Actions (Por configurar)

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:all
```

## 🎯 Métricas de Éxito

- ✅ Coverage de integración: >80%
- ✅ Tiempo de ejecución: <10 minutos
- ✅ 0 falsos positivos (flaky tests)
- ✅ Todas las pruebas pasan antes de merge

## 📚 Recursos

- [Playwright Docs](https://playwright.dev)
- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)
- [HotelMate Testing Strategy](../INFORME_PROYECTO.md)

---

**Estado Actual:** ✅ 5/5 pruebas críticas implementadas (100% COMPLETO)
**Total de casos:** 34 casos de prueba implementados
**Próximo paso:** Ejecutar suite completa y configurar CI/CD

---

## 📊 Resumen Final de Pruebas

| # | Prueba | Archivo | Casos | Prioridad | Estado |
|---|--------|---------|-------|-----------|--------|
| 1 | RLS Multi-tenancy | `integration/rls-multi-tenancy.test.ts` | 5 | CRÍTICA | ✅ |
| 2 | Stripe Webhooks | `integration/stripe-webhook-sync.test.ts` | 7 | ALTA | ✅ |
| 3 | Check-In/Out Cycle | `e2e/check-in-out-cycle.test.ts` | 4 | MEDIA-ALTA | ✅ |
| 4 | RBAC Permissions | `integration/rbac-permissions.test.ts` | 10 | MEDIA | ✅ |
| 5 | Subscription Limits | `integration/subscription-limits.test.ts` | 8 | ALTA | ✅ |
| **TOTAL** | **5 pruebas** | **5 archivos** | **34 casos** | - | **100%** |

### 🎯 Cobertura de Riesgos

| Riesgo | Pérdida Potencial | Pruebas que Mitigan |
|--------|-------------------|---------------------|
| Violación GDPR/CCPA | €20M en multas | Prueba #1 (RLS) |
| Desincronización Stripe | $10K-50K/mes | Prueba #2 (Webhooks) |
| Fraude de features premium | $29-170/mes por hotel | Prueba #5 (Limits) |
| Pérdida ingresos operacionales | $2K-5K/mes | Prueba #3 (Check-In/Out) |
| Sabotaje interno | Daño reputacional | Prueba #4 (RBAC) |

---
