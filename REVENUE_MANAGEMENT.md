# Sistema de Revenue Management (Gestión de Ingresos)

## Descripción General

El sistema de Revenue Management de SOLARIS PMS permite al hotel optimizar sus tarifas basándose en:
- Historial de precios propios
- Tarifas de competidores
- Porcentaje de ocupación
- Algoritmo de pricing dinámico

## Componentes del Sistema

### 1. Base de Datos

#### Tablas Principales:

**`rate_history`** - Historial de precios del hotel
- `hotel_id`: ID del hotel
- `room_type_id`: Tipo de habitación
- `date`: Fecha
- `price_cents`: Precio en centavos
- `occupancy_percent`: Porcentaje de ocupación
- `source`: Origen del dato (MANUAL, AUTOMATIC, DYNAMIC_PRICING)

**`competitor_rates`** - Tarifas de competidores
- `hotel_id`: ID del hotel
- `competitor_name`: Nombre del competidor
- `date`: Fecha
- `room_category`: Categoría de habitación equivalente
- `price_cents`: Precio en centavos
- `source`: Origen (MANUAL, SCRAPER, API)

**`revenue_settings`** - Configuración del sistema
- `enable_dynamic_pricing`: Activar pricing dinámico
- `min_price_threshold_percent`: Límite mínimo (% del precio base)
- `max_price_threshold_percent`: Límite máximo (% del precio base)
- `competitor_weight`: Peso de competidores en el algoritmo (0-1)
- `occupancy_weight`: Peso de ocupación en el algoritmo (0-1)

### 2. Algoritmo de Pricing Dinámico

La función `calculate_optimal_rate()` calcula la tarifa óptima considerando:

**Factores:**
- **Precio base**: Precio configurado en `room_types.base_price_cents`
- **Competencia**: Promedio de tarifas de competidores
- **Ocupación**: Porcentaje de habitaciones ocupadas

**Lógica:**
```
Si ocupación > 80%:  tarifa = competidores × 1.15 (incrementar 15%)
Si ocupación > 60%:  tarifa = competidores × 1.05 (incrementar 5%)
Si ocupación > 30%:  tarifa = competidores × 1.00 (seguir mercado)
Si ocupación < 30%:  tarifa = competidores × 0.95 (reducir 5%)

Límites:
- Mínimo: 80% del precio base
- Máximo: 150% del precio base
```

**Salida:**
- `optimal_price_cents`: Tarifa sugerida
- `current_price_cents`: Tarifa actual
- `difference_cents`: Diferencia entre ambas
- `competitor_avg_cents`: Promedio de competidores
- `occupancy_percent`: Ocupación actual
- `opportunities`: # de habitaciones por debajo del mercado

### 3. Visualización en Dashboard

El widget de "Gestión de Ingresos" muestra:

**Gráfico de líneas:**
- Tarifa del hotel (línea azul)
- Tarifa promedio de competidores (línea naranja)
- 3 rangos de tiempo: Hoy, 7 días, 30 días

**Tarjeta informativa:**
- Tarifa óptima sugerida
- Diferencia vs tarifa actual
- Oportunidades detectadas
- Porcentaje de ocupación

## Cómo Usar el Sistema

### Paso 1: Configurar Precios Base
1. Ve a **Configuración** → **Tipos de Habitaciones**
2. Establece el `base_price_cents` para cada tipo de habitación
3. Este será el precio de referencia para los cálculos

### Paso 2: Registrar Historial de Precios

Puedes registrar precios de dos formas:

**Manualmente (SQL):**
```sql
INSERT INTO rate_history (hotel_id, room_type_id, date, price_cents, occupancy_percent, source)
VALUES (
  'your-hotel-id',
  'your-room-type-id',
  '2025-11-04',
  485000, -- $4,850.00
  75.5,   -- 75.5% ocupación
  'MANUAL'
);
```

**Automáticamente (futuro):**
El sistema puede registrar automáticamente los precios cada vez que:
- Se crea una reserva
- Se modifica una tarifa
- Se ejecuta el pricing dinámico

### Paso 3: Agregar Datos de Competidores

**Manualmente:**
```sql
INSERT INTO competitor_rates (hotel_id, competitor_name, date, room_category, price_cents, source)
VALUES (
  'your-hotel-id',
  'Hotel Competidor',
  '2025-11-04',
  'Standard Double',
  520000, -- $5,200.00
  'MANUAL'
);
```

**Por API/Scraping (futuro):**
- Integración con OTAs (Booking.com, Expedia)
- Web scraping automatizado
- Actualización diaria

### Paso 4: Monitorear el Dashboard

1. Ve al **Dashboard** principal
2. Revisa la tarjeta "Gestión de Ingresos"
3. Observa:
   - Si tus tarifas están por encima o debajo del mercado
   - La tarifa óptima sugerida
   - Oportunidades de ajuste

### Paso 5: Ajustar Tarifas

Según las recomendaciones:
1. Si la diferencia es positiva (+): Puedes incrementar precios
2. Si la diferencia es negativa (-): Considera reducir precios
3. Revisa las oportunidades detectadas

## Datos de Ejemplo

El sistema viene con 30 días de datos de ejemplo que incluyen:
- Historial de precios del hotel
- 2 competidores: "Hotel Tropical Paradise" y "Beach Resort & Spa"
- Variación de precios según día de la semana

## Próximas Mejoras

### Funcionalidades Planeadas:

1. **Módulo de Configuración en Settings**
   - Gestión de competidores
   - Ajuste de pesos del algoritmo
   - Límites de precio personalizables
   - Activar/desactivar pricing dinámico

2. **Integración con OTAs**
   - Scraping automatizado de tarifas
   - Actualización en tiempo real
   - Comparación multi-canal

3. **Alertas y Notificaciones**
   - Cuando competidor baja precio
   - Cuando hay oportunidad de incremento
   - Cuando ocupación alcanza umbral

4. **Pricing Dinámico Automático**
   - Ajuste automático de tarifas
   - Reglas basadas en eventos
   - Machine Learning predictivo

5. **Reportes Avanzados**
   - Análisis de tendencias
   - Comparación histórica
   - ROI de ajustes de precio

## Consultas Útiles

### Ver historial de precios
```sql
SELECT date, price_cents / 100 as price, occupancy_percent
FROM rate_history
WHERE hotel_id = 'your-hotel-id'
  AND date >= CURRENT_DATE - 30
ORDER BY date DESC;
```

### Comparar con competidores
```sql
SELECT 
  rh.date,
  rh.price_cents / 100 as hotel_price,
  AVG(cr.price_cents) / 100 as competitor_avg
FROM rate_history rh
LEFT JOIN competitor_rates cr ON cr.hotel_id = rh.hotel_id AND cr.date = rh.date
WHERE rh.hotel_id = 'your-hotel-id'
  AND rh.date >= CURRENT_DATE - 7
GROUP BY rh.date, rh.price_cents
ORDER BY rh.date DESC;
```

### Calcular tarifa óptima
```sql
SELECT * FROM calculate_optimal_rate(
  'your-hotel-id',
  'your-room-type-id',
  CURRENT_DATE
);
```

## Soporte

Para preguntas o problemas con el sistema de Revenue Management:
- Revisa la documentación en `/docs`
- Consulta los logs de la base de datos
- Contacta al equipo de desarrollo

---

**Última actualización**: 4 de noviembre de 2025
**Versión**: 1.0.0
