import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { BroadcastsService } from './broadcasts.service';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';
import { UpdateBroadcastDto } from './dto/update-broadcast.dto';

@Controller('broadcasts')
export class BroadcastsController {
  constructor(private readonly broadcastsService: BroadcastsService) {}

  @Post()
  create(@Body() dto: CreateBroadcastDto) {
    return this.broadcastsService.create(dto);
  }

  @Get()
  findAll(@Query('status') status?: string) {
    return this.broadcastsService.findAll(status);
  }

  @Get('stats')
  getStats() {
    return this.broadcastsService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.broadcastsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBroadcastDto) {
    return this.broadcastsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.broadcastsService.remove(id);
  }
}

