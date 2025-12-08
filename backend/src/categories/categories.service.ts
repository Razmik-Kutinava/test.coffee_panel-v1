import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const client = await this.prisma.client();
    return client.category.create({
      data: dto as any,
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
    return client.category.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    const client = await this.prisma.client();
    const category = await client.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return client.category.delete({ where: { id } });
  }
}

