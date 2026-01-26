import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AiManagerService } from './ai-manager.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AiManagerController {
  constructor(private readonly aiManagerService: AiManagerService) {}

  @Post('start')
  startPlayer(@Body() config: {
    baseUrl: string;
    iterations: number;
    delay: number;
    username?: string;
    password?: string;
    isResume?: boolean;
    personality?: any;
  }) {
    const username = this.aiManagerService.startPlayer(
      config.baseUrl,
      config.iterations,
      config.delay,
      {
        username: config.username,
        password: config.password,
        isResume: config.isResume,
        personality: config.personality
      }
    );
    return { username };
  }

  @Post('stop/:username')
  stopPlayer(@Param('username') username: string) {
    const success = this.aiManagerService.stopPlayer(username);
    return { success };
  }

  @Post('delete/:username')
  deletePlayer(@Param('username') username: string) {
    const success = this.aiManagerService.deletePlayer(username);
    return { success };
  }

  @Post('force/:username/:action')
  forceAction(@Param('username') username: string, @Param('action') action: string) {
    const success = this.aiManagerService.forceAction(username, action);
    return { success };
  }

  @Get('players')
  getPlayers() {
    return this.aiManagerService.getAllPlayers();
  }
}
