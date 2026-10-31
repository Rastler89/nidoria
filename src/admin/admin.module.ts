import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Assuming PrismaModule exists or we inject PrismaService directly

@Module({
    imports: [PrismaModule], // Will need to define or reference PrismaModule
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule {}