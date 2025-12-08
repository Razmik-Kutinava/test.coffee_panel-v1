import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLocationDto) {
    const client = await this.prisma.client();
    return client.location.create({
      data: {
        ...dto,
        status: dto.status ?? LocationStatus.pending,
      },
    });
  }

  async findAll(status?: LocationStatus) {
    const client = await this.prisma.client();
    const where = status ? { status } : {};
    return client.location.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            orders: true,
            staff: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client();
    const location = await client.location.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
            staff: true,
          },
        },
      },
    });
    if (!location) throw new NotFoundException('Location not found');
    return location;
  }

  async findBySubdomain(slug: string) {
    const client = await this.prisma.client();
    return client.location.findFirst({
      where: { slug, status: LocationStatus.active, isAcceptingOrders: true },
    });
  }

  async update(id: string, dto: UpdateLocationDto) {
    const client = await this.prisma.client();
    const location = await client.location.findUnique({ where: { id } });
    if (!location) throw new NotFoundException('Location not found');
    return client.location.update({ where: { id }, data: dto });
  }

  async toggleActive(id: string) {
    const client = await this.prisma.client();
    const location = await client.location.findUnique({ where: { id } });
    if (!location) throw new NotFoundException('Location not found');
    return client.location.update({
      where: { id },
      data: { 
        isAcceptingOrders: !location.isAcceptingOrders,
        status: location.status === LocationStatus.active ? LocationStatus.inactive : LocationStatus.active,
      },
    });
  }

  async remove(id: string) {
    const client = await this.prisma.client();
    const location = await client.location.findUnique({ where: { id } });
    if (!location) throw new NotFoundException('Location not found');
    return client.location.delete({ where: { id } });
  }

  async getStats(id: string) {
    const client = await this.prisma.client();
    const location = await client.location.findUnique({ where: { id } });
    if (!location) throw new NotFoundException('Location not found');

    const [ordersCount, todayOrders, totalRevenue, productsCount] = await Promise.all([
      client.order.count({ where: { locationId: id } }),
      client.order.count({
        where: {
          locationId: id,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      client.order.aggregate({
        where: { locationId: id, paymentStatus: PaymentStatus.succeeded },
        _sum: { totalAmount: true },
      }),
      client.locationProduct.count({ where: { locationId: id } }),
    ]);

    return {
      ordersCount,
      todayOrders,
      totalRevenue: Number(totalRevenue._sum?.totalAmount || 0),
      productsCount,
    };
  }
}
