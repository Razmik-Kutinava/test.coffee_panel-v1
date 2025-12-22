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
    
    // Используем raw SQL для обхода проблемы с enum 'customer' не найден в 'UserRole'
    // Prisma Client валидирует enum на клиентской стороне, поэтому try-catch не помогает
    const roleFilter = role ? `AND role::text = '${role === 'customer' ? 'client' : role}'` : '';
    const statusFilter = status ? `AND status::text = '${status}'` : '';
    
    const users = await client.$queryRawUnsafe(`
      SELECT 
        u.id,
        u."telegramId",
        u."telegramUsername",
        u."telegramFirstName",
        u."telegramLastName",
        u."telegramPhotoUrl",
        u."telegramLanguageCode",
        u.phone,
        u.email,
        CASE WHEN u.role::text = 'customer' THEN 'client' ELSE u.role::text END as role,
        u.status::text as status,
        u."preferredLocationId",
        u."acceptsMarketing",
        u."lastOrderAt",
        u."totalOrdersCount",
        u."totalOrdersAmount",
        u."lastSeenAt",
        u.metadata,
        u."createdAt",
        u."updatedAt",
        (SELECT COUNT(*) FROM "Order" WHERE "userId" = u.id) as "orders_count"
      FROM "User" u
      WHERE 1=1 ${roleFilter} ${statusFilter}
      ORDER BY u."createdAt" DESC
    `);
    
    // Преобразуем результат
    return (users as any[]).map((user: any) => ({
      ...user,
      _count: {
        orders: Number(user.orders_count) || 0,
      },
    }));
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

