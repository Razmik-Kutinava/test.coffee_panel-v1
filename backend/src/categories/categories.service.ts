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
    const category = await client.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    
    // Проверяем, есть ли связанные записи
    const productsCount = await client.product.count({ where: { categoryId: id } });
    if (productsCount > 0) {
      throw new BadRequestException(`Невозможно удалить категорию: в ней ${productsCount} товаров`);
    }
    
    try {
      // Удаляем дочерние категории
      await client.category.deleteMany({ where: { parentId: id } });
      
      return await client.category.delete({ where: { id } });
    } catch (error: any) {
      // Если ошибка связана с foreign key constraint
      if (error.code === 'P2003' || error.message?.includes('Foreign key constraint') || error.message?.includes('foreign key')) {
        throw new BadRequestException('Невозможно удалить категорию: она связана с другими записями');
      }
      // Если это уже BadRequestException, пробрасываем дальше
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Для всех остальных ошибок логируем и пробрасываем
      console.error('Error deleting category:', error);
      throw error;
    }
  }
}

