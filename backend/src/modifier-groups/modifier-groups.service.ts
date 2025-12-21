import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

    // НЕ привязываем автоматически - пользователь будет выбирать товары вручную
    return createdGroup;
  }

  async linkToProduct(groupId: string, productId: string, position: number = 0) {
    const client = await this.prisma.client();
    
    // Проверяем, существует ли группа и товар
    const group = await client.modifierGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Modifier group not found');
    
    const product = await client.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    
    // Проверяем, существует ли уже связь
    const existing = await client.productModifierGroup.findUnique({
      where: {
        productId_modifierGroupId: {
          productId,
          modifierGroupId: groupId,
        },
      },
    });
    
    if (existing) {
      // Обновляем существующую связь
      return client.productModifierGroup.update({
        where: {
          productId_modifierGroupId: {
            productId,
            modifierGroupId: groupId,
          },
        },
        data: { position },
      });
    } else {
      // Создаем новую связь
      return client.productModifierGroup.create({
        data: {
          productId,
          modifierGroupId: groupId,
          position,
        },
      });
    }
  }

  async unlinkFromProduct(groupId: string, productId: string) {
    const client = await this.prisma.client();
    
    return client.productModifierGroup.deleteMany({
      where: {
        modifierGroupId: groupId,
        productId: productId,
      },
    });
  }

  async findAll() {
    const client = await this.prisma.client();
    return client.modifierGroup.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        options: {
          orderBy: { sortOrder: 'asc' },
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
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
    
    // Получаем группу с опциями
    const group = await client.modifierGroup.findUnique({ 
      where: { id },
      include: {
        options: {
          select: { id: true },
        },
      },
    });
    if (!group) throw new NotFoundException('Modifier group not found');
    
    // Проверяем, используется ли модификатор в заказах
    // Это критическая проверка - если опции используются в заказах, удаление невозможно
    if (group.options && group.options.length > 0) {
      const optionIds = group.options.map(opt => opt.id);
      const orderItemModifiersCount = await client.orderItemModifier.count({
        where: {
          modifierOptionId: { in: optionIds },
        },
      });
      
      if (orderItemModifiersCount > 0) {
        throw new BadRequestException(
          `Невозможно удалить группу модификаторов: она используется в ${orderItemModifiersCount} заказах`
        );
      }
    }
    
    try {
      // ВАЖНО: Удаляем в правильном порядке БЕЗ транзакции, чтобы избежать проблем с foreign key constraints
      
      // 1. Сначала удаляем связи с продуктами (ProductModifierGroup)
      const deletedLinks = await client.productModifierGroup.deleteMany({
        where: { modifierGroupId: id },
      });
      console.log(`Deleted ${deletedLinks.count} product-modifier links for group ${id}`);
      
      // 2. Удаляем опции модификаторов (ModifierOption)
      // Это безопасно, так как мы уже проверили, что они не используются в заказах
      const deletedOptions = await client.modifierOption.deleteMany({
        where: { groupId: id },
      });
      console.log(`Deleted ${deletedOptions.count} modifier options for group ${id}`);
      
      // 3. Теперь безопасно удаляем саму группу модификаторов
      return await client.modifierGroup.delete({ where: { id } });
    } catch (error: any) {
      // Если это уже BadRequestException, пробрасываем дальше
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Если ошибка связана с foreign key constraint
      if (error.code === 'P2003' || 
          error.message?.includes('Foreign key constraint') || 
          error.message?.includes('foreign key') ||
          error.message?.includes('violates foreign key constraint')) {
        throw new BadRequestException(
          'Невозможно удалить группу модификаторов: она связана с другими записями (используется в заказах)'
        );
      }
      
      // Если группа уже удалена (P2025)
      if (error.code === 'P2025') {
        throw new NotFoundException('Modifier group not found');
      }
      
      // Для всех остальных ошибок логируем подробности и пробрасываем
      console.error('Error deleting modifier group:', {
        errorCode: error.code,
        errorMessage: error.message,
        errorMeta: error.meta,
        groupId: id,
      });
      throw new BadRequestException(
        `Ошибка при удалении группы модификаторов: ${error.message || 'Неизвестная ошибка'}`
      );
    }
  }
}

