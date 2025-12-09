import { Controller, Get, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { TVBoardService } from './tv-board.service';

@Controller('tv-board')
export class TVBoardController {
  constructor(private readonly service: TVBoardService) {}

  // Получить данные TV-борда по slug локации
  @Get(':slug')
  async getBoardData(@Param('slug') slug: string) {
    return this.service.getBoardDataBySlug(slug);
  }

  // Получить данные по ID локации
  @Get('location/:locationId')
  async getBoardDataById(@Param('locationId') locationId: string) {
    return this.service.getBoardData(locationId);
  }

  // Получить настройки темы
  @Get(':slug/theme')
  async getTheme(@Param('slug') slug: string) {
    return this.service.getTheme(slug);
  }
}

