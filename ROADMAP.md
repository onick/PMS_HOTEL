# 🗺️ ROADMAP DE DESARROLLO - HOTELMATE-CORE (SOLARIS PMS)

> **Última actualización**: 16 de octubre, 2025
> **Objetivo**: Preparar la plataforma para producción y escalar funcionalidades
> **Tiempo estimado total**: 18-24 semanas (4.5-6 meses)

---

## 📊 RESUMEN EJECUTIVO

**Estado actual**: MVP 70% completo | **Calificación**: 72/100
**Brechas críticas identificadas**: 8 áreas prioritarias
**Total de tareas**: 43 items organizados en 10 fases

### Priorización de Fases

| Fase | Prioridad | Tiempo | Bloqueante Producción |
|------|-----------|--------|----------------------|
| FASE 1: Fundamentos Críticos | 🔴 CRÍTICA | 2 semanas | ✅ SÍ |
| FASE 2: Datos Reales | 🔴 CRÍTICA | 1 semana | ✅ SÍ |
| FASE 3: TypeScript Estricto | 🟡 ALTA | 1.5 semanas | ❌ NO |
| FASE 4: Performance | 🟡 ALTA | 2 semanas | ❌ NO |
| FASE 5: Pagos | 🔴 CRÍTICA | 3 semanas | ✅ SÍ |
| FASE 6: Channel Manager | 🔴 CRÍTICA | 4 semanas | ✅ SÍ |
| FASE 7: Documentación | 🟡 ALTA | 2 semanas | ⚠️ PARCIAL |
| FASE 8: Seguridad | 🔴 CRÍTICA | 2.5 semanas | ✅ SÍ |
| FASE 9: Analytics Avanzados | 🟢 MEDIA | 2 semanas | ❌ NO |
| FASE 10: Features Nuevos | 🟢 MEDIA | 12 semanas | ❌ NO |

---

## 🎯 FASE 1: FUNDAMENTOS CRÍTICOS (2 semanas)

**Objetivo**: Establecer base sólida de testing y manejo de errores
**Prioridad**: 🔴 CRÍTICA - Bloqueante para producción
**Tiempo estimado**: 80 horas (2 semanas)

### Tareas

#### 1.1 Implementar Suite de Tests
- **Herramientas**: Vitest + React Testing Library + @testing-library/user-event
- **Configuración**:
  ```bash
  npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
  ```
- **Archivos a crear**:
  - `vitest.config.ts` - Configuración de Vitest
  - `src/test/setup.ts` - Setup global de tests
  - `src/test/utils.tsx` - Helpers para testing
- **Tiempo**: 8 horas

#### 1.2 Tests para Flujos Críticos
- **Reservaciones** (`src/components/reservations/__tests__/`):
  - `ReservationDialog.test.tsx` - Creación de reservas
  - `ReservationTimeline.test.tsx` - Vista timeline
  - `ReservationCalendar.test.tsx` - Vista calendario
- **Facturación** (`src/components/billing/__tests__/`):
  - `FolioManager.test.tsx` - Gestión de folios
  - `ChargeDialog.test.tsx` - Agregar cargos
- **Front Desk** (`src/components/front-desk/__tests__/`):
  - `CheckIn.test.tsx` - Proceso de check-in
  - `CheckOut.test.tsx` - Proceso de check-out
- **Tiempo**: 40 horas

#### 1.3 Cobertura de Código (60% mínimo)
- Configurar coverage reports en `vitest.config.ts`
- Ejecutar: `npm run test:coverage`
- Priorizar:
  - Hooks personalizados (100%)
  - Utilidades de fecha/dinero (100%)
  - Lógica de negocio en componentes (70%)
  - Componentes UI (40%)
- **Tiempo**: 16 horas

#### 1.4 Error Boundaries
- **Error Boundary Global** (`src/components/ErrorBoundary.tsx`):
  ```typescript
  import { Component, ErrorInfo, ReactNode } from 'react';

  interface Props { children: ReactNode; fallback?: ReactNode; }
  interface State { hasError: boolean; error: Error | null; }

  export class ErrorBoundary extends Component<Props, State> {
    // Implementación completa
  }
  ```
- **Error Boundaries por Módulo**:
  - `src/components/reservations/ReservationErrorBoundary.tsx`
  - `src/components/billing/BillingErrorBoundary.tsx`
  - `src/components/front-desk/FrontDeskErrorBoundary.tsx`
- **Integración con Sentry** (opcional pero recomendado)
- **Tiempo**: 8 horas

#### 1.5 Estandarizar Manejo de Errores Supabase
- **Crear hook personalizado** (`src/hooks/useSupabaseQuery.ts`):
  ```typescript
  import { useQuery } from '@tanstack/react-query';
  import { toast } from 'sonner';

  export function useSupabaseQuery<T>(
    queryKey: string[],
    queryFn: () => Promise<T>,
    options?: { errorMessage?: string }
  ) {
    return useQuery({
      queryKey,
      queryFn,
      onError: (error) => {
        console.error(`[${queryKey.join('.')}]`, error);
        toast.error(options?.errorMessage || 'Error al cargar datos');
      },
    });
  }
  ```
- **Estandarizar mensajes de error** por tipo:
  - `PGRST116`: "No se encontraron datos"
  - `23505`: "El registro ya existe"
  - `23503`: "No se puede eliminar, hay registros relacionados"
- **Tiempo**: 8 horas

### Entregables FASE 1
- [ ] Suite de tests configurada y funcionando
- [ ] 25+ tests escritos para flujos críticos
- [ ] 60%+ cobertura de código
- [ ] Error boundaries implementados en toda la app
- [ ] Hook `useSupabaseQuery` creado y en uso

### Criterios de Aceptación
- ✅ `npm run test` pasa todos los tests
- ✅ `npm run test:coverage` muestra >60% coverage
- ✅ Errores capturados muestran UI amigable
- ✅ No más errores sin manejar en consola

---

## 📈 FASE 2: DATOS REALES (1 semana)

**Objetivo**: Eliminar mocks y calcular métricas desde la base de datos
**Prioridad**: 🔴 CRÍTICA - Afecta credibilidad del producto
**Tiempo estimado**: 40 horas (1 semana)

### Tareas

#### 2.1 Eliminar Datos Mock del Dashboard
**Archivos a modificar**:
- `src/pages/dashboard/Index.tsx` - Componente principal del dashboard

**Código actual (MOCK)**:
```typescript
const metrics = {
  occupancyRate: 75,
  totalRevenue: 125000,
  averageDailyRate: 1200,
  revPAR: 900,
  occupancyTrend: 5.2, // 🚨 HARDCODED
  revenueTrend: 12.5,  // 🚨 HARDCODED
  adrTrend: 3.8,       // 🚨 HARDCODED
  revparTrend: 8.9,    // 🚨 HARDCODED
};
```

