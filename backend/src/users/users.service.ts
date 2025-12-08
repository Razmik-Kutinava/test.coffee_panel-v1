import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const client = await this.prisma.client();
    return client.user.create({
      data: dto as any,
    });
  }

  async findAll(role?: string, status?: string) {
    const client = await this.prisma.client();
    return client.user.findMany({
      where: {
        ...(role ? { role: role as any } : {}),
        ...(status ? { status: status as any } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
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
    const user = await client.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
        preferredLocation: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByTelegramId(telegramId: bigint) {
    const client = await this.prisma.client();
    return client.user.findUnique({
      where: { telegramId },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const client = await this.prisma.client();
    const user = await client.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return client.user.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    const client = await this.prisma.client();
    const user = await client.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return client.user.delete({ where: { id } });
  }

  async getStats() {
    const client = await this.prisma.client();
    const [total, active, newThisWeek] = await Promise.all([
      client.user.count(),
      client.user.count({
        where: {
          status: 'active',
          lastOrderAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      client.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return { total, active, newThisWeek };
  }
}

