-- Crea el usuario administrador inicial si no existe.
--
-- La contraseña es un hash aleatorio (no corresponde a ninguna contraseña
-- conocida): el seed la sustituye por la definida en ADMIN_PASSWORD (.env).
-- El seed se ejecuta en `prisma migrate reset`, en `npm run seed` y al arrancar
-- la API sobre una base de datos sin catálogo.
INSERT INTO "nidoria"."User" (
    "username",
    "email",
    "password",
    "verified",
    "role",
    "isActive"
)
VALUES (
    'rastler89',
    'rastler89@gmail.com',
    '$2a$10$fIIhRxLowQgC2ZDzCYTP0uABnPce8wgGj255cpJkZUSvGBiWfwRta',
    CURRENT_TIMESTAMP,
    'admin',
    true
)
ON CONFLICT ("email") DO NOTHING;
