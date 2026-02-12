# DIAGRAMAS VISUALES UX/UI - HOTELMATE

Complemento al documento principal de análisis UX/UI.

---

## 1. SITEMAP COMPLETO

```
HOTELMATE PLATFORM
│
├── PUBLIC SITE
│   ├── Landing Page (/)
│   │   ├── Header Navigation
│   │   ├── Hero Section
│   │   ├── Features Grid
│   │   ├── Statistics
│   │   ├── CTA Section
│   │   └── Footer
│   │
│   └── Authentication (/auth)
│       ├── Sign In Tab
│       ├── Sign Up Tab
│       └── Password Recovery Flow
│
└── AUTHENTICATED APP (/dashboard)
    │
    ├── LAYOUT WRAPPER
    │   ├── AppSidebar (Collapsible)
    │   ├── Top Header
    │   │   ├── Sidebar Toggle
    │   │   ├── Hotel Info
    │   │   ├── Notification Bell
    │   │   └── User Menu
    │   └── Main Content Area
    │
    ├── OPERATIONS MODULE
    │   ├── Dashboard Home (/)
    │   │   ├── KPI Cards
    │   │   ├── Check-ins/outs Today
    │   │   ├── Reservation Status
    │   │   ├── Revenue Chart
    │   │   ├── Overall Rating
    │   │   ├── Pending Tasks
    │   │   └── Guest List
    │   │
    │   ├── Reservations (/reservations)
    │   │   ├── Quick Stats
    │   │   ├── New Reservation Button
    │   │   ├── Filters Panel
    │   │   └── Views
    │   │       ├── Timeline View
    │   │       ├── List View
    │   │       └── Calendar View
    │   │
    │   ├── Front Desk (/front-desk)
    │   │   ├── Today Arrivals
    │   │   ├── Today Departures
    │   │   ├── In-House Guests
    │   │   ├── Room Status Grid
    │   │   └── Quick Actions
    │   │       ├── Walk-in Dialog
    │   │       └── New Reservation
    │   │
    │   ├── Housekeeping (/housekeeping)
    │   │   ├── Daily Stats
    │   │   ├── Cleaning Priority
    │   │   ├── Today Checkouts
    │   │   ├── Room Checklist
    │   │   ├── Incident Reports
    │   │   ├── Materials Inventory
    │   │   └── Rooms by Status
    │   │
    │   └── Tasks (/tasks)
    │       ├── Task List
    │       ├── Create Task
    │       ├── Filters (Type, Priority, Status)
    │       └── Assignment
    │
    ├── SALES & MARKETING MODULE
    │   ├── CRM (/crm)
    │   │   ├── CRM Stats
    │   │   ├── Guests List
    │   │   │   ├── Search
    │   │   │   ├── Filters (VIP, Country)
    │   │   │   └── Sort Options
    │   │   └── Guest Details Dialog
    │   │       ├── Personal Info
    │   │       ├── Reservation History
    │   │       ├── Notes
    │   │       └── Preferences
    │   │
    │   └── Channels (/channels)
    │       ├── Channel Connections
    │       ├── Sync Status
    │       ├── Mapping Config
    │       └── Rate Push
    │
    ├── FINANCE MODULE
    │   ├── Billing (/billing)
    │   │   ├── Billing Stats
    │   │   ├── Active Folios
    │   │   ├── Recent Transactions
    │   │   └── Folio Details Dialog
    │   │       ├── Charges List
    │   │       ├── Add Charge
    │   │       ├── Process Payment
    │   │       └── Payment History
    │   │
    │   ├── Analytics (/analytics)
    │   │   ├── Revenue Charts
    │   │   ├── Occupancy Trends
    │   │   ├── ADR Analysis
    │   │   ├── RevPAR Tracking
    │   │   └── Custom Date Ranges
    │   │
    │   └── Reports (/reports)
    │       ├── Report Templates
    │       ├── Custom Reports
    │       ├── Export Options (PDF, Excel)
    │       └── Scheduled Reports
    │
    ├── ADMINISTRATION MODULE
    │   ├── Staff (/staff)
    │   │   ├── Staff Statistics
    │   │   ├── Pending Invitations
    │   │   ├── Staff List
    │   │   │   ├── All Tab
    │   │   │   ├── Management Tab
    │   │   │   └── Operations Tab
    │   │   ├── Add Staff Dialog
    │   │   └── Future Features
    │   │       ├── Shifts (Coming Soon)
    │   │       ├── Attendance (Coming Soon)
    │   │       └── Performance (Coming Soon)
    │   │
    │   ├── Inventory (/inventory)
    │   │   ├── Stats Cards
    │   │   │   ├── Total Items
    │   │   │   ├── Low Stock
    │   │   │   ├── Out of Stock
    │   │   │   └── Total Value
    │   │   ├── Search & Filters
    │   │   ├── Items List
    │   │   ├── Add Item Dialog
    │   │   └── Inventory Movement Dialog
    │   │
    │   ├── Security (/security)
    │   │   ├── Audit Logs
    │   │   ├── Data Access Logs
    │   │   ├── Permission Matrix
    │   │   └── GDPR Compliance
    │   │
    │   └── Settings (/settings)
    │       ├── Hotel Tab
    │       │   ├── Basic Info
    │       │   ├── Address
    │       │   └── Tax Config
    │       ├── Room Types Tab
    │       │   ├── Types List
    │       │   ├── Create/Edit
    │       │   └── Pricing
    │       ├── Rooms Tab
    │       │   ├── Rooms List
    │       │   ├── Add Room
    │       │   └── Floor Assignment
    │       ├── Rate Plans Tab
    │       │   ├── Plans List
    │       │   ├── Create Plan
    │       │   └── Modifiers
    │       ├── Promo Codes Tab
    │       │   ├── Codes List
    │       │   └── Create Code
    │       └── Subscription Tab
    │           ├── Current Plan
    │           ├── Usage Stats
    │           └── Upgrade Options
    │
    └── USER PROFILE (/profile)
        ├── Personal Info
        ├── Change Password
        ├── Preferences
        └── Theme Settings
```

