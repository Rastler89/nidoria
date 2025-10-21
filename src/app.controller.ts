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
import { ResourcesService } from './resources/resources.services';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ColoniesService } from './colonies/colonies.services';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService,
    private readonly resourcesService: ResourcesService,
    private readonly coloniesService: ColoniesService,
  ) {}

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
    console.log('mision');
    console.log(req.body);
  }
}
