import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ModifierGroupsService } from './modifier-groups.service';
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto';
import { UpdateModifierGroupDto } from './dto/update-modifier-group.dto';

@Controller('modifier-groups')
export class ModifierGroupsController {
  constructor(private readonly modifierGroupsService: ModifierGroupsService) {}

  @Post()
  create(@Body() dto: CreateModifierGroupDto) {
    return this.modifierGroupsService.create(dto);
  }

  @Get()
  findAll() {
    return this.modifierGroupsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modifierGroupsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateModifierGroupDto) {
    return this.modifierGroupsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.modifierGroupsService.remove(id);
  }
}

