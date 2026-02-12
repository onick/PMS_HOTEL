# 📊 Sentry Error Tracking - Setup Guide

**Status**: ✅ Módulo creado y probado  
**Implementation**: Día 3 - Noviembre 5, 2025

---

## 🎯 Overview

Sentry error tracking configurado para capturar y monitorear errores en:
- ✅ **Edge Functions** (Backend)
- ⏳ **Frontend** (React)
- ⏳ **Production Environment**

---

## 🔧 Configuration

### 1. Environment Variables

Agregar a tu `.env`:

```bash
# Backend Sentry (Edge Functions)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=development
SENTRY_RELEASE=1.0.0

# Frontend Sentry (Browser)
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### 2. Get Sentry DSN

1. Crear cuenta en [Sentry.io](https://sentry.io)
2. Crear nuevo proyecto: "hotelmate-edge-functions"
3. Copiar DSN from Settings → Projects → [Your Project] → Client Keys (DSN)
4. Pegar en `.env`

---

## 📦 Edge Functions Integration

### Módulo Compartido: `_shared/sentry.ts`

Funciones disponibles:

```typescript
import { captureError, captureMessage, isSentryConfigured } from '../_shared/sentry.ts';

// Capturar errores
await captureError(error, {
  functionName: 'create-payment-intent',
  userId: user.id,           // Optional
  hotelId: hotel.id,         // Optional
  requestId: requestId,      // Optional
  extra: {
    customData: 'value',     // Optional
  },
});

// Capturar mensajes (warnings, info)
await captureMessage('Payment processed successfully', 'info', {
  functionName: 'confirm-payment',
  extra: { amount: 100.00 },
});

// Verificar si Sentry está configurado
if (isSentryConfigured()) {
  console.log('✅ Sentry enabled');
}
```

### Patrón de Integración

**Ejemplo completo** (`create-payment-intent`):

```typescript
// 1. Importar módulo
import { captureError, isSentryConfigured } from '../_shared/sentry.ts';

// 2. Log status on startup (optional)
if (isSentryConfigured()) {
  console.log('✅ Sentry error tracking enabled');
} else {
  console.log('⚠️ Sentry not configured');
}

// 3. Capturar errores en catch block
serve(async (req) => {
  try {
    // ...lógica de la función...
  } catch (error) {
    console.error('❌ Error:', error);

    // Capturar en Sentry (skip validation errors)
    if (!error.message.includes('Validation failed')) {
      await captureError(error, {
        functionName: 'your-function-name',
        extra: {
          origin: req.headers.get('origin'),
          method: req.method,
        },
      });
    }

    return createCorsResponse({ error: error.message }, 500, origin);
  }
});
```

---

## 🎨 Best Practices

### 1. ¿Qué capturar?

✅ **SÍ capturar:**
- Server errors (500)
- Database errors
- External API failures (Stripe, Resend)
- Unhandled exceptions
- Business logic failures

❌ **NO capturar:**
- Validation errors (400) - son errores del usuario
- Authentication failures (401) - comportamiento esperado
- Not found errors (404) - comportamiento esperado
- Rate limit errors (429) - comportamiento esperado

### 2. Context es clave

Siempre incluir contexto útil:

```typescript
await captureError(error, {
  functionName: 'create-reservation',
  hotelId: reservation.hotel_id,      // Para filtrar por hotel
  userId: user?.id,                   // Para identificar usuario
  extra: {
    reservationId: reservation.id,
    checkIn: reservation.check_in,
    roomTypeId: reservation.room_type_id,
    paymentIntent: paymentIntentId,
  },
});
```

### 3. Log primero, capture después

```typescript
catch (error) {
  // 1. Log local (siempre)
  console.error('❌ Payment failed:', error);

  // 2. Capture remote (Sentry)
  await captureError(error, { ... });

  // 3. Return error response
  return createCorsResponse({ error }, 500, origin);
}
```

---

## 📋 Checklist de Implementación

Para agregar Sentry a una Edge Function:

- [ ] Import `captureError` from `_shared/sentry.ts`
- [ ] (Optional) Log Sentry status on startup
- [ ] Agregar `await captureError()` en catch blocks
- [ ] Incluir context (functionName, hotelId, etc.)
- [ ] Skip validation errors (400)
- [ ] Test locally (verify logs)
- [ ] Deploy y verificar en Sentry dashboard

---

## 🚀 Functions Status

### Integradas con Sentry (1/16):
- ✅ `create-payment-intent`

### Pendientes (15/16):
- ⏳ confirm-payment
- ⏳ stripe-subscription-webhook
- ⏳ create-subscription-checkout
- ⏳ create-customer-portal
- ⏳ ensure-subscription
- ⏳ reset-subscription
- ⏳ create-reservation
- ⏳ confirm-reservation-payment
- ⏳ check-in
- ⏳ check-out
- ⏳ get-payment-history
- ⏳ get-payment-method
- ⏳ send-email
- ⏳ send-reservation-confirmation
- ⏳ send-staff-invitation

**Nota**: Las funciones funcionan perfectamente SIN Sentry. La integración es opcional y no afecta la funcionalidad si no está configurada.

---

## 🔍 Monitoring

### Sentry Dashboard

Una vez configurado:
1. Ver errores en tiempo real: https://sentry.io/organizations/[org]/issues/
2. Filtrar por:
   - Function name (tag)
   - Hotel ID (context)
   - Environment (development/staging/production)
   - Time range
3. Ver stack traces completos
4. Ver request context

### Key Metrics

Track en Sentry:
- Error rate por función
- Most common errors
- Error distribution por hotel
- Performance impact
- User impact

---

## 🧪 Testing Sentry

### Local Testing

```bash
# 1. Set Sentry DSN in .env
SENTRY_DSN=https://your-key@sentry.io/project-id

