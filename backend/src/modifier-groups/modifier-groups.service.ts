import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto';
import { UpdateModifierGroupDto } from './dto/update-modifier-group.dto';

@Injectable()
export class ModifierGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateModifierGroupDto) {
    const client = await this.prisma.client();
    
    // Создаем модификатор
    const createdGroup = await client.modifierGroup.create({
      data: dto as any,
      include: {
        options: true,
      },
    });

    // Привязываем новый модификатор ко всем существующим активным товарам
    try {
      const allProducts = await client.product.findMany({
        where: { status: 'active' },
        select: { id: true },
      });
      
      if (allProducts.length > 0) {
        await client.productModifierGroup.createMany({
          data: allProducts.map((product, index) => ({
            productId: product.id,
            modifierGroupId: createdGroup.id,
            position: index,
          })),
          skipDuplicates: true, // Пропускаем дубликаты, если связь уже есть
        });
      }
    } catch (error: any) {
      // Логируем ошибку, но не прерываем выполнение - модификатор уже создан
      console.error('Error creating ProductModifierGroup records:', error);
    }

    return createdGroup;
  }

  async findAll() {
    const client = await this.prisma.client();
    return client.modifierGroup.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        options: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client();
    const group = await client.modifierGroup.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
    if (!group) throw new NotFoundException('Modifier group not found');
    return group;
  }

  async update(id: string, dto: UpdateModifierGroupDto) {
    const client = await this.prisma.client();
    const group = await client.modifierGroup.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Modifier group not found');
    return client.modifierGroup.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    const client = await this.prisma.client();
    const group = await client.modifierGroup.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Modifier group not found');
    return client.modifierGroup.delete({ where: { id } });
  }
}