**Código nuevo (REAL)**:
```typescript
// Crear Edge Function: supabase/functions/calculate-metrics/index.ts
import { createClient } from '@supabase/supabase-js';

export async function calculateDashboardMetrics(hotelId: string, date: Date) {
  const supabase = createClient(/* ... */);

  // Calcular ocupación actual
  const currentMonthStart = startOfMonth(date);
  const currentMonthEnd = endOfMonth(date);

  const { data: currentStats } = await supabase.rpc('get_occupancy_stats', {
    p_hotel_id: hotelId,
    p_start_date: currentMonthStart,
    p_end_date: currentMonthEnd,
  });

  // Calcular mes anterior para tendencias
  const previousMonthStart = startOfMonth(subMonths(date, 1));
  const previousMonthEnd = endOfMonth(subMonths(date, 1));

  const { data: previousStats } = await supabase.rpc('get_occupancy_stats', {
    p_hotel_id: hotelId,
    p_start_date: previousMonthStart,
    p_end_date: previousMonthEnd,
  });

  // Calcular tendencias
  const occupancyTrend = calculatePercentageChange(
    currentStats.occupancy_rate,
    previousStats.occupancy_rate
  );

  return { currentStats, trends: { occupancyTrend, ... } };
}
```

**Tiempo**: 16 horas

#### 2.2 Crear Función PostgreSQL para Métricas
**Archivo**: Nueva migración en `supabase/migrations/`

```sql
-- Función para calcular estadísticas de ocupación
CREATE OR REPLACE FUNCTION get_occupancy_stats(
  p_hotel_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  occupancy_rate NUMERIC,
  total_revenue BIGINT,
  average_daily_rate NUMERIC,
  revenue_per_available_room NUMERIC,
  total_reservations INTEGER,
  total_room_nights INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(DISTINCT r.id) as reservation_count,
      SUM(f.balance) as revenue,
      SUM(EXTRACT(DAY FROM (r.check_out - r.check_in))) as room_nights
    FROM reservations r
    JOIN folios f ON f.reservation_id = r.id
    WHERE r.hotel_id = p_hotel_id
      AND r.status IN ('confirmed', 'checked_in', 'checked_out')
      AND r.check_in >= p_start_date
      AND r.check_out <= p_end_date
  ),
  capacity AS (
    SELECT
      COUNT(*) as total_rooms,
      (p_end_date - p_start_date + 1) as days,
      COUNT(*) * (p_end_date - p_start_date + 1) as total_capacity
    FROM rooms
    WHERE hotel_id = p_hotel_id
  )
  SELECT
    ROUND((stats.room_nights::NUMERIC / capacity.total_capacity) * 100, 2) as occupancy_rate,
    COALESCE(stats.revenue, 0) as total_revenue,
    ROUND(stats.revenue::NUMERIC / NULLIF(stats.room_nights, 0), 2) as average_daily_rate,
    ROUND((stats.revenue::NUMERIC / capacity.total_capacity), 2) as revenue_per_available_room,
    stats.reservation_count::INTEGER,
    stats.room_nights::INTEGER
  FROM stats, capacity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Tiempo**: 8 horas

#### 2.3 Implementar Caché de Métricas
- **React Query con staleTime**: 5 minutos para dashboard
- **Configurar refetch**: Cada 10 minutos en background
- **Agregar invalidación manual**: Botón "Actualizar" en dashboard

```typescript
export function useDashboardMetrics(hotelId: string) {
  return useQuery({
    queryKey: ['dashboard', 'metrics', hotelId],
    queryFn: () => fetchDashboardMetrics(hotelId),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: true,
  });
}
```

**Tiempo**: 8 horas

#### 2.4 Actualizar Quick Stats de Reservaciones
**Archivo**: `src/pages/dashboard/reservations/Index.tsx`

Calcular estadísticas reales:
- Total de reservas (filtrado por estado)
- Revenue total (suma de balances de folios)
- Tasa de ocupación (query a inventario)
- ADR promedio (revenue / noches)

**Tiempo**: 8 horas

### Entregables FASE 2
- [ ] Dashboard muestra datos reales desde BD
- [ ] Tendencias mes-sobre-mes calculadas correctamente
- [ ] Función PostgreSQL `get_occupancy_stats` creada
- [ ] Caché configurado con React Query
- [ ] Quick stats eliminan datos mock

### Criterios de Aceptación
- ✅ No hay valores hardcodeados en dashboard
- ✅ Métricas cambian al seleccionar diferentes fechas
- ✅ Tendencias muestran % correcto de cambio
- ✅ Performance <2 segundos para cargar dashboard

---

## 🔒 FASE 3: TYPESCRIPT ESTRICTO (1.5 semanas)

**Objetivo**: Mejorar type safety y reducir errores en runtime
**Prioridad**: 🟡 ALTA - No bloqueante pero importante
**Tiempo estimado**: 60 horas (1.5 semanas)

### Estrategia Incremental

Habilitar opciones una por una para evitar abrumar el desarrollo:

#### 3.1 Habilitar `noImplicitAny` (Semana 1)
**Archivo**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "noImplicitAny": true, // ✅ Activar
    // Resto igual...
  }
}
```

**Errores esperados**: 50-100 errores
**Estrategia**:
1. Ejecutar `npm run build` para ver todos los errores
2. Agrupar por archivo/módulo
3. Priorizar archivos con más uso (hooks, utils)
4. Agregar tipos explícitos o `any` temporal con `// @ts-expect-error` + comentario

**Tiempo**: 24 horas

#### 3.2 Habilitar `strictNullChecks` (Semana 2)
```json
{
  "compilerOptions": {
    "strictNullChecks": true, // ✅ Activar
  }
}
```

**Errores esperados**: 100-200 errores
**Estrategia**:
1. Agregar checks de `null`/`undefined`:
   ```typescript
   // Antes
   const hotel = hotels[0];

   // Después
   const hotel = hotels[0];
   if (!hotel) throw new Error('Hotel not found');
   ```
2. Usar optional chaining: `hotel?.name`
3. Usar nullish coalescing: `hotel?.tax_rate ?? 0.18`

**Tiempo**: 24 horas

#### 3.3 Habilitar `noUnusedLocals` y `noUnusedParameters`
```json
{
  "compilerOptions": {
    "noUnusedLocals": true, // ✅ Activar
    "noUnusedParameters": true, // ✅ Activar
  }
}
```

**Tiempo**: 12 horas (mayormente limpieza automática)

### Entregables FASE 3
- [ ] `noImplicitAny` habilitado, cero errores
- [ ] `strictNullChecks` habilitado, cero errores
- [ ] `noUnusedLocals` y `noUnusedParameters` habilitados
- [ ] Documentar tipos complejos en `src/types/`

### Criterios de Aceptación
- ✅ `npm run build` sin errores TypeScript
- ✅ IDE autocomplete mejorado
- ✅ Menos errores en runtime relacionados a tipos

---

## ⚡ FASE 4: PERFORMANCE (2 semanas)

