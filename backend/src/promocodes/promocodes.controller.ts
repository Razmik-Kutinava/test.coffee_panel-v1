import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PromocodesService } from './promocodes.service';
import { CreatePromocodeDto } from './dto/create-promocode.dto';
import { UpdatePromocodeDto } from './dto/update-promocode.dto';
import { PromocodeScope } from '@prisma/client';

@Controller('promocodes')
export class PromocodesController {
  constructor(private readonly promocodesService: PromocodesService) {}

  @Post()
  create(@Body() dto: CreatePromocodeDto) {
    return this.promocodesService.create(dto);
  }

  @Get()
  findAll(@Query('isActive') isActive?: string, @Query('scope') scope?: PromocodeScope) {
    return this.promocodesService.findAll(
      isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      scope,
    );
  }

  @Get('validate')
  validate(@Query('code') code: string, @Query('locationId') locationId?: string) {
    return this.promocodesService.validate(code, locationId);
  }

  @Get('stats')
  getStats() {
    return this.promocodesService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.promocodesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePromocodeDto) {
    return this.promocodesService.update(id, dto);
  }

  @Patch(':id/toggle-active')
  toggleActive(@Param('id') id: string) {
    return this.promocodesService.toggleActive(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promocodesService.remove(id);
  }
}
