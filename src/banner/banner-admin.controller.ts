import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';
import { BannerInput, BannerService } from './banner.service';

/** CRUD de banners para el panel /antmaster. */
@Controller('antmaster/api/banners')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class BannerAdminController {
  constructor(private readonly bannerService: BannerService) {}

  @Get()
  findAll() {
    return this.bannerService.findAll();
  }

  @Post()
  create(@Body() body: BannerInput) {
    return this.bannerService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: BannerInput) {
    return this.bannerService.update(+id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bannerService.remove(+id);
  }
}
