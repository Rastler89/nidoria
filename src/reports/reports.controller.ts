import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ReportType } from '@prisma/client';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  list(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('unread') unread?: string,
  ) {
    const validType =
      type && (Object.values(ReportType) as string[]).includes(type)
        ? (type as ReportType)
        : undefined;

    return this.reportsService.list(req.user.userId, {
      page: Number(page),
      limit: Number(limit),
      type: validType,
      unreadOnly: unread === 'true' || unread === '1',
    });
  }

  @Get('unread-count')
  unreadCount(@Request() req) {
    return this.reportsService
      .unreadCount(req.user.userId)
      .then((unread) => ({ unread }));
  }

  @Get(':id')
  get(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.reportsService.get(req.user.userId, id);
  }

  @Post(':id/read')
  markRead(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.reportsService.markRead(req.user.userId, id);
  }

  @Post('read-all')
  markAllRead(@Request() req) {
    return this.reportsService.markAllRead(req.user.userId);
  }
}
