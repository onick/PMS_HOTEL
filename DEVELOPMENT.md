# 🔧 Guía de Desarrollo Local - HotelMate Core

## 📋 Requisitos Previos

- Node.js 18+ y npm
- Cuenta de Supabase (gratuita)
- Git

## 🚀 Configuración Inicial

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

El archivo `.env` ya está configurado con las credenciales de Supabase:

```env
VITE_SUPABASE_PROJECT_ID="wzlcgvznjqoodnksoyxi"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGci..."
VITE_SUPABASE_URL="https://wzlcgvznjqoodnksoyxi.supabase.co"
```

### 3. Aplicar Migraciones de Base de Datos

Las migraciones ya están en `supabase/migrations/`. Para aplicarlas:

**Opción A: Desde el Panel de Supabase**
1. Ve a https://supabase.com/dashboard/project/wzlcgvznjqoodnksoyxi
2. SQL Editor → New Query
3. Copia y pega cada archivo de migración en orden cronológico
4. Ejecuta cada uno

**Opción B: Con Supabase CLI**
```bash
npx supabase db push
```

### 4. Crear Usuario de Prueba

#### Paso 1: Crear cuenta en la aplicación
1. Inicia el servidor: `npm run dev`
2. Ve a http://localhost:8080/
3. Haz clic en "Registrarse"
4. Usa estos datos:
   - **Nombre**: Admin Test
   - **Email**: admin@hotelmate.test
   - **Password**: Admin123456!

#### Paso 2: Obtener tu User ID
1. Ve al panel de Supabase: https://supabase.com/dashboard/project/wzlcgvznjqoodnksoyxi
2. Authentication → Users
3. Copia el UUID de tu usuario (ejemplo: `a1b2c3d4-...`)

#### Paso 3: Insertar Datos de Prueba
1. Abre el archivo `supabase/seed.sql`
2. Reemplaza `YOUR_USER_ID_HERE` con tu UUID real (línea 24)
3. Ve a SQL Editor en Supabase
4. Copia y pega el contenido completo de `seed.sql`
5. Ejecuta el script

## ✅ Verificar Instalación

Después de ejecutar el seed, deberías tener:

- ✅ 1 Hotel: "Hotel Playa Paraíso"
- ✅ 3 Tipos de habitación: Estándar, Deluxe, Suite
- ✅ 18 Habitaciones totales
- ✅ 3 Huéspedes de prueba
- ✅ 3 Reservaciones (1 futura, 1 actual, 1 pasada)
- ✅ Inventario inicializado para 365 días

## 🎯 Iniciar Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: http://localhost:8080/

### Credenciales de Acceso

- **Email**: admin@hotelmate.test
- **Password**: Admin123456!

## 📊 Vista del Dashboard

Una vez autenticado, verás:

1. **Métricas en tiempo real**:
   - Ocupación actual
   - Ingresos totales
   - ADR (Average Daily Rate)
   - RevPAR

2. **Tendencias mes-sobre-mes**:
   - Cambio porcentual en ocupación
   - Cambio porcentual en revenue

3. **Actividad del día**:
   - Check-ins programados
   - Check-outs programados
   - Estado de reservas

## 🧪 Ejecutar Tests

```bash
# Ejecutar todos los tests
npm test

# Ver cobertura
npm run test:coverage

# UI interactiva de tests
npm run test:ui
```

## 🏗️ Estructura del Proyecto

```
src/
├── components/       # Componentes reutilizables
├── pages/           # Páginas de la aplicación
├── hooks/           # Hooks personalizados
│   ├── useSupabaseQuery.ts    # Query con error handling
│   ├── useSupabaseMutation.ts # Mutations con error handling
│   └── useDashboardMetrics.ts # Métricas con caché
├── integrations/    # Integraciones (Supabase)
└── lib/            # Utilidades

supabase/
├── migrations/      # Migraciones SQL
└── seed.sql        # Datos de prueba
```

## 🔍 Troubleshooting

### Error: "No rows returned"
- Verifica que ejecutaste el `seed.sql` correctamente
- Verifica que reemplazaste `YOUR_USER_ID_HERE` con tu UUID real

### Error: "Invalid API key"
- Verifica que el archivo `.env` tiene las credenciales correctas
- Reinicia el servidor de desarrollo

### Dashboard muestra ceros
- Asegúrate de que el `seed.sql` se ejecutó sin errores
- Verifica en Supabase → Table Editor que hay datos en `hotels`, `rooms`, `reservations`

### Error: "Permission denied"
- Las políticas RLS están activas
- Asegúrate de estar autenticado
- Verifica que tu user_id está asociado al hotel en la tabla `hotels`

## 📚 Recursos

- [Documentación Supabase](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [ROADMAP.md](./ROADMAP.md) - Plan de desarrollo completo

## 🐛 Reportar Problemas

Si encuentras algún problema, por favor:
1. Verifica esta guía primero
2. Revisa los logs en la consola del navegador
3. Revisa los logs de Supabase (Database → Logs)

---

**¡Listo para desarrollar! 🎉**
