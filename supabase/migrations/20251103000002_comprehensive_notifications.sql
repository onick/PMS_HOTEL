-- Comprehensive Notification System for SOLARIS PMS
-- This migration adds automatic notifications for all important hotel events

-- ================================================================
-- 1. CHECK-IN NOTIFICATIONS
-- ================================================================

CREATE OR REPLACE FUNCTION notify_check_in()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  room_number text;
BEGIN
  IF NEW.status = 'CHECKED_IN' AND OLD.status != 'CHECKED_IN' THEN
    -- Get room number
    SELECT r.room_number INTO room_number
    FROM rooms r
    WHERE r.id = NEW.room_id;
    
    -- Notify reception about successful check-in
    PERFORM create_notification(
      NEW.hotel_id,
      'Check-in completado',
      'Habitación ' || COALESCE(room_number, 'N/A') || ' - Huésped registrado',
      NULL,
      'RECEPTION',
      'check_in',
      'reservations',
      NEW.id
    );
    
    -- Notify housekeeping that room is now occupied
    PERFORM create_notification(
      NEW.hotel_id,
      'Habitación ocupada',
      'Habitación ' || COALESCE(room_number, 'N/A') || ' ahora está ocupada',
      NULL,
      'HOUSEKEEPING',
      'room_occupied',
      'reservations',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_in_notification
AFTER UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION notify_check_in();

-- ================================================================
-- 2. UPCOMING CHECK-IN/CHECK-OUT NOTIFICATIONS (24h before)
-- ================================================================

CREATE OR REPLACE FUNCTION notify_upcoming_arrivals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reservation RECORD;
  room_number text;
BEGIN
  -- Notify about arrivals in next 24 hours
  FOR reservation IN
    SELECT r.*, g.full_name
    FROM reservations r
    JOIN guests g ON g.id = r.guest_id
    WHERE r.status = 'CONFIRMED'
    AND r.check_in::date = CURRENT_DATE + INTERVAL '1 day'
  LOOP
    SELECT rm.room_number INTO room_number
    FROM rooms rm
    WHERE rm.id = reservation.room_id;
    
    PERFORM create_notification(
      reservation.hotel_id,
      'Llegada mañana',
      reservation.full_name || ' - Habitación ' || COALESCE(room_number, 'N/A'),
      NULL,
      'RECEPTION',
      'upcoming_arrival',
      'reservations',
      reservation.id
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION notify_upcoming_departures()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reservation RECORD;
  room_number text;
BEGIN
  -- Notify about departures in next 24 hours
  FOR reservation IN
    SELECT r.*, g.full_name
    FROM reservations r
    JOIN guests g ON g.id = r.guest_id
    WHERE r.status = 'CHECKED_IN'
    AND r.check_out::date = CURRENT_DATE + INTERVAL '1 day'
  LOOP
    SELECT rm.room_number INTO room_number
    FROM rooms rm
    WHERE rm.id = reservation.room_id;
    
    PERFORM create_notification(
      reservation.hotel_id,
      'Salida mañana',
      reservation.full_name || ' - Habitación ' || COALESCE(room_number, 'N/A'),
      NULL,
      'RECEPTION',
      'upcoming_departure',
      'reservations',
      reservation.id
    );
    
    -- Also notify housekeeping
    PERFORM create_notification(
      reservation.hotel_id,
      'Preparar para salida',
      'Habitación ' || COALESCE(room_number, 'N/A') || ' - Check-out mañana',
      NULL,
      'HOUSEKEEPING',
      'upcoming_checkout',
      'reservations',
      reservation.id
    );
  END LOOP;
END;
$$;

-- ================================================================
-- 3. NEW RESERVATION NOTIFICATIONS
-- ================================================================

CREATE OR REPLACE FUNCTION notify_new_reservation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  room_number text;
  guest_name text;
BEGIN
  -- Get room and guest info
  SELECT r.room_number INTO room_number
  FROM rooms r
  WHERE r.id = NEW.room_id;
  
  SELECT g.full_name INTO guest_name
  FROM guests g
  WHERE g.id = NEW.guest_id;
  
  -- Notify managers and reception
  PERFORM create_notification(
    NEW.hotel_id,
    'Nueva reserva',
    guest_name || ' - Habitación ' || COALESCE(room_number, 'N/A') || 
    ' (' || to_char(NEW.check_in, 'DD/MM') || ' - ' || to_char(NEW.check_out, 'DD/MM') || ')',
    NULL,
    'MANAGER',
    'new_reservation',
    'reservations',
    NEW.id
  );
  
  PERFORM create_notification(
    NEW.hotel_id,
    'Nueva reserva',
    guest_name || ' - Habitación ' || COALESCE(room_number, 'N/A'),
    NULL,
    'RECEPTION',
    'new_reservation',
    'reservations',
    NEW.id
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER new_reservation_notification
AFTER INSERT ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION notify_new_reservation();

-- ================================================================
-- 4. RESERVATION CANCELLATION NOTIFICATIONS
-- ================================================================

CREATE OR REPLACE FUNCTION notify_reservation_cancellation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  room_number text;
BEGIN
  IF NEW.status = 'CANCELLED' AND OLD.status != 'CANCELLED' THEN
    SELECT r.room_number INTO room_number
    FROM rooms r
    WHERE r.id = NEW.room_id;
    
    PERFORM create_notification(
      NEW.hotel_id,
      'Reserva cancelada',
      'Habitación ' || COALESCE(room_number, 'N/A') || ' liberada',
      NULL,
      'RECEPTION',
      'cancellation',
      'reservations',
      NEW.id
    );
    
    PERFORM create_notification(
      NEW.hotel_id,
      'Reserva cancelada',
      'Habitación ' || COALESCE(room_number, 'N/A') || ' disponible nuevamente',
      NULL,
      'MANAGER',
      'cancellation',
      'reservations',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER reservation_cancellation_notification
AFTER UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION notify_reservation_cancellation();

-- ================================================================
-- 5. LOW INVENTORY NOTIFICATIONS
-- ================================================================

CREATE OR REPLACE FUNCTION notify_low_inventory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify when stock drops below minimum
  IF NEW.current_stock <= NEW.min_stock AND OLD.current_stock > OLD.min_stock THEN
    PERFORM create_notification(
      NEW.hotel_id,
      'Inventario bajo',
      NEW.name || ' - Stock: ' || NEW.current_stock || ' (Mín: ' || NEW.min_stock || ')',
      NULL,
      'MANAGER',
      'low_inventory',
      'inventory_items',
      NEW.id
    );
  END IF;
  
  -- Alert when completely out of stock
  IF NEW.current_stock = 0 AND OLD.current_stock > 0 THEN
    PERFORM create_notification(
      NEW.hotel_id,
      '⚠️ Inventario agotado',
      NEW.name || ' - Sin stock disponible',
      NULL,
      'MANAGER',
      'out_of_stock',
      'inventory_items',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER low_inventory_notification
AFTER UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION notify_low_inventory();

-- ================================================================
-- 6. TASK ASSIGNMENT NOTIFICATIONS
-- ================================================================

CREATE OR REPLACE FUNCTION notify_task_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify user when task is assigned to them
  IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to AND NEW.assigned_to IS NOT NULL THEN
    PERFORM create_notification(
      NEW.hotel_id,
      'Nueva tarea asignada',
      NEW.title || ' - Prioridad: ' || NEW.priority,
      NEW.assigned_to,
      NULL,
      'task_assignment',
      'tasks',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER task_assignment_notification
AFTER UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION notify_task_assignment();

-- ================================================================
-- 7. HIGH PRIORITY TASK NOTIFICATIONS
-- ================================================================

CREATE OR REPLACE FUNCTION notify_urgent_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify managers about URGENT tasks
  IF NEW.priority = 'URGENT' THEN
    PERFORM create_notification(
      NEW.hotel_id,
      '🚨 Tarea URGENTE',
      NEW.title,
      NULL,
      'MANAGER',
      'urgent_task',
      'tasks',
      NEW.id
    );
    
    -- Also notify the assigned person if exists
    IF NEW.assigned_to IS NOT NULL THEN
      PERFORM create_notification(
        NEW.hotel_id,
        '🚨 Tarea URGENTE asignada',
        NEW.title,
        NEW.assigned_to,
        NULL,
        'urgent_task',
        'tasks',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER urgent_task_notification
AFTER INSERT ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION notify_urgent_task();

-- ================================================================
-- 8. PAYMENT NOTIFICATIONS
-- ================================================================

CREATE OR REPLACE FUNCTION notify_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  folio_record RECORD;
  reservation_id uuid;
BEGIN
  -- Only notify for payments (negative amounts)
  IF NEW.amount_cents < 0 THEN
    -- Get folio and reservation info
    SELECT f.*, f.reservation_id INTO folio_record
    FROM folios f
    WHERE f.id = NEW.folio_id;
    
    reservation_id := folio_record.reservation_id;
    
    -- Notify reception and manager about payment received
    PERFORM create_notification(
      (SELECT hotel_id FROM reservations WHERE id = reservation_id),
      'Pago recibido',
      'Monto: $' || abs(NEW.amount_cents / 100.0)::text,
      NULL,
      'RECEPTION',
      'payment_received',
      'folio_charges',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER payment_notification
AFTER INSERT ON public.folio_charges
FOR EACH ROW
EXECUTE FUNCTION notify_payment();

-- ================================================================
-- 9. ROOM STATUS CHANGE NOTIFICATIONS
-- ================================================================

CREATE OR REPLACE FUNCTION notify_room_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify when room goes out of service
  IF NEW.status = 'OUT_OF_SERVICE' AND OLD.status != 'OUT_OF_SERVICE' THEN
    PERFORM create_notification(
      NEW.hotel_id,
      'Habitación fuera de servicio',
      'Habitación ' || NEW.room_number || ' - Requiere atención',
      NULL,
      'MANAGER',
      'room_out_of_service',
      'rooms',
      NEW.id
    );
    
    PERFORM create_notification(
      NEW.hotel_id,
      'Habitación fuera de servicio',
      'Habitación ' || NEW.room_number,
      NULL,
      'MAINTENANCE',
      'room_out_of_service',
      'rooms',
      NEW.id
    );
  END IF;
  
  -- Notify when room is ready after maintenance
  IF NEW.status = 'AVAILABLE' AND OLD.status = 'OUT_OF_SERVICE' THEN
    PERFORM create_notification(
      NEW.hotel_id,
      'Habitación lista',
      'Habitación ' || NEW.room_number || ' disponible nuevamente',
      NULL,
      'RECEPTION',
      'room_available',
      'rooms',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER room_status_notification
AFTER UPDATE ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION notify_room_status_change();

-- ================================================================
-- 10. NO-SHOW NOTIFICATIONS
-- ================================================================

CREATE OR REPLACE FUNCTION check_no_shows()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reservation RECORD;
  room_number text;
BEGIN
  -- Check for no-shows (check-in date passed but still CONFIRMED)
  FOR reservation IN
    SELECT r.*
    FROM reservations r
    WHERE r.status = 'CONFIRMED'
    AND r.check_in::date < CURRENT_DATE
  LOOP
    SELECT rm.room_number INTO room_number
    FROM rooms rm
    WHERE rm.id = reservation.room_id;
    
    -- Update status to NO_SHOW
    UPDATE reservations
    SET status = 'NO_SHOW'
    WHERE id = reservation.id;
    
    -- Notify reception and manager
    PERFORM create_notification(
      reservation.hotel_id,
      'No-Show detectado',
      'Habitación ' || COALESCE(room_number, 'N/A') || ' - Reserva no utilizada',
      NULL,
      'RECEPTION',
      'no_show',
      'reservations',
      reservation.id
    );
    
    PERFORM create_notification(
      reservation.hotel_id,
      'No-Show',
      'Habitación ' || COALESCE(room_number, 'N/A') || ' disponible',
      NULL,
      'MANAGER',
      'no_show',
      'reservations',
      reservation.id
    );
  END LOOP;
END;
$$;

-- ================================================================
-- 11. COMMENTS
-- ================================================================

COMMENT ON FUNCTION notify_check_in IS 'Notifies reception and housekeeping when a guest checks in';
COMMENT ON FUNCTION notify_upcoming_arrivals IS 'Notifies about guests arriving in 24 hours - should be run daily';
COMMENT ON FUNCTION notify_upcoming_departures IS 'Notifies about guests departing in 24 hours - should be run daily';
COMMENT ON FUNCTION notify_new_reservation IS 'Notifies when a new reservation is created';
COMMENT ON FUNCTION notify_reservation_cancellation IS 'Notifies when a reservation is cancelled';
COMMENT ON FUNCTION notify_low_inventory IS 'Notifies when inventory items are running low';
COMMENT ON FUNCTION notify_task_assignment IS 'Notifies users when tasks are assigned to them';
COMMENT ON FUNCTION notify_urgent_task IS 'Notifies managers about urgent tasks';
COMMENT ON FUNCTION notify_payment IS 'Notifies when payments are received';
COMMENT ON FUNCTION notify_room_status_change IS 'Notifies when rooms go out of service or become available';
COMMENT ON FUNCTION check_no_shows IS 'Checks for no-shows and notifies - should be run daily';
