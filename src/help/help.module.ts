import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { HelpService } from './help.service';

@Module({
    imports: [PrismaModule],
    providers: [HelpService],
    exports: [HelpService],
})
export class HelpModule { }
