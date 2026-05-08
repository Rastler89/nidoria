import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // opcional, pero así no necesitas importarlo en todos lados
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
