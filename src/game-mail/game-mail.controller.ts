import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { GameMailService } from './game-mail.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('game-mail')
@UseGuards(JwtAuthGuard)
export class GameMailController {
  constructor(private readonly mailService: GameMailService) {}

  @Get()
  getInbox(@Request() req) {
    return this.mailService.getInbox(req.user.userId);
  }

  @Get('unread')
  getUnreadCount(@Request() req) {
    return this.mailService.getUnreadCount(req.user.userId);
  }

  @Patch(':id/read')
  markAsRead(@Request() req, @Param('id') id: string) {
    return this.mailService.markAsRead(req.user.userId, +id);
  }

  @Delete(':id')
  deleteMail(@Request() req, @Param('id') id: string) {
    return this.mailService.deleteMail(req.user.userId, +id);
  }
}
