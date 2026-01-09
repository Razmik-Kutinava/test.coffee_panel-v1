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
    
    try {
      return await client.$transaction(async (tx) => {
        // 1. Проверка существования и получение всех связей
        const group = await tx.modifierGroup.findUnique({
          where: { id },
          include: {
            options: {
              select: { id: true },
            },
            _count: {
              select: {
                products: true,
              },
            },
          },
        });

        if (!group) {
          throw new NotFoundException('Modifier group not found');
        }

        // 2. Проверка использования в заказах (критическая проверка)
        if (group.options && group.options.length > 0) {
          const optionIds = group.options.map(opt => opt.id);
          const orderItemModifiersCount = await tx.orderItemModifier.count({
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

        // 3. Удаление зависимостей в правильном порядке
        // Сначала удаляем связи с продуктами (ProductModifierGroup)
        const deletedLinks = await tx.productModifierGroup.deleteMany({
          where: { modifierGroupId: id },
        });
        console.log(`Deleted ${deletedLinks.count} product-modifier links for group ${id}`);

        // Затем удаляем опции модификаторов (ModifierOption)
        // Это безопасно, так как мы уже проверили, что они не используются в заказах
        const deletedOptions = await tx.modifierOption.deleteMany({
          where: { groupId: id },
        });
        console.log(`Deleted ${deletedOptions.count} modifier options for group ${id}`);

        // 4. Удаление основного объекта
        return await tx.modifierGroup.delete({ where: { id } });
      }, {
        timeout: 10000, // 10 секунд таймаут
      });
    } catch (error: any) {
      // Обработка известных исключений
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      // Обработка Prisma ошибок
      if (error.code === 'P2003') {
        throw new BadRequestException(
          'Невозможно удалить группу модификаторов: она связана с другими записями (нарушение внешнего ключа)'
        );
      }

      if (error.code === 'P2025') {
        throw new NotFoundException('Modifier group not found');
      }

      // Логирование для отладки
      console.error('Error deleting modifier group:', {
        id,
        code: error.code,
        message: error.message,
        meta: error.meta,
      });

      throw new BadRequestException(
        `Ошибка при удалении группы модификаторов: ${error.message || 'Неизвестная ошибка'}`
      );
    }
  }

  async forceDeleteAll() {
    const client = await this.prisma.client();
    
    try {
      return await client.$transaction(async (tx) => {
        // 1. Получаем все группы модификаторов
        const groups = await tx.modifierGroup.findMany({
          include: {
            options: {
              select: { id: true },
            },
          },
        });

        let deletedGroups = 0;
        let deletedOptions = 0;
        let deletedLinks = 0;

        for (const group of groups) {
          // 2. Удаляем связи с товарами
          const links = await tx.productModifierGroup.deleteMany({
            where: { modifierGroupId: group.id },
          });
          deletedLinks += links.count;

          // 3. Удаляем опции модификаторов (даже если они используются в заказах)
          // Сначала удаляем связи опций с заказами
          if (group.options && group.options.length > 0) {
            const optionIds = group.options.map(opt => opt.id);
            await tx.orderItemModifier.deleteMany({
              where: { modifierOptionId: { in: optionIds } },
            });
            
            const options = await tx.modifierOption.deleteMany({
              where: { groupId: group.id },
            });
            deletedOptions += options.count;
          }

          // 4. Удаляем саму группу
          await tx.modifierGroup.delete({ where: { id: group.id } });
          deletedGroups++;
        }

        return {
          deletedGroups,
          deletedOptions,
          deletedLinks,
          message: `Принудительно удалено ${deletedGroups} групп модификаторов, ${deletedOptions} опций и ${deletedLinks} связей с товарами`,
        };
      }, { timeout: 30000 });
    } catch (error: any) {
      console.error('Error force deleting all modifier groups:', error);
      throw new BadRequestException(
        `Ошибка при принудительном удалении модификаторов: ${error.message || 'Неизвестная ошибка'}`
      );
    }
  }
}