**Objetivo**: Optimizar carga y renderizado para escala
**Prioridad**: 🟡 ALTA - Mejora experiencia de usuario
**Tiempo estimado**: 80 horas (2 semanas)

### Tareas

#### 4.1 Implementar Paginación en Listas
**Lista de Huéspedes** (`src/pages/dashboard/crm/GuestList.tsx`):
```typescript
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

const GUESTS_PER_PAGE = 50;

export function GuestList() {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['guests', hotelId, page],
    queryFn: async () => {
      const { data, count } = await supabase
        .from('guests')
        .select('*', { count: 'exact' })
        .eq('hotel_id', hotelId)
        .range(page * GUESTS_PER_PAGE, (page + 1) * GUESTS_PER_PAGE - 1)
        .order('created_at', { ascending: false });

      return { guests: data, total: count };
    },
  });

  return (
    <>
      <GuestTable guests={data?.guests} />
      <Pagination
        page={page}
        totalPages={Math.ceil((data?.total ?? 0) / GUESTS_PER_PAGE)}
        onPageChange={setPage}
      />
    </>
  );
}
```

**Lista de Reservaciones** (similar):
- `src/pages/dashboard/reservations/ReservationList.tsx`
- Paginación de 50 items por página
- Mostrar "Mostrando X-Y de Z reservas"

**Tiempo**: 24 horas

#### 4.2 Skeleton Loaders
Crear componentes skeleton para loading states:

**Archivo**: `src/components/ui/skeleton.tsx` (extender el existente)
```typescript
export function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

export function ReservationListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(10)].map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}
```

**Implementar en**:
- Dashboard principal
- Lista de reservaciones
- Lista de huéspedes
- Lista de habitaciones

**Tiempo**: 16 horas

#### 4.3 Code Splitting por Rutas
**Archivo**: `src/App.tsx`

```typescript
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Páginas principales (eager load)
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';

// Lazy load de dashboard y módulos
const DashboardLayout = lazy(() => import('@/pages/dashboard/Layout'));
const DashboardIndex = lazy(() => import('@/pages/dashboard/Index'));
const Reservations = lazy(() => import('@/pages/dashboard/reservations/Index'));
const FrontDesk = lazy(() => import('@/pages/dashboard/front-desk/Index'));
const Housekeeping = lazy(() => import('@/pages/dashboard/housekeeping/Index'));
const Billing = lazy(() => import('@/pages/dashboard/billing/Index'));
const CRM = lazy(() => import('@/pages/dashboard/crm/Index'));
const Analytics = lazy(() => import('@/pages/dashboard/analytics/Index'));
const Settings = lazy(() => import('@/pages/dashboard/settings/Index'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardIndex />} />
            <Route path="reservations" element={<Reservations />} />
            {/* ... resto de rutas */}
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

**Tiempo**: 16 horas

#### 4.4 React.memo() para Componentes Pesados
Identificar componentes que re-renderizan frecuentemente:

```typescript
import { memo } from 'react';