---

## 2. INFORMACIÓN ARCHITECTURE - CARD SORTING RESULTS

### Categorías Mentales de Usuarios

```
OPERACIONES DEL DÍA A DÍA
├── Dashboard (Vista general)
├── Front Desk (Llegadas/Salidas)
├── Housekeeping (Limpieza)
└── Tasks (Tareas pendientes)

GESTIÓN DE RESERVAS Y CLIENTES
├── Reservations (Reservas)
├── CRM (Base de clientes)
└── Channels (Distribución)

FINANZAS Y REPORTING
├── Billing (Facturación)
├── Analytics (Métricas)
└── Reports (Reportes)

ADMINISTRACIÓN
├── Staff (Personal)
├── Inventory (Suministros)
├── Settings (Configuración)
└── Security (Seguridad)
```

---

## 3. USER JOURNEY MAP - RECEPCIONISTA (Día Típico)

```
HORA  | ACTIVIDAD                    | MÓDULO      | EMOCIÓN | PAIN POINTS
------|------------------------------|-------------|---------|------------------
07:00 | Revisar llegadas del día     | Front Desk  | 😊      | -
07:15 | Verificar habitaciones listas| Housekeeping| 😐      | Cambio de módulo
08:00 | Check-out madrugador         | Front Desk  | 😊      | -
08:30 | Procesar pago                | Billing     | 😐      | Múltiples pasos
09:00 | Walk-in llegada temprana     | Front Desk  | 😊      | -
09:15 | Asignar habitación           | Front Desk  | 😐      | Manual, no auto
10:00 | Nueva reserva telefónica     | Reservations| 😊      | -
11:00 | Consulta de huésped VIP      | CRM         | 😐      | Navegar entre tabs
12:00 | Check-in primer huésped      | Front Desk  | 😊      | -
14:00 | Múltiples check-ins          | Front Desk  | 😰      | Proceso lento
15:00 | Resolver incidencia          | Tasks       | 😐      | Crear tarea manual
16:00 | Check-in late arrival        | Front Desk  | 😊      | -
17:00 | Revisar folios activos       | Billing     | 😐      | -
18:00 | Fin de turno                 | Dashboard   | 😊      | Resumen claro

LEYENDA:
😊 = Satisfecho
😐 = Neutral/Funcional
😰 = Estresado/Frustrado
```

---

## 4. WIREFRAMES DE FLUJOS CRÍTICOS

### 4.1 Onboarding Flow (PROPUESTO)

```
┌────────────────────────────────────────┐
│  PASO 1: BIENVENIDA                    │
│  ┌──────────────────────────────────┐  │
│  │  👋 ¡Bienvenido a SOLARIS PMS!   │  │
│  │                                   │  │
│  │  Tu sistema hotelero completo    │  │
│  │                                   │  │
│  │  [Comenzar Tour] [Saltar]        │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  PASO 2: DASHBOARD TOUR                │
│  ┌──────────────────────────────────┐  │
│  │  📊 Dashboard Principal          │  │
│  │                                   │  │
│  │  Aquí verás los KPIs más        │  │
│  │  importantes de tu hotel         │  │
│  │                                   │  │
│  │  [Anterior] [Siguiente] [2/5]    │  │
│  └──────────────────────────────────┘  │
│         ↓ (Spotlight)                  │
│  ┌──────────────────┐                  │
│  │ KPI CARDS        │ ← Destacado      │
│  └──────────────────┘                  │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  PASO 5: CHECKLIST DE CONFIGURACIÓN   │
│  ┌──────────────────────────────────┐  │
│  │  ✓ Configura tu hotel            │  │
│  │                                   │  │
│  │  ☐ Agregar tipos de habitación   │  │
│  │  ☐ Agregar habitaciones          │  │
│  │  ☐ Configurar tarifas            │  │
│  │  ☐ Invitar staff                 │  │
│  │  ☐ Crear primera reserva         │  │
│  │                                   │  │
│  │  [Ir a Settings]                 │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

### 4.2 Quick Check-in Flow (PROPUESTO)

```
┌─────────────────────────────────────────────────┐
│  QUICK CHECK-IN                                  │
│  ┌───────────────────────────────────────────┐  │
│  │  🔍 Buscar Reserva                        │  │
│  │  [Juan Perez_______________] 🔍           │  │
│  │                                            │  │
│  │  Resultados:                              │  │
│  │  ┌────────────────────────────────────┐  │  │
│  │  │ ✓ Juan Pérez                       │  │  │
│  │  │   Reserva #1234                    │  │  │
│  │  │   Standard Room - 2 huéspedes      │  │  │
│  │  │   Check-in: Hoy 2:00 PM            │  │  │
│  │  │   [Seleccionar]                    │  │  │
│  │  └────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
              ↓ (Click Seleccionar)
┌─────────────────────────────────────────────────┐
│  ASIGNACIÓN AUTOMÁTICA                          │
│  ┌───────────────────────────────────────────┐  │
│  │  🏨 Habitación Sugerida: 301             │  │
│  │                                            │  │
│  │  ┌──────────────────────────────────┐    │  │
│  │  │  Habitación 301                  │    │  │
│  │  │  Piso 3 - Vista al mar          │    │  │
│  │  │  ✓ Limpia y lista               │    │  │
│  │  │  ✓ Matching preferences         │    │  │
│  │  └──────────────────────────────────┘    │  │
│  │                                            │  │
│  │  [Cambiar Habitación] [Confirmar ✓]      │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
              ↓ (Click Confirmar)
