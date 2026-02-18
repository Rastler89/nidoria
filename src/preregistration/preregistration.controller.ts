import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { PreregistrationService } from './preregistration.service';

@Controller('preregistration')
export class PreregistrationController {
  constructor(private readonly preregistrationService: PreregistrationService) {}

  @Post()
  async create(@Body('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    return this.preregistrationService.create(email);
  }
}
