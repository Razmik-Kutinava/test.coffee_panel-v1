import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromocodeDto } from './dto/create-promocode.dto';
import { UpdatePromocodeDto } from './dto/update-promocode.dto';
import { PromocodeScope } from '@prisma/client';

@Injectable()
export class PromocodesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePromocodeDto) {
    const client = await this.prisma.client();
    
    // Check if code already exists
    const existing = await client.promocode.findFirst({
      where: { code: dto.code },
    });
    if (existing) throw new BadRequestException('Promocode with this code already exists');

    return client.promocode.create({
      data: {
        ...dto,
        isActive: dto.isActive ?? true,
        usedCount: 0,
      },
    });
  }

  async findAll(isActive?: boolean, scope?: PromocodeScope) {
    const client = await this.prisma.client();
    return client.promocode.findMany({
      where: {
        ...(isActive !== undefined && { isActive }),
        ...(scope && { scope }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        location: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client();
    const promo = await client.promocode.findUnique({
      where: { id },
      include: {
        location: true,
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!promo) throw new NotFoundException('Promocode not found');
    return promo;
  }

  async update(id: string, dto: UpdatePromocodeDto) {
    const client = await this.prisma.client();
    const promo = await client.promocode.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promocode not found');

    // Check code uniqueness if code is being updated
    if (dto.code && dto.code !== promo.code) {
      const existing = await client.promocode.findFirst({
        where: { code: dto.code, id: { not: id } },
      });
      if (existing) throw new BadRequestException('Promocode with this code already exists');
    }

    return client.promocode.update({ where: { id }, data: dto });
  }

  async toggleActive(id: string) {
    const client = await this.prisma.client();
    const promo = await client.promocode.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promocode not found');
    return client.promocode.update({
      where: { id },
      data: { isActive: !promo.isActive },
    });
  }

  async remove(id: string) {
    const client = await this.prisma.client();
    const promo = await client.promocode.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promocode not found');
    return client.promocode.delete({ where: { id } });
  }

  async validate(code: string, locationId?: string) {
    const client = await this.prisma.client();
    const promo = await client.promocode.findFirst({
      where: {
        code,
        isActive: true,
        OR: [
          { scope: PromocodeScope.global },
          { scope: PromocodeScope.location, locationId },
        ],
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] },
        ],
      },
    });
    if (!promo) throw new BadRequestException('Promocode invalid or expired');
    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
      throw new BadRequestException('Promocode usage limit reached');
    }
    return promo;
  }

  async getStats() {
    const client = await this.prisma.client();
    const [total, active, used, totalDiscount] = await Promise.all([
      client.promocode.count(),
      client.promocode.count({ where: { isActive: true } }),
      client.promocode.aggregate({
        _sum: { usedCount: true },
      }),
      client.order.aggregate({
        where: { promocodeId: { not: null } },
        _sum: { discountAmount: true },
      }),
    ]);

    return {
      total,
      active,
      used: Number(used._sum.usedCount || 0),
      totalDiscount: Number(totalDiscount._sum.discountAmount || 0),
    };
  }
}
