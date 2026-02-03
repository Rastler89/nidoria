import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ConstructionsService } from './constructions.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('constructions')
@UseGuards(JwtAuthGuard)
export class ConstructionsController {
  constructor(private readonly constructionsService: ConstructionsService) {}

  @Get()
  async getMyConstructions(@Request() req) {
    return this.constructionsService.getUserConstructions(req.user.userId);
  }

  @Get('available')
  async getAvailableConstructions(@Request() req) {
    return this.constructionsService.getAvailableConstructions(req.user.userId);
  }

  @Post('build')
  async startConstruction(@Request() req, @Body() body: { constructionId: number, instanceId?: number }) {
    return this.constructionsService.startConstruction(req.user.userId, body.constructionId, body.instanceId);
  }
}
