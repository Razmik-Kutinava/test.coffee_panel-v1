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
    return client.product.create({
      data: {
        ...dto,
        categoryId: dto.categoryId || null,
        status: dto.status ?? ProductStatus.active,
      },
    });
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
    return client.product.update({
      where: { id },
      data: {
        ...dto,
        categoryId: dto.categoryId === '' ? null : (dto.categoryId || undefined),
      },
    });
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
    const product = await client.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    
    // Проверяем, есть ли связанные записи
    const orderItemsCount = await client.orderItem.count({ where: { productId: id } });
    if (orderItemsCount > 0) {
      throw new BadRequestException(`Невозможно удалить товар: он используется в ${orderItemsCount} заказах`);
    }
    
    try {
      // Удаляем связанные записи
      await client.productModifierGroup.deleteMany({ where: { productId: id } });
      await client.locationProduct.deleteMany({ where: { productId: id } });
      
      return await client.product.delete({ where: { id } });
    } catch (error: any) {
      // Если ошибка связана с foreign key constraint
      if (error.code === 'P2003' || error.message?.includes('Foreign key constraint') || error.message?.includes('foreign key')) {
        throw new BadRequestException('Невозможно удалить товар: он связан с другими записями');
      }
      // Если это уже BadRequestException, пробрасываем дальше
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Для всех остальных ошибок логируем и пробрасываем
      console.error('Error deleting product:', error);
      throw error;
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
