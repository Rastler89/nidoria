import { Controller, Get, Request, Post, UseGuards, Param } from '@nestjs/common';
import { AppService } from './app.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService,
  ) {}


  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('register')
  async register(@Request() req) {
    return this.authService.register(req.body);
  }

  @UseGuards(LocalAuthGuard)
  @Post('auth/logout')
  async logout(@Request() req) {
    return req.logout();
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @Get('verifyAccount/:id/:token')
  async verifyAccount(
    @Param('id') id: string,
    @Param('token') token: string,) {
    return this.authService.verifyAccount(parseInt(id), token);
  }
}
