import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AttackUnitInput, PveService } from './pve.service';

@Controller('pve')
@UseGuards(JwtAuthGuard)
export class PveController {
  constructor(private readonly pveService: PveService) {}

  /** Apariciones activas + ejército disponible para atacar. */
  @Get('spawns')
  getSpawns(@Request() req) {
    return this.pveService.getSpawns(req.user.userId);
  }

  /** Batallas propias (pendientes y resueltas). */
  @Get('battles')
  getBattles(@Request() req) {
    return this.pveService.getBattles(req.user.userId);
  }

  /**
   * Envía unidades contra una aparición. El combate no se resuelve aquí: queda
   * en la cola `pve` hasta que termina el viaje.
   */
  @Post('spawns/:id/attack')
  attack(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { units?: AttackUnitInput[] },
  ) {
    return this.pveService.attackSpawn(req.user.userId, id, body?.units ?? []);
  }
}
