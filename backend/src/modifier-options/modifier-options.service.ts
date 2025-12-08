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
        ...dto,
        price: dto.price ? { set: dto.price } : undefined,
      } as any,
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
    return client.modifierOption.update({
      where: { id },
      data: {
        ...dto,
        price: dto.price ? { set: dto.price } : undefined,
      } as any,
    });
  }

  async remove(id: string) {
    const client = await this.prisma.client();
    const option = await client.modifierOption.findUnique({ where: { id } });
    if (!option) throw new NotFoundException('Modifier option not found');
    return client.modifierOption.delete({ where: { id } });
  }
}

