import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BannerService } from './banner.service';
import { BannerController } from './banner.controller';
import { BannerAdminController } from './banner-admin.controller';

@Module({
  imports: [PrismaModule],
  controllers: [BannerController, BannerAdminController],
  providers: [BannerService],
  exports: [BannerService],
})
export class BannerModule {}