┌─────────────────────────────────────────────────┐
│  VERIFICACIÓN FINAL                             │
│  ┌───────────────────────────────────────────┐  │
│  │  📋 Checklist                            │  │
│  │                                            │  │
│  │  ☑ Documento verificado                  │  │
│  │  ☑ Tarjeta registrada                    │  │
│  │  ☑ Términos aceptados                    │  │
│  │                                            │  │
│  │  🎉 ¡Todo listo!                         │  │
│  │                                            │  │
│  │  [Completar Check-in]                    │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### 4.3 Command Palette (PROPUESTO)

```
┌─────────────────────────────────────────────────┐
│  CMD+K / CTRL+K                                  │
│  ┌───────────────────────────────────────────┐  │
│  │  🔍 Buscar acciones, páginas, huéspedes  │  │
│  │  [nueva reserva______________]            │  │
│  │                                            │  │
│  │  ACCIONES                                 │  │
│  │  ┌────────────────────────────────────┐  │  │
│  │  │ ➕ Nueva Reserva                   │  │  │
│  │  │ 🔑 Check-in Rápido                │  │  │
│  │  │ 🚪 Check-out Rápido               │  │  │
│  │  │ ✅ Nueva Tarea                    │  │  │
│  │  └────────────────────────────────────┘  │  │
│  │                                            │  │
│  │  NAVEGACIÓN                               │  │
│  │  ┌────────────────────────────────────┐  │  │
│  │  │ 🏨 Ir a Reservations              │  │  │
│  │  │ 🛏️ Ir a Housekeeping              │  │  │
│  │  │ 💰 Ir a Billing                   │  │  │
│  │  └────────────────────────────────────┘  │  │
│  │                                            │  │
│  │  esc para cerrar                          │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 5. MOBILE WIREFRAMES (PROPUESTO)

### 5.1 Dashboard Mobile

```
┌─────────────────┐
│ ☰  Hotel Name 🔔│  ← Header compacto
├─────────────────┤
│                 │
│  📊 HOY         │
│  ┌───────────┐ │
│  │ Ocupación │ │
│  │   85%     │ │
│  └───────────┘ │
│  ┌───────────┐ │
│  │ Check-ins │ │
│  │     5     │ │
│  └───────────┘ │
│                 │
│  📋 TAREAS      │
│  ┌───────────────┐
│  │ • Limpieza 301│
│  │ • AC roto 205 │
│  └───────────────┘
│                 │
│  👥 LLEGADAS    │
│  ┌───────────────┐
│  │ Juan P. 2:00PM│
│  │ María G. 3:00PM│
│  └───────────────┘
│                 │
│                 │
│   ┌─┐           │
│   │+│ ← FAB     │
│   └─┘           │
├─────────────────┤
│🏠 📅 🔔 👤     │  ← Bottom Nav
└─────────────────┘
```

### 5.2 Reservations Mobile

```
┌─────────────────┐
│ ← Reservations  │
│                 │
│ [Nueva Reserva] │
├─────────────────┤
│ 🔍 Buscar...    │
│ 🎚️ Filtros      │
├─────────────────┤
│                 │
│ ┌─────────────┐│
│ │ Reserva #123││
│ │ Juan Pérez  ││
│ │ Check-in hoy││
│ │ ✓ Confirmada││
│ │ [Ver más >] ││
│ └─────────────┘│
│                 │
│ ┌─────────────┐│
│ │ Reserva #124││
│ │ María García││
│ │ 15-20 Nov   ││
│ │ ⏳ Pendiente ││
│ │ [Ver más >] ││
│ └─────────────┘│
│                 │
├─────────────────┤
│🏠 📅 🔔 👤     │
└─────────────────┘
```

---

## 6. ESTADO DE DISEÑO ACTUAL VS PROPUESTO

### Color System

**Actual:**
```css
Primary:   #0EA5E9 (Sky Blue)
Secondary: #F59E0B (Amber)
Success:   #10B981 (Green)
Warning:   #F59E0B (Amber)
Error:     #EF4444 (Red)
```

**Propuesto (Mantener):**
```css
/* Colores modulares existentes */
Reservations:    #A855F7 (Purple)
Front-Desk:      #3B82F6 (Blue)
Housekeeping:    #EC4899 (Pink)
Billing:         #10B981 (Green)
Channel-Manager: #F97316 (Orange)
CRM:             #06B6D4 (Cyan)
Analytics:       #8B5CF6 (Violet)
```

### Typography

**Actual:**
```
Font Family: Inter (Google Fonts)
Base Size:   16px
Scale:       1.25 (Major Third)

