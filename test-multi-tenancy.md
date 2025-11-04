# Manual de Testing Multi-tenancy - SOLARIS PMS

## 🎯 Objetivo
Verificar que el aislamiento de datos entre hoteles funciona correctamente y que los usuarios solo pueden acceder a datos de su propio hotel.

---

## 📋 Preparación

### 1. Crear Dos Hoteles de Prueba

**Hotel A**: "Hotel Paradise"
**Hotel B**: "Hotel Ocean View"

**Desde Supabase Dashboard → SQL Editor**:

```sql
-- Crear Hotel A
INSERT INTO hotels (id, name, address, phone, email)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Hotel Paradise',
  '123 Beach Road',
  '+1-555-0001',
  'paradise@test.com'
);

-- Crear Hotel B  
INSERT INTO hotels (id, name, address, phone, email)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Hotel Ocean View',
  '456 Ocean Drive',
  '+1-555-0002',
  'ocean@test.com'
);
```

### 2. Crear Usuarios de Prueba

**Usuario A** (para Hotel A):
- Email: `manager-a@test.com`
- Password: `TestPass123!`

**Usuario B** (para Hotel B):
- Email: `manager-b@test.com`
- Password: `TestPass123!`

**Desde la aplicación**:
1. Registrarse con cada email
2. Verificar emails si es necesario

### 3. Asignar Roles

**Desde Supabase Dashboard → SQL Editor**:

```sql
-- Obtener IDs de usuarios (reemplazar emails)
SELECT id, email FROM auth.users WHERE email LIKE '%test.com';

-- Asignar Usuario A a Hotel A como MANAGER
INSERT INTO user_roles (user_id, hotel_id, role)
VALUES (
  'USER_A_ID_AQUI',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'MANAGER'
);

-- Asignar Usuario B a Hotel B como MANAGER
INSERT INTO user_roles (user_id, hotel_id, role)
VALUES (
  'USER_B_ID_AQUI',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'MANAGER'
);
```

### 4. Crear Datos de Prueba

**Habitaciones para Hotel A**:
```sql
INSERT INTO rooms (hotel_id, room_number, room_type, floor, status)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '101', 'STANDARD', 1, 'AVAILABLE'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '102', 'DELUXE', 1, 'AVAILABLE');
```

**Habitaciones para Hotel B**:
```sql
INSERT INTO rooms (hotel_id, room_number, room_type, floor, status)
VALUES 
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '201', 'STANDARD', 2, 'AVAILABLE'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '202', 'SUITE', 2, 'AVAILABLE');
```

---

## 🧪 TESTS DE SEGURIDAD

### TEST 1: Aislamiento de Hoteles

**Objetivo**: Verificar que usuarios de Hotel A no pueden ver datos de Hotel B

**Pasos**:
1. Login como `manager-a@test.com`
2. Ir a Dashboard → Habitaciones
3. **ESPERADO**: Ver solo habitaciones 101, 102
4. **NO DEBE VER**: Habitaciones 201, 202

**Verificación SQL** (desde Supabase Dashboard, impersonando Usuario A):
```sql
-- Debe retornar solo habitaciones de Hotel A
SELECT room_number, hotel_id FROM rooms;

-- Resultado esperado:
-- 101 | aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
-- 102 | aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
-- (NO debe incluir 201, 202)
```

✅ **PASS** si solo ve habitaciones de su hotel  
❌ **FAIL** si ve habitaciones de ambos hoteles

---

### TEST 2: Intento de Acceso Cross-Tenant

**Objetivo**: Verificar que queries directas no permiten acceso a otros hoteles

**Pasos** (desde Supabase SQL Editor, impersonando Usuario A):

```sql
-- Intentar acceder explícitamente a habitaciones del Hotel B
SELECT * FROM rooms 
WHERE hotel_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
```

**ESPERADO**: 0 resultados (RLS bloquea el acceso)

✅ **PASS** si retorna 0 filas  
❌ **FAIL** si retorna habitaciones del Hotel B

---

### TEST 3: Reservas Cross-Tenant

**Objetivo**: Verificar aislamiento en reservas

**Setup**:
```sql
-- Crear huésped para Hotel A
INSERT INTO guests (hotel_id, full_name, email, phone)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'John Doe',
  'john@test.com',
  '+1-555-1234'
) RETURNING id;

-- Crear reserva para Hotel A (usar ID del huésped y habitación 101)
INSERT INTO reservations (
  hotel_id,
  guest_id,
  room_id,
  check_in,
  check_out,
  status,
  number_of_guests,
  total_amount_cents
)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'GUEST_ID_AQUI',
  'ROOM_101_ID_AQUI',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '2 days',
  'CONFIRMED',
  2,
  20000
);
```

**Test**:
1. Login como Usuario A → Ver reservas
2. **ESPERADO**: Ver la reserva de John Doe
3. Login como Usuario B → Ver reservas  
4. **ESPERADO**: NO ver la reserva de John Doe

✅ **PASS** si cada usuario solo ve reservas de su hotel  
❌ **FAIL** si Usuario B ve reservas de Hotel A

---

### TEST 4: Folios y Cargos

**Objetivo**: Verificar que folios están aislados por hotel

**Test**:
```sql
-- Como Usuario A, intentar ver todos los folios
SELECT f.id, r.hotel_id 
FROM folios f
JOIN reservations r ON f.reservation_id = r.id;
```

**ESPERADO**: Solo folios de reservas del Hotel A

