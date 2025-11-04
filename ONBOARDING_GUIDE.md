# 🏨 Guía de Onboarding - SOLARIS PMS
**Para nuevos hoteles que se registran en el sistema**

---

## 🎯 Flujo Completo de Configuración Inicial

Cuando un hotel saca una cuenta nueva en SOLARIS PMS, debe seguir estos pasos para configurar el sistema:

---

## 📋 PASO 1: Registro y Creación de Cuenta

### 1.1 Registro del Usuario Principal
**Ubicación**: `/auth` (página de login/registro)

1. Usuario hace clic en "Registrarse"
2. Completa formulario:
   - Email
   - Contraseña
   - Confirmar contraseña
3. Sistema crea cuenta en Supabase Auth
4. Se crea perfil en tabla `profiles`

### 1.2 Creación Automática del Hotel
**Automático al primer login**

Cuando el usuario nuevo hace login por primera vez:
- Sistema detecta que no tiene hotel asignado
- **Se crea automáticamente** un hotel básico
- Usuario recibe rol `HOTEL_OWNER`
- Se crea subscripción FREE automática

**Datos iniciales del hotel**:
```typescript
{
  name: "Mi Hotel",  // Placeholder
  address: "",
  phone: "",
  email: user.email,
  created_at: NOW()
}
```

---

## ⚙️ PASO 2: Configuración del Hotel

**Ubicación**: Dashboard → Configuración → Tab "Hotel"  
**Ruta**: `/dashboard/settings`

### 2.1 Información Básica del Hotel
Usuario completa:

**Datos del Establecimiento**:
- ✏️ **Nombre del hotel** (obligatorio)
- ✏️ **Dirección completa**
- ✏️ **Teléfono de contacto**
- ✏️ **Email** (pre-llenado)
- ✏️ **Sitio web** (opcional)

**Configuración Operacional**:
- ⏰ **Hora de check-in** (default: 15:00)
- ⏰ **Hora de check-out** (default: 12:00)
- 🌍 **Zona horaria**
- 💱 **Moneda** (USD, EUR, MXN, etc.)

**Botón**: "Guardar Información"

---

## 🛏️ PASO 3: Configurar Tipos de Habitación

**Ubicación**: Dashboard → Configuración → Tab "Tipos"

### 3.1 Crear Tipos de Habitación
El hotel debe definir los tipos de habitaciones que ofrece.

**Ejemplos comunes**:
- Standard
- Deluxe
- Suite
- Suite Junior
- Suite Presidencial

**Para cada tipo, configurar**:

1. **Información Básica**:
   - ✏️ **Nombre** (ej: "Suite Deluxe")
   - ✏️ **Descripción** (ej: "Habitación amplia con vista al mar")
   - 👥 **Capacidad máxima** (número de huéspedes)
   - 🛏️ **Número de camas**
   - 🏷️ **Tipo de cama** (King, Queen, Twin, etc.)

2. **Precio Base**:
   - 💰 **Tarifa por noche** (en centavos)
   - Ejemplo: $120.00 → se guarda como 12000 centavos

3. **Características**:
   - ☑️ Wi-Fi
   - ☑️ TV
   - ☑️ Aire acondicionado
   - ☑️ Minibar
   - ☑️ Vista al mar
   - ☑️ Balcón
   - Etc.

**Botón**: "+ Agregar Tipo de Habitación"

**Vista**:
```
┌─────────────────────────────────────────────────────┐
│ Tipos de Habitación                                 │
├─────────────────────────────────────────────────────┤
│ Standard          $80.00/noche    Capacidad: 2     │
│ Deluxe            $120.00/noche   Capacidad: 3     │
│ Suite             $200.00/noche   Capacidad: 4     │
└─────────────────────────────────────────────────────┘
```

---

## 🚪 PASO 4: Agregar Habitaciones Físicas

**Ubicación**: Dashboard → Configuración → Tab "Habitaciones"

### 4.1 Crear Habitaciones Individuales
Ahora el hotel agrega cada habitación física con su número.

**Para cada habitación**:

1. **Información de Ubicación**:
   - 🔢 **Número de habitación** (ej: "101", "201", "301A")
   - 🏢 **Piso** (1, 2, 3, etc.)

2. **Tipo de Habitación**:
   - 🛏️ **Seleccionar tipo** (de los creados en Paso 3)
   - Ejemplo: Habitación 101 → Tipo "Standard"

3. **Estado Inicial**:
   - ✅ **AVAILABLE** (disponible para reservar)
   - 🚫 **OUT_OF_SERVICE** (fuera de servicio)
   - 🧹 **DIRTY** (necesita limpieza)