Headings:
  h1: 3xl (30px)   - Page titles
  h2: 2xl (24px)   - Section titles
  h3: xl (20px)    - Card titles
  h4: lg (18px)    - Sub-sections
```

### Spacing System

```
Base unit: 4px (0.25rem)

Gap-2:  8px   - Tight spacing
Gap-4:  16px  - Default spacing
Gap-6:  24px  - Section spacing
Gap-8:  32px  - Large spacing
```

---

## 7. COMPONENT STATES

### Button States

```
DEFAULT     [Comenzar]
HOVER       [Comenzar] ← Slight scale + opacity
ACTIVE      [Comenzar] ← Darker shade
LOADING     [⟳ Cargando...]
DISABLED    [Comenzar] ← Muted + no pointer
```

### Input States

```
EMPTY       [              ]
FOCUSED     [|             ] ← Blue border
FILLED      [Juan Pérez    ]
ERROR       [              ] ← Red border + message
DISABLED    [              ] ← Gray background
```

### Card States

```
DEFAULT     ┌──────────┐
            │  Content │
            └──────────┘

HOVER       ┌──────────┐
            │  Content │ ← Slight elevation
            └──────────┘

SELECTED    ┌──────────┐
            │  Content │ ← Blue border
            └──────────┘
```

---

## 8. RESPONSIVE BREAKPOINTS

```
Mobile:    < 640px   (sm)
Tablet:    640-1024px (md-lg)
Desktop:   > 1024px  (xl)

Layout Adaptations:

Mobile:
- Bottom navigation
- Stacked cards
- Collapsed sidebar
- Single column

Tablet:
- Side navigation (collapsed by default)
- 2 column grid
- Compact header