✅ **PASS** si solo ve folios de su hotel  
❌ **FAIL** si ve folios de otros hoteles

---

### TEST 5: Inventario

**Setup**:
```sql
-- Agregar items de inventario para Hotel A
INSERT INTO inventory_items (hotel_id, name, category, unit, current_stock, min_stock, unit_cost_cents)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Toalla Hotel A', 'LINENS', 'unit', 100, 20, 500);

-- Agregar items para Hotel B
INSERT INTO inventory_items (hotel_id, name, category, unit, current_stock, min_stock, unit_cost_cents)
VALUES 
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Toalla Hotel B', 'LINENS', 'unit', 50, 10, 500);
```

**Test**:
1. Login como Usuario A → Inventario
2. **ESPERADO**: Ver solo "Toalla Hotel A"
3. **NO DEBE VER**: "Toalla Hotel B"

✅ **PASS** si cada hotel solo ve su inventario  
❌ **FAIL** si ve inventario de ambos hoteles

---

### TEST 6: Tareas y Mantenimiento

**Setup**:
```sql
-- Crear tarea para Hotel A
INSERT INTO tasks (
  hotel_id,
  title,
  description,
  task_type,
  priority,
  status,
  created_by
)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Reparar AC - Hotel A',
  'Aire acondicionado de habitación 101',
  'MAINTENANCE',
  'HIGH',
  'PENDING',
  'USER_A_ID_AQUI'
);
```

**Test**:
1. Login como Usuario B → Tareas
2. **ESPERADO**: NO ver la tarea "Reparar AC - Hotel A"

✅ **PASS** si no ve tareas de otros hoteles  
❌ **FAIL** si ve tareas de Hotel A

---

### TEST 7: Staff y Roles

**Objetivo**: Verificar que cada hotel solo ve su propio staff

**Test**:
1. Login como Usuario A → Staff & RRHH
2. **ESPERADO**: Ver solo staff de Hotel A
3. Login como Usuario B → Staff & RRHH
4. **ESPERADO**: Ver solo staff de Hotel B

✅ **PASS** si cada hotel solo ve su personal  
❌ **FAIL** si ve staff de otros hoteles

---

### TEST 8: Reportes

**Objetivo**: Verificar que reportes solo muestran datos del hotel correspondiente

**Test**:
1. Login como Usuario A → Reportes
2. Ver reporte de ocupación
3. **ESPERADO**: Solo incluir habitaciones y reservas de Hotel A
4. Exportar a Excel
5. **VERIFICAR**: Excel solo contiene datos de Hotel A

✅ **PASS** si reportes están aislados correctamente  
❌ **FAIL** si reportes incluyen datos de múltiples hoteles

---

## 🔒 TEST DE PENETRACIÓN BÁSICO

### Intento 1: Query Injection via URL

**Objetivo**: Intentar acceder a datos mediante manipulación de URL

**Pasos**:
1. Login como Usuario A
2. Ir a `/dashboard/reservations`
3. Inspeccionar Network requests
4. Identificar queries a Supabase
5. Intentar modificar filtros en la consola del navegador

**ESPERADO**: RLS debe bloquear cualquier query que intente acceder a otro hotel

### Intento 2: JWT Token Manipulation

**Objetivo**: Verificar que tokens no pueden ser manipulados

**Pasos**:
1. Obtener JWT token desde localStorage
2. Decodificar en jwt.io
3. Verificar que contiene user_id
4. **NO DEBE** contener hotel_id directamente (para evitar manipulación)

**ESPERADO**: hotel_id se obtiene del backend vía user_roles, no del token

### Intento 3: API Direct Access

**Test SQL** (simular query sin autenticación):
```sql
-- Resetear rol
RESET ROLE;

-- Intentar query sin autenticación
SELECT * FROM rooms;
```

**ESPERADO**: Error de permisos o 0 resultados

---

## 📊 CHECKLIST DE RESULTADOS

Marcar cada test después de ejecutarlo:

- [ ] TEST 1: Aislamiento de Hoteles
- [ ] TEST 2: Intento de Acceso Cross-Tenant
- [ ] TEST 3: Reservas Cross-Tenant
- [ ] TEST 4: Folios y Cargos
- [ ] TEST 5: Inventario
- [ ] TEST 6: Tareas y Mantenimiento
- [ ] TEST 7: Staff y Roles
- [ ] TEST 8: Reportes
- [ ] Intento 1: Query Injection via URL
- [ ] Intento 2: JWT Token Manipulation
- [ ] Intento 3: API Direct Access

**Score**: ___/11 tests pasados

---

## ✅ CRITERIOS DE ÉXITO

**TODOS los tests deben pasar** para considerar el sistema seguro.

Si algún test falla:
1. Identificar la tabla/módulo afectado
2. Revisar RLS policies en las migraciones
3. Verificar queries en el frontend
4. Crear issue y fix antes de deployment

---

## 🚨 QUÉ HACER SI UN TEST FALLA

### Si TEST 1-8 fallan:
1. Revisar RLS policy de la tabla afectada
2. Verificar filtro por hotel_id en el frontend
3. Probar query directamente en SQL Editor

### Si Tests de Penetración fallan:
1. **CRÍTICO** - No deployar hasta resolver
2. Revisar todas las RLS policies
3. Considerar auditoría de seguridad externa

---

**Documento creado**: 3 de Noviembre, 2025  
**Para**: Testing pre-deployment de SOLARIS PMS  
**Tiempo estimado**: 1-2 horas (setup + tests)
