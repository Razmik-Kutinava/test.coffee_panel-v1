import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ModifierOptionsService } from './modifier-options.service';
import { CreateModifierOptionDto } from './dto/create-modifier-option.dto';
import { UpdateModifierOptionDto } from './dto/update-modifier-option.dto';

@Controller('modifier-options')
export class ModifierOptionsController {
  constructor(private readonly modifierOptionsService: ModifierOptionsService) {}

  @Post()
  create(@Body() dto: CreateModifierOptionDto) {
    return this.modifierOptionsService.create(dto);
  }

  @Get()
  findAll(@Query('groupId') groupId?: string) {
    return this.modifierOptionsService.findAll(groupId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modifierOptionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateModifierOptionDto) {
    return this.modifierOptionsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.modifierOptionsService.remove(id);
  }
}