**Botón**: "+ Agregar Habitación"

**Funcionalidad de Bulk Add** (Agregar múltiples):
```typescript
// Ejemplo: Agregar habitaciones 101-110
Rango de inicio: 101
Rango final: 110
Piso: 1
Tipo: Standard
→ Crea 10 habitaciones automáticamente
```

**Vista Final**:
```
┌──────────────────────────────────────────────────────┐
│ Habitaciones del Hotel                               │
├──────────────────────────────────────────────────────┤
│ 101  │ Piso 1 │ Standard  │ ✅ Disponible           │
│ 102  │ Piso 1 │ Standard  │ ✅ Disponible           │
│ 103  │ Piso 1 │ Deluxe    │ ✅ Disponible           │
│ 201  │ Piso 2 │ Suite     │ ✅ Disponible           │
│ 202  │ Piso 2 │ Suite     │ 🧹 Sucia                │
└──────────────────────────────────────────────────────┘
Total: 5 habitaciones
```

---

## 💰 PASO 5: Configurar Tarifas (Opcional)

**Ubicación**: Dashboard → Configuración → Tab "Tarifas"

### 5.1 Planes de Tarifas
El hotel puede crear diferentes planes tarifarios para temporadas altas/bajas, eventos especiales, etc.

**Ejemplos de planes**:
- **Temporada Baja**: -20% sobre tarifa base
- **Temporada Alta**: +30% sobre tarifa base
- **Fin de Semana**: +15% viernes y sábado
- **Evento Especial**: +50% durante festival local

**Para cada plan**:
- ✏️ **Nombre** (ej: "Verano 2025")
- 📅 **Fecha de inicio**
- 📅 **Fecha de fin**
- 💯 **Tipo**: Porcentaje o monto fijo
- 💰 **Valor**: +30%, -$20, etc.
- 🛏️ **Tipos de habitación** que aplica

---

## 🎫 PASO 6: Códigos Promocionales (Opcional)

**Ubicación**: Dashboard → Configuración → Tab "Promos"

### 6.1 Crear Promociones
Para descuentos y ofertas especiales.

**Ejemplos**:
- `VERANO2025`: 15% de descuento
- `EARLYBIRD`: $20 USD de descuento
- `ESTANCIA3NOCHES`: 10% en reservas de 3+ noches

**Configuración**:
- 🏷️ **Código** (lo que el cliente ingresa)
- 📝 **Descripción**
- 💯 **Tipo**: Porcentaje o monto fijo
- 💰 **Valor del descuento**
- 📅 **Válido desde / hasta**
- 🌙 **Mínimo de noches** (opcional)
- 🔢 **Máximo de usos** (opcional)

---

## 💳 PASO 7: Suscripción (Importante)

**Ubicación**: Dashboard → Configuración → Tab "Suscripción"

### 7.1 Elegir Plan de Suscripción
El hotel debe elegir y pagar su plan mensual.

**Planes disponibles**:

| Plan | Precio | Habitaciones | Usuarios | Reservas/mes |
|------|--------|--------------|----------|--------------|
| **FREE** | $0 | 5 | 2 | 50 |
| **STARTER** | $29 | 20 | 5 | 200 |
| **PROFESSIONAL** | $79 | 50 | 15 | 1000 |
| **ENTERPRISE** | $199 | Ilimitado | Ilimitado | Ilimitado |

**Proceso**:
1. Seleccionar plan
2. Click "Subscribirse"
3. Redirige a Stripe Checkout
4. Completar pago
5. Sistema actualiza automáticamente

**Trial**: 14 días gratis en todos los planes (excepto FREE)

---

## ✅ CHECKLIST DE CONFIGURACIÓN INICIAL

Usuario debe completar MÍNIMO:

- [ ] Información básica del hotel
- [ ] Al menos 1 tipo de habitación creado
- [ ] Al menos 1 habitación física agregada
- [ ] Plan de suscripción elegido (aunque sea FREE)

**Una vez completado → Hotel está listo para operar!**

---

## 🚀 PASO 8: Empezar a Operar

Una vez configurado el hotel, el usuario puede:

### 8.1 Crear Primera Reserva
**Ubicación**: Dashboard → Reservas → "+ Nueva Reserva"

1. Seleccionar habitación disponible
2. Agregar información del huésped
3. Definir fechas (check-in/check-out)
4. Confirmar reserva

### 8.2 Invitar Personal
**Ubicación**: Dashboard → Staff & RRHH → "Agregar Personal"

1. Ingresar email y nombre del empleado
2. Asignar rol (MANAGER, RECEPTION, HOUSEKEEPING, etc.)
3. Sistema envía invitación por email
4. Empleado crea su cuenta y accede

