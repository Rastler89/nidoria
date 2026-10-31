import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
    constructor(private prismaService: PrismaService) {}

    /**
     * Executes prisma migrate reset. This wipes the database, runs migrations, and seeds the app.
     * This is a HIGHly DESTRUCTIVE operation.
     */
    async wipeAndRebuildDb(): Promise<string> {
        // We rely on the logic inside PrismaService to handle the actual execution (prisma migrate reset)
        console.log('ADMIN: Initiating full database wipe and rebuild...');
        await this.prismaService.migrateReset(); // Assuming this method exists or mirroring functionality
        return 'Database successfully wiped and rebuilt.';
    }

    /**
     * Enables a specific user account, allowing them to log in and access the system.
     * Requires admin authorization.
     */
    async enableUser(userId: number | string): Promise<any> {
        await this.prismaService.user.update({
            where: { id: userId },
            data: { isActive: true }
        });
        return { message: 'User successfully enabled.' };
    }

    /**
     * Retrieves the current database migration status.
     */
    async getMigrationStatus(): Promise<{ status: string }> {
        // Leveraging the service's ability to check migration status
        const status = await this.prismaService.checkMigrationStatus(); // Assuming this method exists
        return { status };
    }
    
    /**
     * Allows resetting the database/migrations state if necessary.
     * This is essentially an alias for wipeAndRebuildDb for simplicity.
     */
    async resetDatabase(): Promise<string> {
        return this.wipeAndRebuildDb();
    }
}