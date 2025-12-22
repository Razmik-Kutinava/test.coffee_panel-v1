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
    try {
      return await client.user.findMany({
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
    } catch (error: any) {
      // Временная защита: если ошибка связана с ролью 'customer' в enum
      if (error.message?.includes("Value 'customer' not found in enum 'UserRole'")) {
        // Используем raw SQL для обхода проблемы с enum
        const roleFilter = role ? `AND role = '${role === 'customer' ? 'client' : role}'` : '';
        const statusFilter = status ? `AND status = '${status}'` : '';
        
        const users = await client.$queryRawUnsafe(`
          SELECT 
            u.*,
            (SELECT COUNT(*) FROM "Order" WHERE "userId" = u.id) as "orders_count"
          FROM "User" u
          WHERE 1=1 ${roleFilter} ${statusFilter}
          ORDER BY u."createdAt" DESC
        `);
        
        // Преобразуем результат и нормализуем роль 'customer' -> 'client'
        return (users as any[]).map((user: any) => ({
          ...user,
          role: user.role === 'customer' ? 'client' : user.role,
          _count: {
            orders: Number(user.orders_count) || 0,
          },
        }));
      }
      throw error;
    }
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

