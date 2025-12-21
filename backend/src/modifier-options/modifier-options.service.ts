import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModifierOptionDto } from './dto/create-modifier-option.dto';
import { UpdateModifierOptionDto } from './dto/update-modifier-option.dto';

@Injectable()
export class ModifierOptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateModifierOptionDto) {
    const client = await this.prisma.client();
    return client.modifierOption.create({
      data: {
        groupId: dto.groupId,
        name: dto.name,
        price: dto.price || 0,
        isDefault: dto.isDefault || false,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        sortOrder: dto.sortOrder || 0,
      },
    });
  }

  async findAll(groupId?: string) {
    const client = await this.prisma.client();
    return client.modifierOption.findMany({
      where: groupId ? { groupId } : undefined,
      orderBy: { sortOrder: 'asc' },
      include: {
        group: true,
      },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client();
    const option = await client.modifierOption.findUnique({
      where: { id },
      include: {
        group: true,
      },
    });
    if (!option) throw new NotFoundException('Modifier option not found');
    return option;
  }

  async update(id: string, dto: UpdateModifierOptionDto) {
    const client = await this.prisma.client();
    const option = await client.modifierOption.findUnique({ where: { id } });
    if (!option) throw new NotFoundException('Modifier option not found');
    
    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.isDefault !== undefined) updateData.isDefault = dto.isDefault;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;
    
    return client.modifierOption.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    const client = await this.prisma.client();
    const option = await client.modifierOption.findUnique({ where: { id } });
    if (!option) throw new NotFoundException('Modifier option not found');
    return client.modifierOption.delete({ where: { id } });
  }
}

