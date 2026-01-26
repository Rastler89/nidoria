import { Controller, Get, Patch, Delete, Post, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Patch('users/:id')
  updateUser(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.adminService.updateUser(id, data);
  }

  @Delete('users/:id')
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteUser(id);
  }

  @Get('anthills')
  getAllAnthills() {
    return this.adminService.getAllAnthills();
  }

  @Patch('anthills/:id')
  updateAnthill(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.adminService.updateAnthill(id, data);
  }

  @Get('queues/stats')
  getQueuesStats() {
    return this.adminService.getQueuesStats();
  }

  @Post('queues/:name/clean')
  cleanQueue(@Param('name') name: string) {
    return this.adminService.cleanQueue(name);
  }

  @Post('queues/:name/retry')
  retryFailedJobs(@Param('name') name: string) {
    return this.adminService.retryFailedJobs(name);
  }
}