# 2. Trigger an error in your function
# Example: Invalid Stripe key

# 3. Check Sentry dashboard for captured error
```

### Test Checklist:
- [ ] Error appears in Sentry dashboard
- [ ] Stack trace is readable
- [ ] Tags are set correctly (function_name, environment)
- [ ] Context is complete (hotel_id, user_id)
- [ ] Extra data is useful
- [ ] Error grouping works (same errors grouped)

---

## 📊 Expected ROI

### Time Investment:
```
Setup inicial:          0.5 horas
Integration (16 funcs): 1.0 horas
Testing:               0.5 horas
──────────────────────────────────
TOTAL:                 2.0 horas
```

### Benefits:
```
✅ Real-time error alerts
✅ Stack traces para debugging rápido
✅ Context de cada error
✅ Error trends y patterns
✅ User impact tracking
✅ Faster incident response
✅ Better customer support
```

### Estimated Savings:
```
Debugging time saved:      ~10 horas/mes
Incident response:         ~5 horas/mes
Customer support:          ~3 horas/mes
──────────────────────────────────
TOTAL SAVINGS:            ~18 horas/mes
```

**ROI**: 2 horas inversión → 18 horas/mes ahorradas = 900% ROI

---

## 🔗 Resources

- [Sentry Docs](https://docs.sentry.io/)
- [Sentry HTTP API](https://develop.sentry.dev/sdk/event-payloads/)
- [Edge Functions Monitoring](https://supabase.com/docs/guides/functions/monitoring)
- [Sentry Best Practices](https://docs.sentry.io/platforms/javascript/best-practices/)

---

## 🎬 Next Steps

1. **Setup Sentry Account**
   - Crear proyecto en Sentry.io
   - Copiar DSN
   - Agregar a `.env`

2. **Apply to All Functions** (Optional)
   - Seguir patrón de `create-payment-intent`
   - Agregar context relevante
   - Test cada función

3. **Frontend Integration** (Pending)
   - Install `@sentry/react`
   - Configure en `main.tsx`
   - Add error boundaries

4. **Production Monitoring**
   - Setup alerts (Slack, email)
   - Configure error thresholds
   - Create dashboard

---

**Prepared by**: AI Architect Agent  
**Last Updated**: November 5, 2025  
**Version**: 1.0.0

🎯 **Sentry is optional but highly recommended for production!**
