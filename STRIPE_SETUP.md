# Configuración de Stripe para HotelMate

Este documento explica cómo configurar Stripe para habilitar los pagos de suscripciones en HotelMate.

## ⚠️ Estado Actual

Actualmente, el modal de cambio de plan está implementado pero **necesita configuración de Stripe** para funcionar completamente.

## 📋 Requisitos Previos

1. Cuenta de Stripe (usa modo Test primero)
2. Acceso al Dashboard de Supabase
3. Acceso al Dashboard de Stripe

## 🔧 Pasos de Configuración

### 1. Crear Products y Prices en Stripe

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com/test/products)
2. Crea 3 productos (uno por cada plan):

#### Plan BASIC - $29/mes
- Nombre: "HotelMate Basic"
- Precio: $29.00 USD/mes
- Tipo: Recurrente (Monthly)
- Copia el **Price ID** (ej: `price_1234567890`)

#### Plan PRO - $79/mes
- Nombre: "HotelMate Pro"
- Precio: $79.00 USD/mes
- Tipo: Recurrente (Monthly)
- Copia el **Price ID**

#### Plan ENTERPRISE - $199/mes
- Nombre: "HotelMate Enterprise"
- Precio: $199.00 USD/mes
- Tipo: Recurrente (Monthly)
- Copia el **Price ID**

### 2. Configurar Variables de Entorno en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **Settings** → **Edge Functions** → **Secrets**
3. Agrega las siguientes variables:

```bash
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx  # Tu Stripe Secret Key (Test mode)
```

4. Para obtener tu Stripe Secret Key:
   - Ve a [Stripe API Keys](https://dashboard.stripe.com/test/apikeys)
   - Copia la "Secret key" (comienza con `sk_test_`)

### 3. Actualizar Price IDs en la Función

Edita el archivo `/supabase/functions/create-subscription-checkout/index.ts`:

```typescript
const PLAN_PRICE_IDS: Record<string, string> = {
  BASIC: "price_TU_PRICE_ID_BASIC",       // Reemplaza con tu Price ID
  PRO: "price_TU_PRICE_ID_PRO",           // Reemplaza con tu Price ID
  ENTERPRISE: "price_TU_PRICE_ID_ENTERPRISE", // Reemplaza con tu Price ID
};
```

### 4. Desplegar la Función a Supabase

```bash
# Asegúrate de tener Supabase CLI instalado
npm install -g supabase

# Login a Supabase
supabase login

# Link tu proyecto
supabase link --project-ref TU_PROJECT_REF

# Despliega la función
supabase functions deploy create-subscription-checkout
```

### 5. Configurar Webhook de Stripe

1. En Stripe Dashboard, ve a **Developers** → **Webhooks**
2. Clic en "Add endpoint"
3. URL del endpoint:
   ```
   https://TU_PROJECT_REF.supabase.co/functions/v1/stripe-subscription-webhook
   ```
4. Eventos a escuchar:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Copia el **Signing Secret** (comienza con `whsec_`)

6. Agrega el Signing Secret a Supabase Secrets:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

7. Despliega el webhook:
   ```bash
   supabase functions deploy stripe-subscription-webhook
   ```

## ✅ Verificación

### Probar el Modal

1. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Ve a `/dashboard/profile`

3. Haz clic en "Cambiar Plan" en la sección Membership

4. Deberías ver el modal con los 4 planes

5. Al hacer clic en "Cambiar a este plan":
   - ✅ Si funciona: Serás redirigido a Stripe Checkout
   - ❌ Si falla: Verás un mensaje de error indicando el problema

### Mensajes de Error Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "⚠️ Configuración de Stripe pendiente" | La función no está desplegada o no responde | Verifica paso 4 |
| "Invalid plan" | Price ID incorrecto | Verifica paso 3 |
| "No authorization header" | Problema de autenticación | Verifica que estés logueado |
| CORS error | Función no desplegada correctamente | Re-despliega la función |

## 🧪 Modo Test vs Production

### Modo Test (Desarrollo)
- Usa `sk_test_` keys
- Usa tarjetas de prueba: `4242 4242 4242 4242`
- No se hacen cargos reales

### Modo Production
1. Cambia `STRIPE_SECRET_KEY` a tu key de producción (`sk_live_`)
2. Actualiza los Price IDs con los de producción
3. Configura un nuevo webhook para producción
4. Verifica que todo funcione en test primero

## 📚 Recursos

- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Checkout](https://stripe.com/docs/checkout)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

## 🆘 Soporte

Si encuentras problemas:
1. Revisa los logs de Supabase Functions
2. Revisa los logs de Stripe Webhooks
3. Verifica que las variables de entorno estén correctas
4. Asegúrate de estar en modo test

## 🎯 Checklist de Implementación

- [ ] Cuenta de Stripe creada (modo test)
- [ ] 3 Products creados en Stripe
- [ ] 3 Prices creados (BASIC, PRO, ENTERPRISE)
- [ ] Price IDs copiados
- [ ] STRIPE_SECRET_KEY agregada a Supabase
- [ ] Price IDs actualizados en el código
- [ ] Función `create-subscription-checkout` desplegada
- [ ] Webhook configurado en Stripe
- [ ] STRIPE_WEBHOOK_SECRET agregada a Supabase
- [ ] Función `stripe-subscription-webhook` desplegada
- [ ] Modal probado en desarrollo
- [ ] Checkout de Stripe funcional
- [ ] Webhooks recibiendo eventos correctamente
