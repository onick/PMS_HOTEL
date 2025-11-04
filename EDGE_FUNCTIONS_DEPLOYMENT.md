# Despliegue de Edge Functions - SOLARIS PMS

## Funciones Creadas

1. **send-email** - Función genérica para envío de emails
2. **send-staff-invitation** - Envío automático de invitaciones de personal
3. **send-reservation-confirmation** - Confirmaciones de reserva por email

## Prerrequisitos

1. **Cuenta en Resend** (servicio de emails transaccionales)
   - Registrarse en: https://resend.com
   - Obtener API Key
   - Verificar dominio (o usar dominio de prueba)

2. **Supabase CLI instalado**
   ```bash
   npm install -g supabase
   ```

3. **Autenticación con Supabase**
   ```bash
   supabase login
   ```

## Variables de Entorno Requeridas

Las siguientes variables deben configurarse en Supabase:

```bash
# API Key de Resend para envío de emails
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# URL de la aplicación frontend (para links en emails)
APP_URL=https://tu-dominio.com
```

## Configurar Variables de Entorno

### Opción 1: Desde Supabase Dashboard
1. Ir a: Project Settings → Edge Functions → Manage secrets
2. Agregar las variables:
   - `RESEND_API_KEY`
   - `APP_URL`

### Opción 2: Desde CLI

```bash
# Configurar RESEND_API_KEY
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# Configurar APP_URL
supabase secrets set APP_URL=https://tu-dominio.com
```

## Despliegue de Funciones

### Desplegar todas las funciones
```bash
supabase functions deploy
```

### Desplegar funciones individuales

```bash
# Función genérica de emails
supabase functions deploy send-email

# Invitaciones de staff
supabase functions deploy send-staff-invitation

# Confirmaciones de reserva
supabase functions deploy send-reservation-confirmation
```

## Verificar Despliegue

### Ver logs en tiempo real
```bash
supabase functions serve send-staff-invitation --env-file .env.local
```

### Probar función localmente
```bash
# En un terminal
supabase functions serve

# En otro terminal, hacer una petición de prueba
curl -X POST \
  'http://localhost:54321/functions/v1/send-staff-invitation' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"invitation_id": "uuid-aqui"}'
```

## Integración en el Frontend

Las funciones ya están integradas en:

### 1. Staff Invitations
- **Archivo**: `src/components/staff/AddStaffDialog.tsx`
- **Trigger**: Cuando se crea una invitación de personal
- **Acción**: Envía email automáticamente con link de registro

### 2. Reservation Confirmation (pendiente de integrar)
- **Sugerencia**: Agregar en `src/pages/dashboard/Reservations.tsx`
- **Trigger**: Cuando se confirma una reserva
- **Implementación**:

```typescript
// Ejemplo de integración
const confirmReservation = async (reservationId: string) => {
  // Actualizar estado de reserva
  const { error } = await supabase
    .from('reservations')
    .update({ status: 'CONFIRMED' })
    .eq('id', reservationId);

  if (!error) {
    // Enviar email de confirmación
    const { data: { session } } = await supabase.auth.getSession();
    
    await fetch(
      `${supabase.supabaseUrl}/functions/v1/send-reservation-confirmation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ reservation_id: reservationId }),
      }
    );
  }
};
```

## Configuración de Resend

### 1. Verificar Dominio (Producción)

Para usar tu propio dominio en los emails:

1. En Resend Dashboard → Domains → Add Domain
2. Agregar tu dominio (ej: `solaris-pms.com`)
3. Configurar registros DNS:
   - **SPF**: Para autorizar envío
   - **DKIM**: Para firma digital
   - **DMARC**: Para políticas de seguridad
4. Esperar verificación (24-48 horas)

### 2. Dominio de Prueba

Para desarrollo, Resend provee un dominio de prueba:
- **From**: `onboarding@resend.dev`
- **Limitaciones**: Solo puedes enviar a emails verificados en tu cuenta

### 3. Plantillas de Email

Los emails incluyen:
- ✅ HTML responsive
- ✅ Diseño profesional con gradientes
- ✅ Información detallada formateada
- ✅ Marca SOLARIS PMS
- ✅ Footer con año automático

## Troubleshooting

### Error: "RESEND_API_KEY is not defined"
**Solución**: Configurar la variable de entorno en Supabase

### Error: "Failed to send email"
**Verificar**:
1. API Key de Resend es válida
2. Dominio está verificado (o usar dominio de prueba)
3. Email destino es válido

### Email no llega
**Verificar**:
1. Carpeta de Spam
2. Logs de Resend Dashboard
3. Estado de verificación del dominio

### Ver logs de función
```bash
supabase functions inspect send-staff-invitation
```

## Próximos Pasos

### Funciones adicionales sugeridas:

1. **send-check-in-reminder**
   - Enviar 24h antes del check-in
   - Recordatorio con detalles de reserva

2. **send-payment-receipt**
   - Cuando se procesa un pago
   - Recibo detallado en PDF adjunto

3. **send-feedback-request**
   - Después del check-out
   - Solicitar reseña y feedback

4. **send-maintenance-notification**
   - Cuando se asigna tarea de mantenimiento
   - Notificar al staff asignado

## Costos

### Resend Pricing
- **Plan Free**: 3,000 emails/mes
- **Plan Pro**: $20/mes - 50,000 emails/mes
- Emails adicionales: $1 por cada 1,000

### Supabase Edge Functions
- Incluidas en todos los planes
- 500,000 invocaciones/mes gratis
- $2 por cada millón adicional

## Seguridad

✅ **Implementado**:
- CORS configurado
- Autenticación con JWT tokens
- Service role key en servidor
- Validación de datos de entrada

⚠️ **Recomendaciones**:
- Implementar rate limiting
- Validar emails con regex
- Logs de auditoría para emails enviados
- Monitoreo de uso de API

## Monitoreo

### Dashboard de Resend
- Ver emails enviados
- Tasas de entrega
- Bounces y complaints
- Logs detallados

### Supabase Dashboard  
- Invocaciones de funciones
- Errores y logs
- Tiempo de ejecución
- Uso de recursos

---

**Documentación creada para**: SOLARIS PMS v1.0
**Última actualización**: Noviembre 2025
