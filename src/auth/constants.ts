// Secreto para firmar/verificar JWT.
// En producción se define vía variable de entorno JWT_SECRET (OBLIGATORIO).
// El valor por defecto es SOLO para desarrollo local.
export const jwtConstants = {
    secret: process.env.JWT_SECRET || 'SuperCalicoFragalisticExpialidocious',
};
