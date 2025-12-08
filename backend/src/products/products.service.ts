import { Injectable, NotFoundException } from '@nestjs/common';
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
    return client.product.update({ where: { id }, data: dto });
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
    return client.product.delete({ where: { id } });
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
