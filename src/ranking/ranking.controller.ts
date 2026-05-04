import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('ranking')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getRankings(@Request() req) {
    // req.user.sub contiene el userId del JWT
    return this.rankingService.getRankings(req.user.sub);
  }
}