Desktop:
- Full sidebar
- 3-4 column grid
- Expanded header with all info
```

---

## 9. ANIMATION GUIDELINES

### Durations

```
Micro:      150ms  - Hover effects, ripples
Short:      300ms  - Dialogs, dropdowns
Medium:     500ms  - Page transitions
Long:       800ms  - Complex animations
```

### Easing

```
ease-in:     Accelerating from zero
ease-out:    Decelerating to zero (Default)
ease-in-out: Acceleration then deceleration
```

### Use Cases

```
Hover:       ease-out 150ms
Click:       ease-in-out 300ms
Dialog Open: ease-out 300ms
Page Change: ease-in-out 500ms
```

---

## 10. ICONOGRAPHY SYSTEM

### Icon Library
**Current**: Lucide React (feathericons fork)

### Icon Sizes

```
xs:  12px  - Inline with text
sm:  16px  - Small buttons, tags
md:  20px  - Default buttons
lg:  24px  - Large buttons, headers
xl:  32px  - Feature icons
```

### Icon Colors

```
Default:      text-foreground
Muted:        text-muted-foreground
Primary:      text-primary
Success:      text-success
Warning:      text-warning
Error:        text-destructive
```

### Key Icons per Module

```
Dashboard:      Home
Reservations:   CalendarDays
Front Desk:     Hotel
Housekeeping:   BedDouble
Billing:        CreditCard
Channels:       Network
CRM:            Users
Inventory:      Package
Tasks:          ClipboardList
Staff:          UserCog
Analytics:      BarChart3
Reports:        FileBarChart2
Settings:       Settings
Security:       Shield
```

---

## 11. LOADING STATES

### Page Load

```
┌─────────────────────┐
│  ⟳  Cargando...    │
│                     │
│  ▭▭▭▭▭▭▭▭▭▭▭      │ ← Progress bar
└─────────────────────┘
```

### Skeleton Screens

```
┌─────────────────────┐
│  ▭▭▭▭▭▭▭▭▭▭▭      │ ← Title skeleton
│                     │
│  ┌───────────────┐ │
│  │ ▭▭▭▭▭▭▭▭▭   │ │ ← Card skeleton
│  │ ▭▭▭▭▭▭      │ │
│  │ ▭▭▭▭▭▭▭▭    │ │
│  └───────────────┘ │
└─────────────────────┘
```

### Button Loading

```
[⟳ Procesando...] ← Spinner + text
[Disabled state]
```

---

## 12. ERROR STATES

### Form Errors

```
┌─────────────────────┐
│  Email *            │
│  [juan@email       ]│ ← Red border
│  ❌ Email inválido  │ ← Error message
└─────────────────────┘
```

### Page Errors

```
┌─────────────────────────┐
│         ⚠️              │
│   Error al cargar datos │
│                         │
│   [Reintentar]          │
└─────────────────────────┘
```

### Empty States

```
┌─────────────────────────┐
│         📭              │
│   No hay reservas       │
│                         │
│   [Nueva Reserva]       │
└─────────────────────────┘
```

---

## 13. NOTIFICATION PATTERNS

### Toast Notifications

```
Success:
┌──────────────────────┐
│ ✓ Reserva creada    │
└──────────────────────┘

Error:
┌──────────────────────┐
│ ❌ Error al guardar  │
└──────────────────────┘

Info:
┌──────────────────────┐
│ ℹ️ Check-in a las 2PM│
└──────────────────────┘

Warning:
┌──────────────────────┐
│ ⚠️ Stock bajo        │
└──────────────────────┘
```

### Position
- Desktop: Top-right
- Mobile: Bottom (above nav)

### Duration
- Success/Info: 3s
- Warning: 5s
- Error: Until dismissed

---

## 14. MODAL PATTERNS

### Small Dialog

```
┌─────────────────────────────┐
│  ✕  Confirmar Acción       │
│                             │
│  ¿Estás seguro?             │
│                             │
│  [Cancelar]  [Confirmar]   │
└─────────────────────────────┘
```

### Medium Dialog (Form)

```
┌─────────────────────────────┐
│  ✕  Nueva Reserva          │
│                             │
│  Nombre:  [              ] │
│  Email:   [              ] │
│  Fechas:  [  ] - [  ]     │
│                             │
│  [Cancelar]  [Crear]       │
└─────────────────────────────┘
```

### Large Dialog (Details)

```
┌─────────────────────────────┐
│  ✕  Detalles de Reserva    │
│  ┌─────────────────────┐   │
│  │ Tabs:               │   │
│  │ Info | Folio | Hist│   │
│  ├─────────────────────┤   │
│  │                     │   │
│  │ Content Area        │   │
│  │                     │   │
│  └─────────────────────┘   │
│                             │
│  [Cerrar]  [Editar]        │
└─────────────────────────────┘
```

---

## 15. DATA VISUALIZATION

### KPI Card Pattern

```
┌─────────────────┐
│ 📊 Ocupación   │
│                 │
│     85%        │ ← Large number
│                 │
│ ↑ +12% vs ayer│ ← Trend
└─────────────────┘
```

### Chart Types Used

```
Line Chart:    Revenue over time
Bar Chart:     Occupancy by room type
Pie Chart:     Reservation status distribution
Gauge:         Capacity utilization
```

### Color Coding

```
Positive trend:  Green
Negative trend:  Red
Neutral:         Blue/Gray
```

---

FIN DEL DOCUMENTO DE DIAGRAMAS VISUALES
