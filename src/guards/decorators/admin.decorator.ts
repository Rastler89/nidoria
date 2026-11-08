import { SetMetadata } from '@nestjs/common';

/** Clave de metadatos que lee `AdminGuard` para saber qué roles exige la ruta. */
export const ADMIN_ROLES = 'admin_roles';

/** Marca un handler o controlador como restringido a los roles indicados. */
export const Admin = (...roles: string[]) => SetMetadata(ADMIN_ROLES, roles);
