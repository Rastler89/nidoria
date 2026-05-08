import {
  Controller,
  Get,
  Request,
  Post,
  UseGuards,
  Param,
  ConflictException,
} from '@nestjs/common';
import { AppService } from './app.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthService } from './auth/auth.service';
import { ResourcesService } from './resources/resources.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ColoniesService } from './colonies/colonies.service';
import { ExpeditionService } from './expedition/expedition.services';
import { ConstructionService } from './construction/construction.service';
import { HelpService } from './help/help.service';
import { InvestigationService } from './investigation/investigation.service';
import { ArmyService } from './army/army.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService,
    private readonly resourcesService: ResourcesService,
    private readonly coloniesService: ColoniesService,
    private readonly expeditionService: ExpeditionService,
    private readonly constructionService: ConstructionService,
    private readonly helpService: HelpService,
    private readonly investigationService: InvestigationService,
    private readonly armyService: ArmyService,
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Manejo de registro y login
  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('pre-register')
  async preRegister(@Request() req) {
    const response = await this.authService.preRegister(req.body);
    return response;
  }

  @Post('auth/register')
  async register(@Request() req) {
    const response = await this.authService.register(req.body);
    if (response === 'exist') {
      throw new ConflictException({
        message: 'El usuario ya existe.',
        details:
          'El registro no puede completarse porque el email proporcionado ya está en uso.',
      });
    } else return response;
  }

  @Post('auth/refresh')
  async refresh(@Request() req) {
    const refreshToken = req.body.refresh_token;
    return this.authService.refreshAccessToken(refreshToken);
  }

  @UseGuards(LocalAuthGuard)
  @Post('auth/logout')
  async logout(@Request() req) {
    return req.logout();
  }

  @Get('verifyAccount/:id/:token')
  async verifyAccount(@Param('id') id: string, @Param('token') token: string) {
    return this.authService.verifyAccount(parseInt(id), token);
  }

  // Perfil
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  // Recursos
  @UseGuards(JwtAuthGuard)
  @Get('resources')
  getResources(@Request() req) {
    return this.coloniesService.getColonyResources(req.user.userId);
  }

  //Misiones
  @UseGuards(JwtAuthGuard)
  @Post('mission')
  updateMission(@Request() req) {
    return this.expeditionService.addExpedition(req.user.userId, req.body.resource, req.body.amount);
  }
  // Construcciones
  @UseGuards(JwtAuthGuard)
  @Get('constructions')
  getConstruction(@Request() req) {
    return this.constructionService.getAvailableConstructions(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('constructions')
  createConstruction(@Request() req) {
    return this.constructionService.startConstruction(req.user.userId, req.body.constructionId, req.body.instance);
  }

  // Investigaciones
  @UseGuards(JwtAuthGuard)
  @Get('investigations')
  getInvestigation(@Request() req) {
    return this.investigationService.getAvailableInvestigations(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('investigations')
  createInvestigation(@Request() req) {
    return this.investigationService.startInvestigation(req.user.userId, req.body.investigationId, req.body.instance);
  }

  // Unidades
  @UseGuards(JwtAuthGuard)
  @Get('units')
  getUnits(@Request() req) {
    return this.armyService.getAvailableAnts(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('units')
  createUnits(@Request() req) {
    return this.armyService.startRecruitment(req.user.userId, req.body.antId, req.body.amount);
  }

  // Ayuda
  @Get('three')
  getHelp(@Request() req) {
    return this.helpService.getTechData();
  }

}
