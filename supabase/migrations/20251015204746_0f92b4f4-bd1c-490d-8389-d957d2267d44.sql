-- Agregar rol de SALES para personal de ventas
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'SALES') THEN
    ALTER TYPE app_role ADD VALUE 'SALES';
  END IF;
END $$;