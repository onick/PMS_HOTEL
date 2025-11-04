# 🚀 SOLARIS PMS - Checklist de Deployment a Producción

**Versión**: 1.0.0  
**Fecha**: Noviembre 2025  
**Estado**: Pre-deployment

---

## 📋 PRE-DEPLOYMENT (Antes de lanzar)

### 🔐 Seguridad
- [x] Auditoría de seguridad completada
- [x] 147 políticas RLS verificadas
- [x] Gap de cleaning_checklists identificado y resuelto
- [x] Migración de seguridad aplicada
- [ ] Testing de multi-tenancy completado (usar `test-multi-tenancy.md`)
- [ ] Verificar que no hay datos de prueba en producción

### 📧 Sistema de Emails
- [ ] Obtener API Key de Resend (https://resend.com)
- [ ] Configurar dominio en Resend (o usar dominio de prueba)
- [ ] Configurar secrets en Supabase:
  ```bash
  supabase secrets set RESEND_API_KEY=re_xxxxx
  supabase secrets set APP_URL=https://tu-dominio.com
  ```
- [ ] Desplegar Edge Functions:
  ```bash
  supabase functions deploy send-email
  supabase functions deploy send-staff-invitation
  supabase functions deploy send-reservation-confirmation
  ```
- [ ] Probar envío de email de invitación

### 💳 Stripe (Ya configurado)
- [x] Productos creados en Stripe
- [x] Webhooks configurados
- [x] Testing de checkout completado
- [x] Customer Portal funcional

### 🗄️ Base de Datos
- [x] Todas las migraciones aplicadas
- [x] Índices creados para performance
- [ ] Backup configurado (Supabase automático)
- [ ] Políticas de retención definidas

### 🌐 Frontend
- [ ] Variables de entorno configuradas (`.env.production`)
- [ ] Build de producción probado:
  ```bash
  npm run build
  npm run preview
  ```
- [ ] Sin errores en consola del navegador
- [ ] Lighthouse score > 80 en todas las métricas
- [ ] PWA manifest configurado (opcional)

### 📱 Testing
- [ ] Testing E2E de flujo completo:
  - [ ] Registro de usuario
  - [ ] Crear hotel
  - [ ] Crear reserva
  - [ ] Check-in
  - [ ] Agregar cargos
  - [ ] Check-out
  - [ ] Pago
- [ ] Testing de roles:
  - [ ] HOTEL_OWNER puede todo
  - [ ] MANAGER puede gestionar
  - [ ] RECEPTION puede front desk
  - [ ] HOUSEKEEPING limitado a limpieza
- [ ] Testing de performance
- [ ] Testing en múltiples navegadores
- [ ] Testing responsive (móvil/tablet)

---

## 🎯 DEPLOYMENT INICIAL

### 1. Configuración de Dominio
```bash
# Ejemplo con Vercel
vercel --prod

# O con Netlify
netlify deploy --prod
```

**DNS a configurar**:
- [ ] A record apuntando a servidor
- [ ] CNAME para www
- [ ] SSL certificate (automático en Vercel/Netlify)

### 2. Variables de Entorno en Producción

**Frontend** (Vercel/Netlify):
```env
VITE_SUPABASE_URL=https://yvlesrmoeblodnhpmizx.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
```

**Supabase Secrets**:
```bash
RESEND_API_KEY=re_xxxxx
APP_URL=https://solaris-pms.com
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 3. Verificar Servicios

- [ ] Frontend accesible en dominio
- [ ] Supabase conectado correctamente
- [ ] Edge Functions respondiendo
- [ ] Stripe checkout funcional
- [ ] Emails enviándose correctamente

---

## 📊 POST-DEPLOYMENT (Primeras 24 horas)

### Monitoreo Inmediato

- [ ] Verificar logs de Supabase (errores)
- [ ] Verificar logs de Edge Functions
- [ ] Monitorear uso de Stripe
- [ ] Verificar que emails se están enviando
- [ ] Revisar performance en Google Analytics

### Métricas Clave

**Día 1**:
- Registros de usuarios: ___
- Hoteles creados: ___
- Reservas creadas: ___
- Errores 500: ___ (debe ser 0)
- Tiempo de carga promedio: ___ seg (< 3 seg)

### Checklist Post-Deployment

- [ ] Crear usuario de prueba y verificar flujo completo
- [ ] Probar invitación de staff y recibir email
- [ ] Crear reserva y verificar confirmación por email
- [ ] Verificar que reportes se generan correctamente
- [ ] Exportar reporte a Excel y verificar datos
- [ ] Probar checkout de Stripe con tarjeta de prueba

---

## 🐛 TROUBLESHOOTING

### Si los usuarios no pueden registrarse

**Verificar**:
1. Email confirmation está deshabilitado (o configurado)
2. RLS policies en `profiles` permiten INSERT
3. Function `handle_new_user` está activa

**Fix rápido**:
```sql
-- Verificar triggers
SELECT * FROM pg_trigger WHERE tgname LIKE '%user%';
```

### Si emails no llegan

**Verificar**:
1. RESEND_API_KEY está configurado
2. Edge Functions están deployed
3. Logs de Edge Functions para errores
4. Dominio verificado en Resend

**Verificar desde CLI**:
```bash
supabase functions inspect send-staff-invitation
```

### Si hay error de permisos

**Verificar**:
1. Usuario tiene rol asignado en `user_roles`
2. RLS policies están habilitadas
3. hotel_id está correctamente asignado

**Query de diagnóstico**:
```sql
SELECT ur.*, p.full_name 
FROM user_roles ur
JOIN profiles p ON p.id = ur.user_id
WHERE user_id = 'USER_ID_AQUI';
```

### Si Stripe falla

**Verificar**:
1. Webhooks están recibiendo eventos
2. `STRIPE_WEBHOOK_SECRET` es correcto
3. Edge Function `stripe-subscription-webhook` está deployed

**Test webhook**:
```bash
stripe listen --forward-to https://tu-proyecto.supabase.co/functions/v1/stripe-subscription-webhook
```

---

## 📈 OPTIMIZACIONES POST-LANZAMIENTO

### Semana 1

- [ ] Analizar queries lentas en Supabase Dashboard
- [ ] Optimizar queries con índices si necesario
- [ ] Revisar logs de errores y crear fixes
- [ ] Recopilar feedback de primeros usuarios

### Mes 1

- [ ] Implementar analytics avanzado (Mixpanel/Amplitude)
- [ ] Agregar error tracking (Sentry)
- [ ] Implementar A/B testing para conversión
- [ ] Optimizar bundle size si > 500KB

### Trimestre 1

- [ ] Revisar y optimizar costos de Supabase
- [ ] Implementar CDN para assets estáticos
- [ ] Considerar caché con Redis si necesario
- [ ] Implementar rate limiting en Edge Functions

---

## 🔄 ROLLBACK PLAN

### Si algo sale mal en producción

**Opción 1: Rollback de Frontend**
```bash
# Vercel
vercel rollback

# Netlify
netlify rollback
```

**Opción 2: Rollback de Migraciones**
```bash
# Revertir última migración
supabase db reset --linked

# Aplicar migraciones hasta cierto punto
supabase db push --up-to 20251103000000
```

**Opción 3: Modo Mantenimiento**
- Agregar página estática de mantenimiento
- Redirigir todo el tráfico temporalmente
- Investigar y resolver el problema

---

## 📞 CONTACTOS DE EMERGENCIA

### Servicios Críticos

**Supabase**:
- Dashboard: https://supabase.com/dashboard
- Status: https://status.supabase.com
- Support: support@supabase.com

**Stripe**:
- Dashboard: https://dashboard.stripe.com
- Support: https://support.stripe.com

**Resend**:
- Dashboard: https://resend.com/dashboard
- Support: support@resend.com

**Vercel** (si aplica):
- Dashboard: https://vercel.com/dashboard
- Support: https://vercel.com/support

---

## 🎓 DOCUMENTACIÓN ADICIONAL

### Para el equipo

- [ ] README.md actualizado
- [ ] Documentación de API
- [ ] Guía de contribución
- [ ] Arquitectura del sistema documentada

### Para usuarios

- [ ] Manual de usuario
- [ ] Videos tutoriales
- [ ] FAQ
- [ ] Guía de inicio rápido

---

## ✅ SIGN-OFF

### Aprobaciones Requeridas

**Técnico** (Desarrollador):
- [ ] Código revisado y tested
- [ ] Sin issues críticos abiertos
- [ ] Performance aceptable
- [ ] Seguridad auditada

**Producto** (Product Owner):
- [ ] Features MVP completos
- [ ] UX validada
- [ ] Flows principales testeados
- [ ] Documentación completa

**Legal** (si aplica):
- [ ] Términos y condiciones publicados
- [ ] Política de privacidad
- [ ] GDPR compliance verificado
- [ ] Contratos de procesamiento de datos

---

## 🎯 CRITERIOS DE ÉXITO

**Deployment es exitoso cuando**:

1. ✅ **Funcionalidad**: Todos los flujos core funcionan
2. ✅ **Performance**: Página carga en < 3 segundos
3. ✅ **Seguridad**: Tests de multi-tenancy pasan
4. ✅ **Estabilidad**: Sin errores 500 en primeras 24h
5. ✅ **Emails**: Confirmaciones e invitaciones llegan
6. ✅ **Pagos**: Stripe checkout funciona correctamente

**Métricas de éxito primeros 30 días**:
- 10+ hoteles registrados
- 50+ reservas creadas
- 0 incidentes de seguridad
- < 5% tasa de error en transacciones
- NPS > 50 (si se mide)

---

## 🚦 SEMÁFORO DE LANZAMIENTO

### 🟢 LISTO PARA LANZAR si:
- Todos los checks de Pre-deployment completados
- Testing básico pasado
- Edge Functions deployed
- Monitoreo configurado

### 🟡 LANZAMIENTO CON PRECAUCIÓN si:
- Algunos tests pendientes (no críticos)
- Features opcionales faltantes
- Documentación incompleta
- Performance mejorable pero aceptable

### 🔴 NO LANZAR si:
- Tests de seguridad fallan
- Multi-tenancy no funciona
- Errores críticos en flujo de reserva
- Stripe no funciona
- Base de datos sin backup

---

## 🎉 POST-LANZAMIENTO

### Celebrar! 🍾

El equipo ha completado un producto complejo. Reconocer el esfuerzo.

### Comunicar

- [ ] Anuncio en redes sociales
- [ ] Email a early adopters
- [ ] Blog post de lanzamiento
- [ ] Demo video

### Monitorear Activamente

**Primera semana**: Revisar diariamente
**Primer mes**: Revisar 2-3 veces por semana
**Después**: Revisar semanalmente

---

**Status Actual**: 🟢 LISTO para deployment con testing pendiente

**Bloqueadores**: 
- Testing de multi-tenancy (1 hora)
- Edge Functions deployment (30 min)

**Próximo paso**: Ejecutar test-multi-tenancy.md y deployment! 🚀
