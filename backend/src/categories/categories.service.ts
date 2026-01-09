import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const client = await this.prisma.client();
    
    // Создаем категорию
    const category = await client.category.create({
      data: {
        ...dto,
        description: dto.description === '' ? null : dto.description,
        slug: dto.slug === '' ? null : dto.slug,
        imageUrl: dto.imageUrl === '' ? null : dto.imageUrl,
        parentId: dto.parentId === '' ? null : dto.parentId,
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

    // Добавляем категорию во все активные локации
    if (locations.length > 0) {
      try {
        await client.locationCategory.createMany({
          data: locations.map((location) => ({
            locationId: location.id,
            categoryId: category.id,
            isVisible: true,
            sortOrder: category.sortOrder || 0,
          })),
          skipDuplicates: true,
        });
      } catch (error: any) {
        // Логируем ошибку, но не прерываем выполнение - категория уже создана
        console.error('Error creating LocationCategory records:', error);
      }
    }

    // Возвращаем категорию с информацией о локациях
    return client.category.findUnique({
      where: { id: category.id },
      include: {
        locations: {
          include: { location: true },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  }

  async findAll(isActive?: boolean) {
    const client = await this.prisma.client();
    return client.category.findMany({
      where: isActive !== undefined ? { isActive } : undefined,
      orderBy: { sortOrder: 'asc' },
      include: {
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
    const category = await client.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const client = await this.prisma.client();
    const category = await client.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return client.category.update({
      where: { id },
      data: {
        ...dto,
        description: dto.description === '' ? null : dto.description,
        slug: dto.slug === '' ? null : dto.slug,
        imageUrl: dto.imageUrl === '' ? null : dto.imageUrl,
        parentId: dto.parentId === '' ? null : dto.parentId,
      },
    });
  }

  async remove(id: string) {
    const client = await this.prisma.client();
    
    try {
      return await client.$transaction(async (tx) => {
        // 1. Проверка существования и получение всех связей
        const category = await tx.category.findUnique({
          where: { id },
          include: {
            _count: {
              select: {
                products: true,
                children: true,
                locations: true,
              },
            },
          },
        });

        if (!category) {
          throw new NotFoundException('Category not found');
        }

        // 2. Проверка блокирующих связей
        if (category._count.products > 0) {
          throw new BadRequestException(
            `Невозможно удалить категорию: в ней ${category._count.products} товаров`
          );
        }

        // 3. Удаление зависимостей в правильном порядке
        // Сначала удаляем связи с локациями
        await tx.locationCategory.deleteMany({ where: { categoryId: id } });
        
        // Затем удаляем дочерние категории (рекурсивно)
        // ВАЖНО: дочерние категории должны быть пустыми (без товаров)
        const children = await tx.category.findMany({ where: { parentId: id } });
        for (const child of children) {
          const childProductsCount = await tx.product.count({ where: { categoryId: child.id } });
          if (childProductsCount > 0) {
            throw new BadRequestException(
              `Невозможно удалить категорию: дочерняя категория "${child.name}" содержит ${childProductsCount} товаров`
            );
          }
          // Удаляем связи дочерней категории с локациями
          await tx.locationCategory.deleteMany({ where: { categoryId: child.id } });
        }
        
        // Удаляем дочерние категории
        await tx.category.deleteMany({ where: { parentId: id } });

        // 4. Удаление основного объекта
        return await tx.category.delete({ where: { id } });
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
          'Невозможно удалить категорию: она связана с другими записями (нарушение внешнего ключа)'
        );
      }

      if (error.code === 'P2025') {
        throw new NotFoundException('Category not found');
      }

      // Логирование для отладки
      console.error('Error deleting category:', {
        id,
        code: error.code,
        message: error.message,
        meta: error.meta,
      });

      throw new BadRequestException(
        `Ошибка при удалении категории: ${error.message || 'Неизвестная ошибка'}`
      );
    }
  }

  async forceDeleteByName(name: string) {
    const client = await this.prisma.client();
    
    // Находим все категории с таким именем
    const categories = await client.category.findMany({
      where: { name: { contains: name, mode: 'insensitive' } },
      include: {
        _count: {
          select: {
            products: true,
            children: true,
            locations: true,
          },
        },
      },
    });

    if (categories.length === 0) {
      return { deleted: 0, message: `Категории с именем "${name}" не найдены` };
    }

    let deletedCount = 0;
    const errors: string[] = [];

    for (const category of categories) {
      try {
        await client.$transaction(async (tx) => {
          // 1. Удаляем все товары из категории
          const products = await tx.product.findMany({ where: { categoryId: category.id } });
          for (const product of products) {
            // Удаляем связи товара с модификаторами
            await tx.productModifierGroup.deleteMany({ where: { productId: product.id } });
            // Удаляем связи товара с локациями
            await tx.locationProduct.deleteMany({ where: { productId: product.id } });
            // Удаляем товары из заказов (orderItems)
            await tx.orderItem.deleteMany({ where: { productId: product.id } });
            // Удаляем сам товар
            await tx.product.delete({ where: { id: product.id } });
          }

          // 2. Рекурсивно удаляем дочерние категории
          const deleteChildren = async (parentId: string) => {
            const children = await tx.category.findMany({ where: { parentId } });
            for (const child of children) {
              // Удаляем товары дочерней категории
              const childProducts = await tx.product.findMany({ where: { categoryId: child.id } });
              for (const product of childProducts) {
                await tx.productModifierGroup.deleteMany({ where: { productId: product.id } });
                await tx.locationProduct.deleteMany({ where: { productId: product.id } });
                await tx.orderItem.deleteMany({ where: { productId: product.id } });
                await tx.product.delete({ where: { id: product.id } });
              }
              // Рекурсивно удаляем внуков
              await deleteChildren(child.id);
              // Удаляем связи дочерней категории с локациями
              await tx.locationCategory.deleteMany({ where: { categoryId: child.id } });
              // Удаляем дочернюю категорию
              await tx.category.delete({ where: { id: child.id } });
            }
          };
          await deleteChildren(category.id);

          // 3. Удаляем связи категории с локациями
          await tx.locationCategory.deleteMany({ where: { categoryId: category.id } });
          
          // 4. Удаляем саму категорию
          await tx.category.delete({ where: { id: category.id } });
        }, { timeout: 30000 });
        
        deletedCount++;
      } catch (error: any) {
        errors.push(`Ошибка при удалении категории ${category.id} (${category.name}): ${error.message}`);
        console.error(`Error force deleting category ${category.id}:`, error);
      }
    }

    return {
      deleted: deletedCount,
      total: categories.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Удалено ${deletedCount} из ${categories.length} категорий с именем "${name}"`,
    };
  }
}

