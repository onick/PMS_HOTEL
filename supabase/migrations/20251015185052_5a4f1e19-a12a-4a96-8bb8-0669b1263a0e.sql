-- Modificar el trigger para asignar rol automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  demo_hotel_id uuid;
BEGIN
  -- Insertar perfil
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    NEW.raw_user_meta_data->>'phone'
  );

  -- Obtener el ID del hotel demo
  SELECT id INTO demo_hotel_id
  FROM public.hotels
  WHERE slug = 'playa-paraiso'
  LIMIT 1;

  -- Si existe el hotel demo, asignar rol de RECEPTION al nuevo usuario
  IF demo_hotel_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, hotel_id, role)
    VALUES (NEW.id, demo_hotel_id, 'RECEPTION');
  END IF;

  RETURN NEW;
END;
$$;