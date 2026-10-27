import { Controller, Get } from '@nestjs/common';
import { BannerService } from './banner.service';

/** Endpoint público: banners vigentes para mostrar en el cliente web. */
@Controller('banner')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Get()
  findActive() {
    return this.bannerService.findActive();
  }
}
