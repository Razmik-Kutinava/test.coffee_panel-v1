import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductStatus } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    const client = await this.prisma.client();

    // Нормализуем categoryId: пустая строка, undefined или некорректный UUID -> null
    let categoryId: string | null = null;

    if (dto.categoryId) {
      const trimmed = dto.categoryId.trim();
      // Проверяем что это валидный UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (trimmed && uuidRegex.test(trimmed)) {
        categoryId = trimmed;
      }
    }

    // Проверяем существование категории, если она указана
    if (categoryId) {
      const category = await client.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        throw new BadRequestException(`Категория с ID "${categoryId}" не найдена`);
      }
    }
    
    // Примечание: убрали проверку на дубликаты по имени,
    // так как могут быть товары с одинаковым именем в разных категориях
    
    // Создаем товар в транзакции для атомарности
    const product = await client.product.create({
      data: {
        ...dto,
        categoryId,
        status: dto.status ?? ProductStatus.active,
      },
    });

    // Получаем все активные локации
    const locations = await client.location.findMany({
      where: {
        status: 'active',
      },
      select: {
        id: true,
      },
    });

    // Добавляем товар во все активные локации (с обработкой ошибок)
    if (locations.length > 0) {
      try {
        await client.locationProduct.createMany({
          data: locations.map((location) => ({
            locationId: location.id,
            productId: product.id,
            // name: product.name, // Временно отключено - поле еще не добавлено в БД
            price: dto.price ? dto.price : null, // Используем цену товара или null (будет использоваться базовая цена)
            isAvailable: true,
            stockQuantity: 0,
            minStockThreshold: 5,
          })),
          skipDuplicates: true, // Пропускаем дубликаты, если товар уже есть в локации
        });
      } catch (error: any) {
        // Логируем ошибку, но не прерываем выполнение - товар уже создан
        console.error('Error creating LocationProduct records:', error);
        // Товар все равно возвращаем, даже если LocationProduct не созданы
      }
    }

    // Привязываем все существующие модификаторы к новому товару
    try {
      const allModifierGroups = await client.modifierGroup.findMany({
        select: { id: true },
      });
      
      if (allModifierGroups.length > 0) {
        await client.productModifierGroup.createMany({
          data: allModifierGroups.map((group, index) => ({
            productId: product.id,
            modifierGroupId: group.id,
            position: index,
          })),
          skipDuplicates: true, // Пропускаем дубликаты, если связь уже есть
        });
      }
    } catch (error: any) {
      // Логируем ошибку, но не прерываем выполнение - товар уже создан
      console.error('Error creating ProductModifierGroup records:', error);
    }

    // Всегда возвращаем созданный товар, даже если были ошибки с LocationProduct или модификаторами
    const createdProduct = await client.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        locations: {
          include: { location: true },
        },
        modifierGroups: {
          include: {
            modifierGroup: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    // Если findUnique вернул null (маловероятно, но на всякий случай)
    if (!createdProduct) {
      throw new Error('Product was created but could not be retrieved');
    }

    return createdProduct;
  }

  async findAll(status?: ProductStatus, categoryId?: string) {
    const client = await this.prisma.client();
    return client.product.findMany({
      where: {
        ...(status && { status }),
        ...(categoryId && { categoryId }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        modifierGroups: {
          include: {
            modifierGroup: {
              include: {
                options: true,
              },
            },
          },
        },
        _count: {
          select: {
            orderItems: true,
            locations: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client();
    const product = await client.product.findUnique({
      where: { id },
      include: {
        category: true,
        locations: {
          include: { location: true },
        },
        modifierGroups: {
          include: {
            modifierGroup: {
              include: {
                options: true,
              },
            },
          },
        },
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const client = await this.prisma.client();
    const product = await client.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    
    const updatedProduct = await client.product.update({
      where: { id },
      data: {
        ...dto,
        categoryId: dto.categoryId === '' ? null : (dto.categoryId || undefined),
      },
    });

    // Если название товара изменилось, обновляем его во всех LocationProduct
    // Временно отключено - поле name еще не добавлено в БД
    // if (dto.name && dto.name !== product.name) {
    //   await client.locationProduct.updateMany({
    //     where: { productId: id },
    //     data: { name: dto.name },
    //   });
    // }

    return updatedProduct;
  }

  async toggleStatus(id: string) {
    const client = await this.prisma.client();
    const product = await client.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return client.product.update({
      where: { id },
      data: {
        status: product.status === ProductStatus.active ? ProductStatus.inactive : ProductStatus.active,
      },
    });
  }

  async remove(id: string) {
    const client = await this.prisma.client();
    
    try {
      return await client.$transaction(async (tx) => {
        // 1. Проверка существования и получение всех связей
        const product = await tx.product.findUnique({
          where: { id },
          include: {
            _count: {
              select: {
                orderItems: true,
                locations: true,
                modifierGroups: true,
              },
            },
          },
        });

        if (!product) {
          throw new NotFoundException('Product not found');
        }

        // 2. Проверка блокирующих связей
        if (product._count.orderItems > 0) {
          throw new BadRequestException(
            `Невозможно удалить товар: он используется в ${product._count.orderItems} заказах`
          );
        }

        // 3. Удаление зависимостей в правильном порядке
        await Promise.all([
          tx.productModifierGroup.deleteMany({ where: { productId: id } }),
          tx.locationProduct.deleteMany({ where: { productId: id } }),
        ]);

        // 4. Удаление основного объекта
        return await tx.product.delete({ where: { id } });
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
          'Невозможно удалить товар: он связан с другими записями (нарушение внешнего ключа)'
        );
      }

      if (error.code === 'P2025') {
        throw new NotFoundException('Product not found');
      }

      // Логирование для отладки
      console.error('Error deleting product:', {
        id,
        code: error.code,
        message: error.message,
        meta: error.meta,
      });

      throw new BadRequestException(
        `Ошибка при удалении товара: ${error.message || 'Неизвестная ошибка'}`
      );
    }
  }

  async forceDeleteByName(name: string) {
    const client = await this.prisma.client();
    
    // Находим все товары с таким именем
    const products = await client.product.findMany({
      where: { name: { contains: name, mode: 'insensitive' } },
      include: {
        _count: {
          select: {
            orderItems: true,
            locations: true,
          },
        },
      },
    });

    if (products.length === 0) {
      return { deleted: 0, message: `Товары с именем "${name}" не найдены` };
    }

    let deletedCount = 0;
    const errors: string[] = [];

    for (const product of products) {
      try {
        // Удаляем все связанные записи
        await client.productModifierGroup.deleteMany({ where: { productId: product.id } });
        await client.locationProduct.deleteMany({ where: { productId: product.id } });
        
        // Если есть заказы, удаляем orderItems (но не сами заказы)
        if (product._count.orderItems > 0) {
          await client.orderItem.deleteMany({ where: { productId: product.id } });
        }
        
        // Удаляем сам товар
        await client.product.delete({ where: { id: product.id } });
        deletedCount++;
      } catch (error: any) {
        errors.push(`Ошибка при удалении товара ${product.id}: ${error.message}`);
        console.error(`Error force deleting product ${product.id}:`, error);
      }
    }

    return {
      deleted: deletedCount,
      total: products.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Удалено ${deletedCount} из ${products.length} товаров с именем "${name}"`,
    };
  }

  async syncAllModifiers() {
    const client = await this.prisma.client();
    
    // Получаем все активные товары
    const allProducts = await client.product.findMany({
      where: { status: 'active' },
      select: { id: true },
    });
    
    // Получаем все модификаторы
    const allModifierGroups = await client.modifierGroup.findMany({
      select: { id: true },
    });
    
    if (allProducts.length === 0 || allModifierGroups.length === 0) {
      return {
        success: true,
        message: 'Нет товаров или модификаторов для синхронизации',
        productsCount: allProducts.length,
        modifiersCount: allModifierGroups.length,
      };
    }
    
    // Создаем связи между всеми товарами и модификаторами
    const links = allProducts.flatMap((product, productIndex) =>
      allModifierGroups.map((modifierGroup, modifierIndex) => ({
        productId: product.id,
        modifierGroupId: modifierGroup.id,
        position: modifierIndex,
      }))
    );
    
    try {
      await client.productModifierGroup.createMany({
        data: links,
        skipDuplicates: true, // Пропускаем дубликаты
      });
      
      return {
        success: true,
        message: 'Модификаторы успешно синхронизированы со всеми товарами',
        productsCount: allProducts.length,
        modifiersCount: allModifierGroups.length,
        linksCreated: links.length,
      };
    } catch (error: any) {
      console.error('Error syncing modifiers:', error);
      throw new BadRequestException(`Ошибка синхронизации: ${error.message}`);
    }
  }

  async getCategories() {
    const client = await this.prisma.client();
    const products = await client.product.findMany({
      where: { categoryId: { not: null } },
      select: { category: true },
      distinct: ['categoryId'],
    });
    return products.map((p) => p.category).filter(Boolean);
  }

  async getStats() {
    const client = await this.prisma.client();
    const [total, byStatus, byCategory, totalRevenue] = await Promise.all([
      client.product.count(),
      client.product.groupBy({
        by: ['status'],
        _count: true,
      }),
      client.product.groupBy({
        by: ['categoryId'],
        _count: true,
        where: { categoryId: { not: null } },
      }),
      client.orderItem.aggregate({
        _sum: { totalPrice: true },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count }), {}),
      byCategory: byCategory.reduce((acc, item) => ({ ...acc, [item.categoryId || 'uncategorized']: item._count }), {}),
      totalRevenue: Number(totalRevenue._sum?.totalPrice || 0),
    };
  }
}

