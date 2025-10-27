# 🚀 Configuración Rápida de Stripe

Sigue estos pasos EN ORDEN. No te saltes ninguno.

## ✅ CHECKLIST DE PROGRESO

Marca cada paso cuando lo completes:

---

## 📝 PASO 1: Supabase CLI Login

```bash
supabase login
```

- [ ] Ejecutado
- [ ] Navegador se abrió
- [ ] Autenticación completada
- [ ] Comando `supabase projects list` funciona

---

## 🔗 PASO 2: Link del Proyecto

Encuentra tu Project Reference ID:
1. Ve a https://app.supabase.com
2. Abre tu proyecto
3. Ve a Settings → General
4. Copia el "Reference ID" (ejemplo: `yvlesrmoeblodnhpmizx`)

```bash
supabase link --project-ref TU_PROJECT_REF_AQUI
```

Reemplaza `TU_PROJECT_REF_AQUI` con tu Reference ID real.

- [ ] Project Reference ID copiado
- [ ] Comando ejecutado
- [ ] Link exitoso

---

## 💳 PASO 3: Crear Cuenta de Stripe

### 3.1 Crear/Login a Stripe

1. Ve a https://dashboard.stripe.com/register
2. Crea una cuenta O haz login
3. **IMPORTANTE:** Usa el **modo TEST** (toggle en la esquina superior derecha)

- [ ] Cuenta creada/login completado
- [ ] Modo TEST activado (debe decir "Test mode" arriba)

### 3.2 Obtener Secret Key

1. Ve a https://dashboard.stripe.com/test/apikeys
2. Busca "Secret key"
3. Haz clic en "Reveal test key"
4. Copia la key (comienza con `sk_test_`)

```
Tu Stripe Secret Key: sk_test_____________________________
```

- [ ] Secret Key copiada
- [ ] Guardada en un lugar seguro (la necesitarás pronto)

---

## 🏷️ PASO 4: Crear Productos en Stripe

### 4.1 Crear Producto BASIC

1. Ve a https://dashboard.stripe.com/test/products
2. Clic en "+ Add product"
3. Completa:
   - **Name:** HotelMate Basic
   - **Description:** Plan básico para hoteles pequeños
   - **Pricing:** Recurring
   - **Price:** $29.00 USD
   - **Billing period:** Monthly
4. Clic en "Save product"
5. **IMPORTANTE:** Copia el **Price ID** (comienza con `price_`)

```
BASIC Price ID: price_____________________________
```

- [ ] Producto creado
- [ ] Price ID copiado

### 4.2 Crear Producto PRO

1. Clic en "+ Add product" nuevamente
2. Completa:
   - **Name:** HotelMate Pro
   - **Description:** Plan profesional para hoteles en crecimiento
   - **Pricing:** Recurring
   - **Price:** $79.00 USD
   - **Billing period:** Monthly
3. Clic en "Save product"
4. Copia el **Price ID**

```
PRO Price ID: price_____________________________
```

- [ ] Producto creado
- [ ] Price ID copiado

### 4.3 Crear Producto ENTERPRISE

1. Clic en "+ Add product" nuevamente
2. Completa:
   - **Name:** HotelMate Enterprise
   - **Description:** Plan enterprise para cadenas hoteleras
   - **Pricing:** Recurring
   - **Price:** $199.00 USD
   - **Billing period:** Monthly
3. Clic en "Save product"
4. Copia el **Price ID**

```
ENTERPRISE Price ID: price_____________________________
```

- [ ] Producto creado
- [ ] Price ID copiado

---

## 🔐 PASO 5: Configurar Secrets en Supabase

### Opción A: Vía Dashboard (MÁS FÁCIL)

1. Ve a https://app.supabase.com/project/TU_PROJECT_REF/settings/functions
2. Scroll hasta "Secrets"
3. Clic en "Add new secret"
4. Agrega:
   - **Name:** `STRIPE_SECRET_KEY`
   - **Value:** Tu Secret Key de Stripe (de paso 3.2)
5. Clic en "Create secret"

### Opción B: Vía CLI

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_TU_KEY_AQUI
```

- [ ] Secret configurado en Supabase

---

## 📝 PASO 6: Actualizar Price IDs en el Código

**YO LO HARÉ POR TI** - Solo dame los 3 Price IDs que copiaste en el paso 4:

```
BASIC Price ID: _________________________________
PRO Price ID: ___________________________________
ENTERPRISE Price ID: ____________________________
```

Pégalos aquí en el chat y yo actualizaré el código automáticamente.

- [ ] Price IDs proporcionados a Claude

---

## 🚀 PASO 7: Desplegar Functions

**YO LO HARÉ POR TI** - Una vez que confirmes los pasos anteriores.

```bash
# Desplegaré estas funciones:
supabase functions deploy create-subscription-checkout
supabase functions deploy stripe-subscription-webhook
supabase functions deploy create-customer-portal
supabase functions deploy get-payment-method
supabase functions deploy get-payment-history
```

- [ ] Functions desplegadas

---

## 🔔 PASO 8: Configurar Webhook

1. Ve a https://dashboard.stripe.com/test/webhooks
2. Clic en "+ Add endpoint"
3. **Endpoint URL:**
   ```
   https://TU_PROJECT_REF.supabase.co/functions/v1/stripe-subscription-webhook
   ```
   Reemplaza `TU_PROJECT_REF` con tu Reference ID

4. Clic en "Select events"
5. Busca y selecciona estos eventos:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

6. Clic en "Add endpoint"
7. **Copia el Signing Secret** (comienza con `whsec_`)

```
Webhook Signing Secret: whsec_____________________________
```

8. Agrega el secret a Supabase (Dashboard o CLI):
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_TU_SECRET_AQUI
   ```

- [ ] Webhook endpoint creado
- [ ] Eventos seleccionados
- [ ] Signing Secret copiado
- [ ] Secret agregado a Supabase

---

## 🧪 PASO 9: Probar Todo

1. Reinicia tu servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Ve a http://localhost:8080/dashboard/profile

3. Haz clic en "Cambiar Plan"

4. Selecciona un plan (ej: BASIC)

5. Deberías ser redirigido a Stripe Checkout

6. Usa tarjeta de prueba:
   - **Número:** 4242 4242 4242 4242
   - **Fecha:** Cualquier fecha futura
   - **CVC:** Cualquier 3 dígitos

7. Completa el pago

8. Deberías ser redirigido de vuelta a tu app

9. Verifica que tu plan cambió en el perfil

- [ ] Servidor reiniciado
- [ ] Modal abre correctamente
- [ ] Redirect a Stripe funciona
- [ ] Pago de prueba completado
- [ ] Redirect de vuelta funciona
- [ ] Plan actualizado en la app

---

## 🎉 ¡LISTO!

Si todos los checkboxes están marcados, ¡Stripe está completamente configurado!

---

## 🆘 Troubleshooting

### Error: "CORS blocked"
- Verifica que las functions estén desplegadas
- Verifica que STRIPE_SECRET_KEY esté configurado

### Error: "Invalid price"
- Verifica que los Price IDs estén correctos en el código
- Verifica que uses Price IDs de TEST mode

### Webhook no recibe eventos
- Verifica que el Signing Secret esté correcto
- Verifica que la URL del webhook sea correcta
- Ve a Stripe Dashboard → Webhooks → Tu endpoint → Recent deliveries

---

## 📞 ¿Necesitas ayuda?

Dime en qué paso estás atascado y te ayudo específicamente.
