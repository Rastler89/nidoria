import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

/**
 * Datos fijos del administrador inicial. La contraseña NO vive en el código:
 * se lee de `ADMIN_PASSWORD` en el entorno (.env).
 */
const ADMIN_USERNAME = 'rastler89';
const ADMIN_EMAIL = 'rastler89@gmail.com';

/**
 * Crea o actualiza el usuario administrador con la contraseña del entorno.
 * Es idempotente: el email es único, así que nunca duplica la cuenta.
 *
 * Si `ADMIN_PASSWORD` no está definida se omite el paso y se avisa por consola,
 * para no dejar una cuenta con una contraseña conocida o vacía.
 */
export async function seedAdminUser(prisma: PrismaClient) {
    const password = process.env.ADMIN_PASSWORD;

    if (!password) {
        console.warn(
            '⚠ ADMIN_PASSWORD no está definida: se omite el usuario administrador.',
        );
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.upsert({
        where: { email: ADMIN_EMAIL },
        update: {
            password: hashedPassword,
            role: 'admin',
            verified: new Date(),
            isActive: true,
        },
        create: {
            username: ADMIN_USERNAME,
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: 'admin',
            verified: new Date(),
            isActive: true,
        },
    });

    console.log('✔ Admin user seeded');
}
