import { Controller, Get, Post, Request, UseGuards, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ArmyService } from './army.service';

@Controller('ants')
export class ArmyController {
    constructor(private readonly armyService: ArmyService) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    getAvailableUnits(@Request() req) {
        return this.armyService.getAvailableAnts(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    startRecruitment(@Request() req, @Body() body: { antId: number, quantity: number }) {
        return this.armyService.startRecruitment(req.user.userId, body.antId, body.quantity);
    }
}