export const ReservationCard = memo(function ReservationCard({
  reservation
}: ReservationCardProps) {
  // Implementación...
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.reservation.id === nextProps.reservation.id &&
         prevProps.reservation.status === nextProps.reservation.status;
});
```

**Componentes a optimizar**:
- `ReservationCard` (usado en listas largas)
- `GuestRow` (tabla de huéspedes)
- `RoomCard` (inventory calendar)
- `ChartComponent` (gráficos pesados)

**Tiempo**: 16 horas

#### 4.5 Bundle Analysis y Optimización
```bash
npm install -D rollup-plugin-visualizer
```

**Archivo**: `vite.config.ts`
```typescript
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true, filename: 'dist/stats.html' }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-select', /* ... */],
          'chart-vendor': ['recharts'],
          'query-vendor': ['@tanstack/react-query'],
        },
      },
    },
  },
});
```

**Tiempo**: 8 horas

### Entregables FASE 4
- [ ] Paginación en lista de huéspedes y reservaciones
- [ ] Skeleton loaders en todos los módulos principales
- [ ] Code splitting implementado (lazy loading de rutas)
- [ ] React.memo() en 10+ componentes pesados
- [ ] Bundle analysis completado y optimizado

### Criterios de Aceptación
- ✅ Initial bundle <500KB (compressed)
- ✅ Lazy chunks <200KB cada uno
- ✅ Listas con 1000+ items no causan lag
- ✅ Lighthouse Performance Score >85

---

## 💳 FASE 5: PROCESAMIENTO DE PAGOS (3 semanas)

**Objetivo**: Integrar Stripe para aceptar pagos reales
**Prioridad**: 🔴 CRÍTICA - Bloquea generación de ingresos
**Tiempo estimado**: 120 horas (3 semanas)

### Tareas

#### 5.1 Setup de Stripe
**Instalación**:
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

**Variables de entorno** (`.env`):
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
SUPABASE_SERVICE_ROLE_KEY=xxx  # Para Edge Functions
STRIPE_SECRET_KEY=sk_test_xxx  # Solo en Edge Functions
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

**Tiempo**: 4 horas

#### 5.2 Crear Edge Function para Payment Intents
**Archivo**: `supabase/functions/create-payment-intent/index.ts`

```typescript
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    const { reservationId, amount, currency } = await req.json();

    // Verificar reserva existe
    const supabase = createClient(/* ... */);
    const { data: reservation } = await supabase
      .from('reservations')
      .select('*, folio:folios(*)')
      .eq('id', reservationId)
      .single();

    if (!reservation) {
      return new Response(JSON.stringify({ error: 'Reservation not found' }), {
        status: 404,
      });
    }

    // Crear Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // en centavos
      currency,
      metadata: {
        reservation_id: reservationId,
        folio_id: reservation.folio.id,
      },
    });

    // Guardar payment_intent_id en folio
    await supabase
      .from('folios')
      .update({ payment_intent_id: paymentIntent.id })
      .eq('id', reservation.folio.id);

    return new Response(JSON.stringify({
      clientSecret: paymentIntent.client_secret,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
```

**Tiempo**: 16 horas

#### 5.3 Componente de Checkout
**Archivo**: `src/components/billing/StripeCheckout.tsx`

```typescript
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({ folioId, amount }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/billing/success`,
      },
    });

    if (error) {
      toast.error(error.message);
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <Button type="submit" disabled={isProcessing || !stripe}>
        {isProcessing ? 'Procesando...' : `Pagar ${formatCurrency(amount)}`}
      </Button>
    </form>
  );
}

export function StripeCheckout({ folioId, amount }: StripeCheckoutProps) {
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Crear Payment Intent al montar
    supabase.functions.invoke('create-payment-intent', {
      body: { folioId, amount },
    }).then(({ data }) => setClientSecret(data.clientSecret));
  }, [folioId, amount]);

  if (!clientSecret) return <Skeleton />;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm folioId={folioId} amount={amount} />
    </Elements>
  );
}
```

**Tiempo**: 24 horas

#### 5.4 Webhook Handler para Confirmación
**Archivo**: `supabase/functions/stripe-webhook/index.ts`

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(/* ... */);

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      // Actualizar reserva a CONFIRMED
      const { reservation_id, folio_id } = paymentIntent.metadata;

      await supabase
        .from('reservations')
        .update({ status: 'confirmed', payment_status: 'paid' })
        .eq('id', reservation_id);

      // Actualizar folio balance
      await supabase
        .from('folios')
        .update({ balance: 0, paid_at: new Date().toISOString() })
        .eq('id', folio_id);

      // Convertir hold a reserved en inventario
      await supabase.rpc('convert_hold_to_reserved', {
        p_reservation_id: reservation_id,
      });

      // Enviar email de confirmación (TODO: implementar)

      break;

    case 'payment_intent.payment_failed':
      // Manejar pago fallido
      break;
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
```

**Tiempo**: 24 horas

#### 5.5 Almacenamiento de Métodos de Pago
Agregar tabla para guardar métodos de pago (opcional, para pagos recurrentes):

```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT NOT NULL,
  card_brand TEXT,
  card_last4 TEXT,
  exp_month INTEGER,
  exp_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Tiempo**: 16 horas

#### 5.6 Workflow de Reembolsos
**Archivo**: `src/components/billing/RefundDialog.tsx`

```typescript
export function RefundDialog({ folio }: RefundDialogProps) {
  const handleRefund = async (amount: number, reason: string) => {
    const { data, error } = await supabase.functions.invoke('create-refund', {
      body: {
        payment_intent_id: folio.payment_intent_id,
        amount,
        reason,
      },
    });

    if (error) {
      toast.error('Error al procesar reembolso');
      return;
    }

    toast.success('Reembolso procesado exitosamente');
  };

  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Procesar Reembolso</DialogTitle>
        </DialogHeader>
        <RefundForm onSubmit={handleRefund} maxAmount={folio.balance} />
      </DialogContent>
    </Dialog>
  );
}
```

**Edge Function**: `supabase/functions/create-refund/index.ts`
```typescript
const refund = await stripe.refunds.create({
  payment_intent: payment_intent_id,
  amount,
  reason,
});
```

**Tiempo**: 24 horas

#### 5.7 Testing de Pagos
- Test con tarjetas de prueba de Stripe
- Test de webhooks con Stripe CLI
- Test de errores (tarjeta rechazada, fondos insuficientes)
- Test de reembolsos parciales y completos

**Tiempo**: 12 horas

### Entregables FASE 5
- [ ] Stripe configurado y funcionando
- [ ] Payment Intents creados correctamente
- [ ] Checkout UI implementado con Stripe Elements
- [ ] Webhooks manejando confirmaciones
- [ ] Reembolsos funcionando
- [ ] Tests de flujo completo pasando

### Criterios de Aceptación
- ✅ Usuario puede pagar reserva con tarjeta
- ✅ Reserva se confirma automáticamente al pagar
- ✅ Inventario se actualiza correctamente
- ✅ Reembolsos se procesan sin errores
- ✅ Webhooks tienen <1% de fallos

---

## 🔗 FASE 6: CHANNEL MANAGER - BOOKING.COM (4 semanas)

**Objetivo**: Conectar con Booking.com para sincronización bidireccional
**Prioridad**: 🔴 CRÍTICA - Feature clave de venta
**Tiempo estimado**: 160 horas (4 semanas)

### Tareas

#### 6.1 Investigación y Setup
- Registrarse en Booking.com Connectivity Partner Program
- Obtener credenciales API (Client ID, Secret)
- Leer documentación de XML API o JSON API
- Identificar endpoints necesarios:
  - Availability/Rates push
  - Reservations pull
  - Modifications/Cancellations webhook

**Tiempo**: 16 horas

#### 6.2 Crear Servicio de Integración
**Archivo**: `src/lib/channels/booking-com.ts`

```typescript
import axios from 'axios';

export class BookingComAPI {
  private baseURL = 'https://supply-xml.booking.com/hotels/xml';
  private hotelId: string;
  private username: string;
  private password: string;

  constructor(credentials: ChannelCredentials) {
    this.hotelId = credentials.hotel_id;
    this.username = credentials.username;
    this.password = credentials.password;
  }

  async pushAvailability(roomTypeId: string, dates: AvailabilityUpdate[]) {
    const xml = this.buildAvailabilityXML(roomTypeId, dates);
    const response = await axios.post(this.baseURL, xml, {
      headers: { 'Content-Type': 'application/xml' },
      auth: { username: this.username, password: this.password },
    });

    return this.parseResponse(response.data);
  }

  async pushRates(roomTypeId: string, rates: RateUpdate[]) {
    // Similar a pushAvailability
  }

  async pullReservations(fromDate: Date, toDate: Date) {
    const xml = this.buildReservationPullXML(fromDate, toDate);
    const response = await axios.post(this.baseURL, xml, {
      auth: { username: this.username, password: this.password },
    });

    const reservations = this.parseReservations(response.data);
    return reservations;
  }

  private buildAvailabilityXML(roomTypeId: string, dates: AvailabilityUpdate[]) {
    return `
      <?xml version="1.0" encoding="UTF-8"?>
      <request>
        <username>${this.username}</username>
        <password>${this.password}</password>
        <hotel_id>${this.hotelId}</hotel_id>
        <room_id>${roomTypeId}</room_id>
        ${dates.map(d => `
          <availability date="${d.date}" available="${d.available}" />
        `).join('')}
      </request>
    `;
  }

  // Más métodos...
}
```

**Tiempo**: 40 horas

#### 6.3 Edge Function para Sincronización
**Archivo**: `supabase/functions/sync-channel/index.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { BookingComAPI } from './booking-com.ts';

Deno.serve(async (req) => {
  const { hotelId, channelId, syncType } = await req.json();

  const supabase = createClient(/* ... */);

  // Obtener credenciales del canal
  const { data: channel } = await supabase
    .from('channel_connections')
    .select('*')
    .eq('id', channelId)
    .single();

  if (!channel || !channel.is_active) {
    return new Response(JSON.stringify({ error: 'Channel not active' }), {
      status: 400,
    });
  }

  const api = new BookingComAPI(channel.credentials);

  try {
    switch (syncType) {
      case 'availability':
        // Obtener disponibilidad de inventario local
        const { data: inventory } = await supabase
          .from('inventory_by_day')
          .select('*')
          .eq('hotel_id', hotelId)
          .gte('date', new Date().toISOString())
          .lte('date', addDays(new Date(), 365).toISOString());

        // Mapear room_type_id local a room_id de Booking.com
        const roomMapping = JSON.parse(channel.settings.room_mapping);

        for (const [localRoomType, channelRoomId] of Object.entries(roomMapping)) {
          const roomInventory = inventory.filter(i => i.room_type_id === localRoomType);
          const updates = roomInventory.map(i => ({
            date: i.date,
            available: i.total_inventory - i.reserved - i.holds,
          }));

          await api.pushAvailability(channelRoomId, updates);
        }
        break;

      case 'rates':
        // Similar para tarifas
        break;

      case 'reservations':
        // Pull de reservas nuevas
        const newReservations = await api.pullReservations(
          subDays(new Date(), 1),
          addDays(new Date(), 7)
        );

        // Crear reservas localmente
        for (const channelRes of newReservations) {
          await createReservationFromChannel(supabase, channelRes, hotelId);
        }
        break;
    }

    // Actualizar last_sync_at
    await supabase
      .from('channel_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', channelId);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
```

**Tiempo**: 48 horas

#### 6.4 Webhook Receiver para Reservas
**Archivo**: `supabase/functions/channel-webhook/index.ts`

```typescript
Deno.serve(async (req) => {
  const body = await req.text();
  const signature = req.headers.get('x-booking-signature');

  // Verificar firma (si Booking.com lo soporta)
  // ...

  const event = parseXML(body); // O JSON

  const supabase = createClient(/* ... */);

  switch (event.type) {
    case 'new_reservation':
      await createReservationFromChannel(supabase, event.data, event.hotel_id);
      break;

    case 'modification':
      await updateReservationFromChannel(supabase, event.data);
      break;

    case 'cancellation':
      await cancelReservationFromChannel(supabase, event.data);
      break;
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});

async function createReservationFromChannel(
  supabase: SupabaseClient,
  channelData: any,
  hotelId: string
) {
  // Mapear datos de canal a formato local
  const reservation = {
    hotel_id: hotelId,
    guest_name: channelData.guest.name,
    guest_email: channelData.guest.email,
    guest_phone: channelData.guest.phone,
    check_in: channelData.check_in,
    check_out: channelData.check_out,
    room_type_id: await mapChannelRoomTypeToLocal(channelData.room_id, hotelId),
    number_of_guests: channelData.guests,
    total_price: channelData.price * 100, // a centavos
    status: 'confirmed', // Booking.com ya cobra
    source: 'booking_com',
    external_id: channelData.reservation_id,
  };

  // Usar función existente para crear reserva (asegura inventario, etc.)
  const { data, error } = await supabase
    .from('reservations')
    .insert(reservation)
    .select()
    .single();

  if (error) throw error;

  // Crear folio automáticamente
  await supabase.from('folios').insert({
    reservation_id: data.id,
    balance: reservation.total_price,
    currency: 'DOP',
  });

  // Decrementar inventario
  await supabase.rpc('increment_inventory_reserved', {
    p_hotel_id: hotelId,
    p_room_type_id: reservation.room_type_id,
    p_start_date: reservation.check_in,
    p_end_date: reservation.check_out,
    p_quantity: 1,
  });

  // Enviar notificación a recepción
  await supabase.rpc('create_notification', {
    p_hotel_id: hotelId,
    p_title: 'Nueva reserva de Booking.com',
    p_message: `${reservation.guest_name} - ${format(reservation.check_in, 'dd/MM/yyyy')}`,
    p_type: 'reservation',
    p_entity_type: 'reservation',
    p_entity_id: data.id,
    p_target_role: 'reception',
  });

  return data;
}
```

**Tiempo**: 40 horas

#### 6.5 UI para Configuración
**Archivo**: `src/components/channels/BookingComSetup.tsx`

```typescript
export function BookingComSetup({ hotelId }: Props) {
  const [credentials, setCredentials] = useState({
    hotel_id: '',
    username: '',
    password: '',
  });

  const [roomMapping, setRoomMapping] = useState<Record<string, string>>({});

  const { data: roomTypes } = useQuery({
    queryKey: ['room_types', hotelId],
    queryFn: () => fetchRoomTypes(hotelId),
  });

  const handleConnect = async () => {
    // Validar credenciales
    const isValid = await validateBookingComCredentials(credentials);

    if (!isValid) {
      toast.error('Credenciales inválidas');
      return;
    }

    // Guardar conexión
    await supabase.from('channel_connections').insert({
      hotel_id: hotelId,
      channel_name: 'booking_com',
      credentials: credentials,
      settings: { room_mapping: roomMapping },
      is_active: true,
    });

    toast.success('Booking.com conectado exitosamente');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conectar Booking.com</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            label="Hotel ID en Booking.com"
            value={credentials.hotel_id}
            onChange={(e) => setCredentials({ ...credentials, hotel_id: e.target.value })}
          />
          <Input
            label="Usuario API"
            value={credentials.username}
            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
          />
          <Input
            label="Contraseña API"
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
          />

          <Separator />

          <div className="space-y-2">
            <Label>Mapeo de Habitaciones</Label>
            {roomTypes?.map(roomType => (
              <div key={roomType.id} className="flex items-center gap-4">
                <span className="w-40">{roomType.name}</span>
                <Input
                  placeholder="ID en Booking.com"
                  value={roomMapping[roomType.id] || ''}
                  onChange={(e) => setRoomMapping({
                    ...roomMapping,
                    [roomType.id]: e.target.value,
                  })}
                />
              </div>
            ))}
          </div>

          <Button onClick={handleConnect} className="w-full">
            Conectar Canal
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Tiempo**: 16 horas

#### 6.6 Testing de Integración
- Test de push de disponibilidad
- Test de push de tarifas
- Test de pull de reservas
- Test de webhooks (modificaciones, cancelaciones)
- Manejo de errores de API (rate limits, timeouts)

**Tiempo**: 16 horas (restante)

### Entregables FASE 6
- [ ] API de Booking.com integrada
- [ ] Push de disponibilidad/tarifas funcionando
- [ ] Pull de reservas nuevas funcionando
- [ ] Webhooks para modificaciones/cancelaciones
- [ ] UI de configuración completa
- [ ] Tests de integración pasando

### Criterios de Aceptación
- ✅ Inventario se sincroniza cada hora automáticamente
- ✅ Reservas de Booking.com aparecen en sistema en <5 min
- ✅ Cancelaciones se reflejan en inventario inmediatamente
- ✅ Errores de API se logean y notifican

---

## 📚 FASE 7: DOCUMENTACIÓN (2 semanas)

**Objetivo**: Crear documentación completa para desarrolladores y usuarios
**Prioridad**: 🟡 ALTA - Facilita onboarding y soporte
**Tiempo estimado**: 80 horas (2 semanas)

### Tareas

#### 7.1 Architecture Decision Records (ADR)
Crear `docs/adr/` con decisiones técnicas importantes:

- `001-supabase-como-backend.md`
- `002-multi-tenant-con-rls.md`
- `003-react-query-para-server-state.md`
- `004-shadcn-ui-como-component-library.md`
- `005-stripe-para-pagos.md`
- `006-inventory-atomico-por-dia.md`

**Template ADR**:
```markdown
# [Número]. [Título]

**Estado**: Aceptada | Rechazada | Supersedida por [ADR-XXX]
**Fecha**: YYYY-MM-DD
**Autores**: [Nombres]

## Contexto
[Descripción del problema o situación]

## Decisión
[Qué se decidió hacer]

## Consecuencias
**Positivas**:
- [Beneficio 1]

**Negativas**:
- [Trade-off 1]

## Alternativas Consideradas
- [Alternativa 1]: [Por qué se rechazó]
```

**Tiempo**: 16 horas

#### 7.2 Documentación de API
**Archivo**: `docs/API.md`

Documentar:
- Todos los Edge Functions (parámetros, respuestas, ejemplos)
- Funciones PostgreSQL (RPC)
- Estructuras de datos principales
- Enums y tipos importantes

**Ejemplo**:
```markdown
## Edge Functions

### `create-payment-intent`

Crea un Payment Intent de Stripe para una reserva.

**Endpoint**: `POST /functions/v1/create-payment-intent`

**Headers**:
```json
{
  "Authorization": "Bearer <supabase_anon_key>",
  "Content-Type": "application/json"
}
```

**Request Body**:
```json
{
  "reservationId": "uuid",
  "amount": 50000,
  "currency": "dop"
}
```

**Response**: 200 OK
```json
{
  "clientSecret": "pi_xxx_secret_xxx"
}
```

**Errores**:
- `404`: Reserva no encontrada
- `500`: Error de Stripe
```

**Tiempo**: 24 horas

#### 7.3 Guía de Deployment
**Archivo**: `docs/DEPLOYMENT.md`

Secciones:
1. **Prerequisites** (Node, npm, Supabase CLI)
2. **Local Development Setup**
   - Clonar repo
   - Instalar dependencias
   - Configurar `.env`
   - Ejecutar migraciones
   - Iniciar dev server
3. **Production Deployment**
   - Build process
   - Deployment a Vercel/Netlify
   - Configurar Edge Functions
   - Configurar webhooks (Stripe, Booking.com)
   - Variables de entorno de producción
4. **Database Migrations**
   - Cómo crear nuevas migraciones
   - Cómo aplicarlas
   - Rollback procedures
5. **Monitoring & Logging**
   - Sentry setup
   - Supabase logs
   - Stripe dashboard

**Tiempo**: 16 horas

#### 7.4 Documentación de Usuario
**Archivos**: `docs/user-guide/`

Crear guías para cada módulo:
- `01-getting-started.md` - Primeros pasos
- `02-reservations.md` - Cómo crear/gestionar reservas
- `03-check-in-out.md` - Proceso de check-in/out
- `04-housekeeping.md` - Gestión de limpieza
- `05-billing.md` - Facturación y cobros
- `06-crm.md` - Gestión de huéspedes
- `07-analytics.md` - Leer métricas
- `08-settings.md` - Configuración del hotel
- `09-channels.md` - Conectar OTAs

Incluir:
- Screenshots
- Paso a paso
- Tips y mejores prácticas
- Solución de problemas comunes

**Tiempo**: 24 horas

### Entregables FASE 7
- [ ] 6+ ADRs documentando decisiones técnicas
- [ ] API completamente documentada
- [ ] Guía de deployment funcional
- [ ] 9 guías de usuario creadas con screenshots
- [ ] README actualizado con info relevante

### Criterios de Aceptación
- ✅ Nuevo desarrollador puede levantar proyecto local en <30 min
- ✅ Deployment a producción documentado paso a paso
- ✅ Usuario nuevo puede aprender cada módulo en <15 min
- ✅ Documentación incluye troubleshooting

---

## 🔐 FASE 8: SEGURIDAD AVANZADA (2.5 semanas)

**Objetivo**: Fortalecer seguridad para producción
**Prioridad**: 🔴 CRÍTICA - Protección de datos sensibles
**Tiempo estimado**: 100 horas (2.5 semanas)

### Tareas

#### 8.1 Auditoría de Seguridad
Revisar:
- [ ] Todas las RLS policies (permisos correctos)
- [ ] Edge Functions (input validation)
- [ ] Variables de entorno (nada en código)
- [ ] SQL Injection vulnerabilities
- [ ] XSS vulnerabilities
- [ ] CSRF protection

**Herramientas**:
```bash
npm audit
npm install -D eslint-plugin-security
```

**Tiempo**: 16 horas

#### 8.2 Rate Limiting en Edge Functions
**Archivo**: `supabase/functions/_shared/rate-limit.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const RATE_LIMITS = {
  'create-payment-intent': { requests: 10, window: 60000 }, // 10 req/min
  'sync-channel': { requests: 20, window: 60000 },
  'create-reservation': { requests: 50, window: 60000 },
};

export async function checkRateLimit(
  userId: string,
  functionName: string
): Promise<boolean> {
  const limit = RATE_LIMITS[functionName];
  if (!limit) return true;

  const supabase = createClient(/* ... */);

  const windowStart = new Date(Date.now() - limit.window);

  const { count } = await supabase
    .from('rate_limit_requests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('function_name', functionName)
    .gte('created_at', windowStart.toISOString());

  if (count >= limit.requests) {
    return false;
  }

  // Log request
  await supabase.from('rate_limit_requests').insert({
    user_id: userId,
    function_name: functionName,
  });

  return true;
}
```

Crear tabla:
```sql
CREATE TABLE rate_limit_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  function_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rate_limit_user_function_date
  ON rate_limit_requests(user_id, function_name, created_at);

-- Auto-cleanup de requests antiguos (>1 hora)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limit_requests()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limit_requests
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;
```

**Usar en Edge Functions**:
```typescript
const isAllowed = await checkRateLimit(userId, 'create-payment-intent');
if (!isAllowed) {
  return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
    status: 429,
  });
}
```

**Tiempo**: 20 horas

#### 8.3 Content Security Policy (CSP)
**Archivo**: `index.html`

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co https://api.stripe.com;
  frame-src https://js.stripe.com;
">
```

O configurar en Vercel/Netlify headers:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; ..."
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

**Tiempo**: 12 horas

#### 8.4 Validación Server-Side
Agregar validación con Zod en Edge Functions:

```typescript
import { z } from 'zod';

const CreateReservationSchema = z.object({
  hotelId: z.string().uuid(),
  guestName: z.string().min(2).max(100),
  guestEmail: z.string().email(),
  guestPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  roomTypeId: z.string().uuid(),
  numberOfGuests: z.number().int().min(1).max(10),
  totalPrice: z.number().int().positive(),
});

Deno.serve(async (req) => {
  const body = await req.json();

  // Validar input
  const result = CreateReservationSchema.safeParse(body);

  if (!result.success) {
    return new Response(JSON.stringify({
      error: 'Invalid input',
      details: result.error.flatten(),
    }), {
      status: 400,
    });
  }

  const data = result.data;

  // Validaciones de negocio
  if (new Date(data.checkOut) <= new Date(data.checkIn)) {
    return new Response(JSON.stringify({
      error: 'Check-out must be after check-in',
    }), {
      status: 400,
    });
  }

  // Continuar con lógica...
});
```

Aplicar a todos los Edge Functions.

**Tiempo**: 24 horas

#### 8.5 Implementar 2FA para Administradores
Usar Supabase Auth con TOTP:

```typescript
import { createClient } from '@supabase/supabase-js';

export async function enable2FA() {
  const supabase = createClient(/* ... */);

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
  });

  if (error) throw error;

  // Mostrar QR code para escanear con Google Authenticator
  return {
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

export async function verify2FA(code: string) {
  const supabase = createClient(/* ... */);

  const factors = await supabase.auth.mfa.listFactors();
  const factorId = factors.data.totp[0].id;

  const { data, error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code,
  });

  if (error) throw error;

  return data;
}
```

**UI Component**: `src/components/security/TwoFactorSetup.tsx`

**Tiempo**: 28 horas

### Entregables FASE 8
- [ ] Auditoría de seguridad completada y vulnerabilidades corregidas
- [ ] Rate limiting en todas las Edge Functions
- [ ] CSP headers configurados
- [ ] Validación server-side en Edge Functions
- [ ] 2FA implementado para usuarios admin

### Criterios de Aceptación
- ✅ `npm audit` muestra 0 vulnerabilidades críticas/altas
- ✅ Rate limiting funciona (429 después de límite)
- ✅ CSP no bloquea funcionalidad legítima
- ✅ Edge Functions rechazan input inválido
- ✅ Admins pueden habilitar 2FA

---

## 📊 FASE 9: ANALYTICS AVANZADOS (2 semanas)

**Objetivo**: Agregar métricas de negocio avanzadas
**Prioridad**: 🟢 MEDIA - Mejora insights de negocio
**Tiempo estimado**: 80 horas (2 semanas)

### KPIs a Implementar

#### 9.1 Length of Stay (LOS)
**Query**:
```sql
SELECT AVG(EXTRACT(DAY FROM (check_out - check_in))) as avg_los
FROM reservations
WHERE hotel_id = :hotel_id
  AND status IN ('confirmed', 'checked_in', 'checked_out')
  AND check_in >= :start_date
  AND check_in <= :end_date;
```

**Tiempo**: 8 horas

#### 9.2 Lead Time
**Query**:
```sql
SELECT AVG(EXTRACT(DAY FROM (check_in - created_at))) as avg_lead_time
FROM reservations
WHERE hotel_id = :hotel_id
  AND status IN ('confirmed', 'checked_in', 'checked_out')
  AND created_at >= :start_date;
```

**Tiempo**: 8 horas

#### 9.3 Tasa de Cancelación
**Query**:
```sql
WITH stats AS (
  SELECT
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
    COUNT(*) as total
  FROM reservations
  WHERE hotel_id = :hotel_id
    AND created_at >= :start_date
)
SELECT ROUND((cancelled::NUMERIC / total) * 100, 2) as cancellation_rate
FROM stats;
```

**Tiempo**: 8 horas

#### 9.4 Revenue por Canal
Agregar columna `source` a reservations (ya existe):
```sql
SELECT
  source,
  COUNT(*) as bookings,
  SUM(total_price) / 100.0 as revenue,
  AVG(total_price) / 100.0 as avg_booking_value
FROM reservations
WHERE hotel_id = :hotel_id
  AND status IN ('confirmed', 'checked_in', 'checked_out')
  AND check_in >= :start_date
GROUP BY source
ORDER BY revenue DESC;
```

**Tiempo**: 16 horas (incluye gráficos)

#### 9.5 Repeat Guest Rate
**Query**:
```sql
WITH guest_stays AS (
  SELECT
    guest_id,
    COUNT(*) as total_stays
  FROM reservations
  WHERE hotel_id = :hotel_id
    AND status IN ('confirmed', 'checked_in', 'checked_out')
  GROUP BY guest_id
)
SELECT
  COUNT(*) FILTER (WHERE total_stays > 1) as repeat_guests,
  COUNT(*) as total_guests,
  ROUND((COUNT(*) FILTER (WHERE total_stays > 1)::NUMERIC / COUNT(*)) * 100, 2) as repeat_rate
FROM guest_stays;
```

**Tiempo**: 12 horas

#### 9.6 Dashboard de Analytics Avanzado
Crear nueva página: `src/pages/dashboard/analytics/Advanced.tsx`

Widgets:
- Length of Stay trend (últimos 12 meses)
- Lead Time distribution (histogram)
- Cancellation rate trend
- Revenue by channel (pie chart)
- Repeat guest rate (gauge chart)
- Booking window analysis (cuándo reservan)

**Tiempo**: 28 horas

### Entregables FASE 9
- [ ] 5 KPIs nuevos implementados
- [ ] Dashboard de analytics avanzado
- [ ] Gráficos interactivos (Recharts)
- [ ] Filtros por fecha customizables
- [ ] Export de datos a CSV

### Criterios de Aceptación
- ✅ Todos los KPIs calculan correctamente
- ✅ Dashboard carga en <3 segundos
- ✅ Gráficos son interactivos y claros
- ✅ Datos se pueden exportar

---

## 🚀 FASE 10: FEATURES NUEVOS (12 semanas)

**Objetivo**: Agregar funcionalidades competitivas
**Prioridad**: 🟢 MEDIA - Expansión de producto
**Tiempo estimado**: 480 horas (12 semanas)

### 10.1 Revenue Management (3 semanas - 120 horas)

**Componentes**:
1. **Dynamic Pricing Engine** (40 horas)
   - Algoritmo de precios basado en ocupación proyectada
   - Reglas de pricing por temporada
   - Competitor rate monitoring (scraping o API)
   - Price recommendations UI

2. **Demand Forecasting** (40 horas)
   - Machine learning básico (regresión lineal)
   - Factores: estacionalidad, eventos, históricos
   - Predicción de ocupación a 30/60/90 días

3. **Rate Plan Management** (40 horas)
   - Rate plans avanzados (early bird, last minute)
   - Minimum stay requirements
   - Closed to arrival/departure rules

### 10.2 Guest Portal (3 semanas - 120 horas)

**Funcionalidades**:
1. **Self-Service Check-In** (40 horas)
   - Formulario web pre-check-in
   - Upload de documentos
   - Firma digital
   - Selección de habitación

2. **Reservation Management** (30 horas)
   - Ver detalles de reserva
   - Modificar fechas (si aplica)
   - Cancelar reserva
   - Agregar requests especiales

3. **Digital Key** (30 horas)
   - QR code para acceso a habitación
   - Integración con cerraduras inteligentes
   - Expiración automática post-checkout

4. **Guest Communication** (20 horas)
   - Chat con recepción
   - Notificaciones push
   - Confirmaciones y recordatorios

### 10.3 Mobile App (Housekeeping) (4 semanas - 160 horas)

**Tecnología**: React Native + Expo

**Features**:
1. **Task Management** (40 horas)
   - Ver asignaciones del día
   - Checklists interactivos
   - Marcar habitaciones como limpias

2. **Offline Mode** (40 horas)
   - Sync cuando hay WiFi
   - Cache local de tareas
   - Conflict resolution

3. **Photo Upload** (20 horas)
   - Fotos de incidentes
   - Evidencia de limpieza completada

4. **Push Notifications** (20 horas)
   - Nuevas asignaciones
   - Prioridades urgentes

5. **Inventory Tracking** (20 horas)
   - Escanear QR de materiales
   - Reportar bajo stock

6. **Testing & Deploy** (20 horas)
   - TestFlight (iOS)
   - Google Play Beta (Android)

### 10.4 Sistema POS (2 semanas - 80 horas)

**Módulos**:
1. **Point of Sale UI** (30 horas)
   - Menú de productos
   - Carrito de compras
   - Split bills
   - Propinas

2. **Inventory Management** (20 horas)
   - Productos y categorías
   - Stock tracking
   - Alertas de bajo stock

3. **Integration con Folios** (20 hours)
   - Cargar a habitación
   - Guest signature
   - Auto-sync con folio

4. **Reporting** (10 horas)
   - Sales reports
   - Popular items
   - Revenue by period

### 10.5 Reportes Avanzados (1.5 semanas - 60 horas)

**Features**:
1. **Report Builder** (30 horas)
   - Drag & drop fields
   - Custom filters
   - Saved templates

2. **Export Formats** (15 horas)
   - PDF (usando jsPDF)
   - Excel (usando xlsx)
   - CSV

3. **Scheduled Reports** (15 horas)
   - Email automático
   - Daily/Weekly/Monthly
   - Custom recipients

### 10.6 Multi-Idioma (0.5 semanas - 20 horas)

**Implementación**:
1. **Setup i18next** (8 horas)
   ```bash
   npm install react-i18next i18next
   ```

2. **Traducir UI** (8 horas)
   - Extraer strings a archivos JSON
   - `locales/es/translation.json`
   - `locales/en/translation.json`

3. **Language Switcher** (4 horas)
   - Dropdown en settings
   - Persistir preferencia

### Entregables FASE 10
- [ ] Revenue Management operativo
- [ ] Guest Portal lanzado
- [ ] Mobile app en app stores (beta)
- [ ] POS integrado con folios
- [ ] Report builder funcional
- [ ] Soporte inglés completo

### Criterios de Aceptación
- ✅ Revenue management genera recommendations útiles
- ✅ Guest portal tiene >50% adoption rate
- ✅ Mobile app funciona offline
- ✅ POS procesa >100 transacciones/día sin issues
- ✅ Reports se generan en <10 segundos
- ✅ Traducción al inglés >95% completa

---

## 📅 CRONOGRAMA VISUAL

```
Semana 1-2:   ██████ FASE 1: Tests & Error Handling
Semana 3:     ███ FASE 2: Datos Reales
Semana 4-5:   █████ FASE 3: TypeScript Estricto
Semana 6-7:   ██████ FASE 4: Performance
Semana 8-10:  █████████ FASE 5: Pagos (Stripe)
Semana 11-14: ████████████ FASE 6: Channel Manager
Semana 15-16: ██████ FASE 7: Documentación
Semana 17-19: ████████ FASE 8: Seguridad
Semana 20-21: ██████ FASE 9: Analytics Avanzados
Semana 22-33: ████████████████████████ FASE 10: Features Nuevos
```

**Total**: 33 semanas (~8 meses)

**MVP Producción Ready**: Semana 19 (4.5 meses)
**Lanzamiento Beta**: Semana 20
**Lanzamiento Completo**: Semana 33

---

## 🎯 MILESTONES CLAVE

### Milestone 1: MVP Básico (Semana 2)
- ✅ Tests implementados (60% coverage)
- ✅ Error handling robusto
- ✅ Datos reales (sin mocks)
- **Entregable**: Sistema estable para desarrollo

### Milestone 2: Performance & Type Safety (Semana 7)
- ✅ TypeScript strict mode
- ✅ Paginación implementada
- ✅ Skeleton loaders
- ✅ Code splitting
- **Entregable**: App rápida y confiable

### Milestone 3: Generación de Ingresos (Semana 10)
- ✅ Stripe integrado
- ✅ Pagos funcionando end-to-end
- ✅ Reembolsos operativos
- **Entregable**: Puede cobrar a clientes

### Milestone 4: Multi-Canal (Semana 14)
- ✅ Booking.com conectado
- ✅ Sincronización bidireccional
- ✅ Webhooks funcionando
- **Entregable**: Valor competitivo clave

### Milestone 5: Producción Ready (Semana 19) 🎉
- ✅ Documentación completa
- ✅ Seguridad reforzada
- ✅ Rate limiting
- ✅ 2FA para admins
- **Entregable**: Listo para clientes reales

### Milestone 6: Analytics Pro (Semana 21)
- ✅ 5+ KPIs avanzados
- ✅ Dashboard profesional
- ✅ Export de datos
- **Entregable**: Insights de negocio

### Milestone 7: Producto Completo (Semana 33) 🚀
- ✅ Revenue management
- ✅ Guest portal
- ✅ Mobile app
- ✅ POS integrado
- ✅ Reportes avanzados
- ✅ Multi-idioma
- **Entregable**: Producto tier-1 del mercado

---

## 🔄 PRÓXIMOS PASOS INMEDIATOS

### Esta Semana (Semana 1)
1. ✅ Roadmap aprobado
2. ⏳ Setup de Vitest
3. ⏳ Primer test escrito
4. ⏳ Error boundary global implementado

### Próxima Semana (Semana 2)
1. ⏳ 25+ tests escritos
2. ⏳ 60% coverage alcanzado
3. ⏳ Eliminar datos mock del dashboard
4. ⏳ Crear función `get_occupancy_stats`

### Mes 1 (Semanas 1-4)
- Completar FASES 1, 2, 3
- Sistema estable con datos reales
- TypeScript más estricto

---

## 📝 NOTAS FINALES

### Flexibilidad del Roadmap
Este roadmap es una guía, no una camisa de fuerza. Ajustar según:
- Feedback de usuarios beta
- Prioridades de negocio cambiantes
- Recursos disponibles
- Oportunidades de mercado

### Priorización Recomendada
**MUST HAVE (Semanas 1-19)**:
- Fases 1-8 son críticas para producción
- No lanzar sin completar estas fases

**SHOULD HAVE (Semanas 20-21)**:
- Fase 9 mejora competitividad
- Puede lanzarse sin ella

**NICE TO HAVE (Semanas 22-33)**:
- Fase 10 es expansión
- Agregar features según demanda

### Métricas de Éxito
Trackear semanalmente:
- ✅ Tareas completadas vs. planeadas
- ✅ Bugs encontrados en testing
- ✅ Coverage de tests
- ✅ Performance metrics (Lighthouse)
- ✅ Feedback de usuarios beta

---

**¡Éxito en el desarrollo! 🚀**
