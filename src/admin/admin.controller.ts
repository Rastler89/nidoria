import { Controller, Post, Body, UseGuards, HttpStatus, HttpException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from '../guards/admin.guard'; // Placeholder guard

// Replace AdminGuard with appropriate AuthGuard + Role checking logic
@UseGuards(AdminGuard) 
@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    // POST /admin/wipedb
    @Post('wipedb')
    async wipeDatabase() {
        const message = await this.adminService.wipeAndRebuildDb();
        // It's good practice to return a 200 OK even for destructive actions, but logging success is key.
        return { status: "Success", message: message };
    }

    // POST /admin/users/:userId/enable
    @Post('users/:userId/enable')
    async enableUser(@Body() body: { enable: boolean }, @Param('userId') userId: string) {
        if (!body.enable) {
            throw new HttpException('Must provide enable: true', HttpStatus.BAD_REQUEST);
        }
        
        // Assumes userId is sent correctly from context/body
        await this.adminService.enableUser(userId);
        return { status: "Success", message: `User ${userId} is now enabled.` };
    }

    // GET /admin/migration-status
    @Post('migration-status')
    async getMigrationStatus() {
        const status = await this.adminService.getMigrationStatus();
        return { status: "Success", data: status };
    }
}