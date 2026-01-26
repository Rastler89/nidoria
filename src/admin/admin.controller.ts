import { Controller, Get, Post, Patch, Delete, Body, Param, Res, UseGuards, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';

@Controller('antmaster')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  getDashboard(@Res() res: Response) {
    const html = readFileSync(join(__dirname, 'dashboard.html'), 'utf8');
    res.send(html);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('api/summary')
  getSummary() {
    return this.adminService.getSummary();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('api/users')
  getUsers() {
    return this.adminService.getUsers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('api/users/:id/role')
  updateUserRole(@Param('id') id: string, @Body() body: { role: string }) {
    return this.adminService.updateUserRole(+id, body.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('api/users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('api/anthills')
  getAnthills() {
    return this.adminService.getAnthills();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('api/queues-stats')
  getQueueStats() {
    return this.adminService.getQueueStats();
  }

  // Constructions
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('api/constructions')
  getConstructions() {
    return this.adminService.getConstructions();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('api/constructions')
  createConstruction(@Body() data: any) {
    return this.adminService.createConstruction(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('api/constructions/:id')
  updateConstruction(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateConstruction(+id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('api/constructions/:id')
  deleteConstruction(@Param('id') id: string) {
    return this.adminService.deleteConstruction(+id);
  }

  // Investigations
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('api/investigations')
  getInvestigations() {
    return this.adminService.getInvestigations();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('api/investigations')
  createInvestigation(@Body() data: any) {
    return this.adminService.createInvestigation(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('api/investigations/:id')
  updateInvestigation(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateInvestigation(+id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('api/investigations/:id')
  deleteInvestigation(@Param('id') id: string) {
    return this.adminService.deleteInvestigation(+id);
  }

  // Ants
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('api/ants')
  getAnts() {
    return this.adminService.getAnts();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('api/ants')
  createAnt(@Body() data: any) {
    return this.adminService.createAnt(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('api/ants/:id')
  updateAnt(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateAnt(+id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('api/ants/:id')
  deleteAnt(@Param('id') id: string) {
    return this.adminService.deleteAnt(+id);
  }

  // Resources
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('api/resources')
  getResources() {
    return this.adminService.getResources();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('api/resources')
  createResource(@Body() data: any) {
    return this.adminService.createResource(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('api/resources/:id')
  updateResource(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateResource(+id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('api/resources/:id')
  deleteResource(@Param('id') id: string) {
    return this.adminService.deleteResource(+id);
  }

  // Requirements
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('api/requirements')
  getRequirements() {
    return this.adminService.getRequirements();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('api/requirements')
  createRequirement(@Body() data: any) {
    return this.adminService.createRequirement(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('api/requirements/:id')
  updateRequirement(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateRequirement(+id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('api/requirements/:id')
  deleteRequirement(@Param('id') id: string) {
    return this.adminService.deleteRequirement(+id);
  }

  // Deployments
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('api/deployments')
  getDeployments() {
    return this.adminService.getDeployments();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('api/deployments/:id')
  deleteDeployment(@Param('id') id: string) {
    return this.adminService.deleteDeployment(+id);
  }

  // Explorations
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('api/explorations')
  getExplorations() {
    return this.adminService.getExplorations();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('api/explorations/:anthillId/:resourceTypeId')
  deleteExploration(@Param('anthillId') aid: string, @Param('resourceTypeId') rid: string) {
    return this.adminService.deleteExploration(+aid, +rid);
  }

  // Anthill Update
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('api/anthills/:id')
  updateAnthill(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateAnthill(+id, data);
  }
}