### 8.3 Configurar Inventario
**Ubicación**: Dashboard → Inventario

1. Agregar artículos (toallas, amenities, productos de limpieza)
2. Definir stock actual y mínimo
3. Sistema alertará cuando stock esté bajo

---

## 📱 INTERFAZ VISUAL DEL PROCESO

### Vista del Settings Page (Tabs)
```
╔══════════════════════════════════════════════════════╗
║  Configuración                                       ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  [Hotel] [Tipos] [Habitaciones] [Tarifas] [Promos] ║
║                                                      ║
║  ┌────────────────────────────────────────────────┐ ║
║  │  Tab "Habitaciones" (PASO 4)                  │ ║
║  │                                                │ ║
║  │  ┌──────────────────────────────────────────┐ │ ║
║  │  │ + Agregar Habitación                     │ │ ║
║  │  └──────────────────────────────────────────┘ │ ║
║  │                                                │ ║
║  │  Lista de Habitaciones:                       │ ║
║  │  ┌──────────────────────────────────────────┐ │ ║
║  │  │ 101 │ Piso 1 │ Standard │ ✅ Disponible │ │ ║
║  │  │ 102 │ Piso 1 │ Deluxe   │ ✅ Disponible │ │ ║
║  │  │ 201 │ Piso 2 │ Suite    │ ✅ Disponible │ │ ║
║  │  └──────────────────────────────────────────┘ │ ║
║  └────────────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════════════╝
```

---

## ⚡ CONFIGURACIÓN RÁPIDA (15 minutos)

Para hoteles pequeños que quieren empezar rápido:

1. **Completar info básica** (2 min)
   - Nombre del hotel
   - Dirección y teléfono

2. **Crear 1 tipo de habitación** (2 min)
   - Ejemplo: "Standard" a $80/noche

3. **Agregar habitaciones en masa** (5 min)
   - Rango 101-110 → 10 habitaciones Standard

4. **Seleccionar plan FREE** (1 min)
   - Si tienen ≤5 habitaciones

5. **Crear primera reserva de prueba** (5 min)
   - Para familiarizarse con el sistema

**Total**: ✅ Hotel operacional en 15 minutos

---

## 🆘 AYUDA Y SOPORTE

### Si el usuario se pierde:

**Indicador de progreso** (en Dashboard):
```
┌────────────────────────────────────────────┐
│ ⚠️ Completa la configuración de tu hotel  │
├────────────────────────────────────────────┤
│ ✅ Información básica                      │
│ ⏳ Tipos de habitación (0 creados)         │
│ ⏳ Habitaciones (0 agregadas)              │
│ ✅ Suscripción activa                      │
│                                            │
│ [Continuar Configuración]                  │
└────────────────────────────────────────────┘
```

### Tooltips y ayuda contextual:
- Cada campo tiene icono "?" con explicación
- Videos tutoriales integrados
- Chat de soporte (futuro)

---

## 📊 DATOS DE EJEMPLO (Para Testing)

Si el hotel quiere ver cómo funciona el sistema con datos de ejemplo:

**Botón**: "Cargar Datos de Ejemplo"

Esto crea automáticamente:
- 3 tipos de habitación
- 15 habitaciones
- 5 reservas ficticias
- 2 empleados de prueba

**Advertencia**: "Estos son datos de ejemplo. Puedes eliminarlos cuando estés listo para usar datos reales."

---

## 🎓 RECURSOS ADICIONALES

### Documentación
- Manual de usuario completo
- Videos tutoriales paso a paso
- FAQ sobre configuración

### Onboarding Guiado
- Tour interactivo del sistema
- Checklist de tareas
- Progreso visible

### Soporte
- Email: support@solaris-pms.com
- Chat en vivo (horario de oficina)
- Centro de ayuda: help.solaris-pms.com

---

## ✨ MEJORAS FUTURAS

### Onboarding Wizard (Próxima versión)
Wizard paso a paso que guía al usuario:
```
Paso 1 de 5: Información del Hotel
Paso 2 de 5: Tipos de Habitación
Paso 3 de 5: Agregar Habitaciones
Paso 4 de 5: Configuración de Tarifas
Paso 5 de 5: Invitar al Equipo
```

### Import desde Excel
Permitir que el hotel importe:
- Lista de habitaciones desde CSV/Excel
- Tipos de habitación
- Personal existente

### Integración con PMS Legacy
Migración automática desde otros sistemas.

---

**El sistema está diseñado para que cualquier hotel pueda estar operacional en 15-30 minutos, sin necesidad de soporte técnico.**

---

*Última actualización: Noviembre 2025*  
*SOLARIS PMS v1.0*
