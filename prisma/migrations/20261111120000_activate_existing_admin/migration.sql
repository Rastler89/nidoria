-- Reactiva al administrador que ya existía antes de `isActive`.
--
-- Contexto: la columna `isActive` se añadió con DEFAULT false, así que todas
-- las cuentas existentes quedaron inactivas. La migración que siembra el admin
-- usa ON CONFLICT DO NOTHING y no lo corrige si el email ya existe, y el seed
-- de arranque solo se ejecuta con el catálogo base vacío. Resultado: el admin
-- podía iniciar sesión pero recibía 401 en todos los endpoints protegidos.
--
-- Es una corrección de datos de una sola vez: no vuelve a tocar la cuenta
-- aunque después se desactive a propósito.
UPDATE "nidoria"."User"
SET "isActive" = true
WHERE "email" = 'rastler89@gmail.com'
  AND "isActive" = false;
