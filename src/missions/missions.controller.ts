import { Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { MissionsService } from './missions.service';

@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getMissions(@Request() req) {
    return this.missionsService.getMissionsForUser(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/claim')
  claim(@Request() req, @Param('id') id: string) {
    return this.missionsService.claimMission(req.user.userId, parseInt(id, 10));
  }
}
