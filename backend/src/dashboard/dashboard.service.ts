import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(period: 'today' | 'week' | 'month' = 'today', locationId?: string) {
    const client = await this.prisma.client();
    
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
    }

    const where = {
      ...(locationId ? { locationId } : {}),
      createdAt: { gte: startDate },
      paymentStatus: 'succeeded' as const,
    };

    const [totalRevenue, totalOrders, ordersData, newCustomers] = await Promise.all([
      client.order.aggregate({
        where,
        _sum: { totalAmount: true },
      }),
      client.order.count({ where }),
      client.order.findMany({
        where,
        select: { totalAmount: true },
      }),
      client.user.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),
    ]);

    const averageCheck = ordersData.length > 0
      ? Number(totalRevenue._sum.totalAmount || 0) / ordersData.length
      : 0;

    // Активные заказы
    const activeOrdersWhere = {
      ...(locationId ? { locationId } : {}),
      status: { in: ['paid', 'accepted', 'preparing', 'ready'] as any[] },
    };

    const [newOrders, inProgress, ready] = await Promise.all([
      client.order.count({ where: { ...activeOrdersWhere, status: 'paid' } }),
      client.order.count({ where: { ...activeOrdersWhere, status: { in: ['accepted', 'preparing'] as any[] } } }),
      client.order.count({ where: { ...activeOrdersWhere, status: 'ready' } }),
    ]);

    return {
      overview: {
        totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
        totalOrders,
        averageCheck: Math.round(averageCheck),
        newCustomers,
      },
      activeOrders: {
        new: newOrders,
        inProgress,
        ready,
      },
    };
  }

  async getTopProducts(locationId?: string, limit: number = 5) {
    const client = await this.prisma.client();
    
    const where = {
      ...(locationId ? { locationId } : {}),
      paymentStatus: 'succeeded' as const,
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    };

    const orderItems = await client.orderItem.findMany({
      where: {
        order: where,
      },
      include: {
        product: true,
      },
    });

    const productStats = orderItems.reduce((acc, item) => {
      const productId = item.productId;
      if (!acc[productId]) {
        acc[productId] = {
          productId,
          productName: item.productName,
          quantitySold: 0,
          revenue: 0,
        };
      }
      acc[productId].quantitySold += item.quantity;
      acc[productId].revenue += Number(item.totalPrice);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(productStats)
      .sort((a: any, b: any) => b.quantitySold - a.quantitySold)
      .slice(0, limit);
  }

  async getByLocation() {
    const client = await this.prisma.client();
    const locations = await client.location.findMany({
      where: { isAcceptingOrders: true },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));

    const locationStats = await Promise.all(
      locations.map(async (loc) => {
        const [todayOrders, todayRevenue, activeOrders] = await Promise.all([
          client.order.count({
            where: {
              locationId: loc.id,
              createdAt: { gte: todayStart },
            },
          }),
          client.order.aggregate({
            where: {
              locationId: loc.id,
              createdAt: { gte: todayStart },
              paymentStatus: 'succeeded',
            },
            _sum: { totalAmount: true },
          }),
          client.order.count({
            where: {
              locationId: loc.id,
              status: { in: ['paid', 'accepted', 'preparing', 'ready'] as any[] },
            },
          }),
        ]);

        const avgCheck = todayOrders > 0
          ? Number(todayRevenue._sum.totalAmount || 0) / todayOrders
          : 0;

        return {
          locationId: loc.id,
          locationName: loc.name,
          orders: todayOrders,
          revenue: Number(todayRevenue._sum.totalAmount || 0),
          averageCheck: Math.round(avgCheck),
          activeOrders,
          isOpen: loc.isAcceptingOrders,
        };
      })
    );

    return locationStats;
  }

  async getRealtime(locationId?: string) {
    const client = await this.prisma.client();
    
    const activeOrdersWhere = {
      ...(locationId ? { locationId } : {}),
      status: { in: ['paid', 'accepted', 'preparing', 'ready'] as any[] },
    };

    const [newOrders, preparing, ready] = await Promise.all([
      client.order.count({ where: { ...activeOrdersWhere, status: 'paid' } }),
      client.order.count({ where: { ...activeOrdersWhere, status: { in: ['accepted', 'preparing'] as any[] } } }),
      client.order.count({ where: { ...activeOrdersWhere, status: 'ready' } }),
    ]);

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));

    const todayWhere = {
      ...(locationId ? { locationId } : {}),
      createdAt: { gte: todayStart },
      paymentStatus: 'succeeded' as const,
    };

    const [todayRevenue, todayOrdersCount, todayOrdersData] = await Promise.all([
      client.order.aggregate({
        where: todayWhere,
        _sum: { totalAmount: true },
      }),
      client.order.count({ where: todayWhere }),
      client.order.findMany({
        where: todayWhere,
        select: { totalAmount: true },
      }),
    ]);

    const avgCheck = todayOrdersCount > 0
      ? Number(todayRevenue._sum.totalAmount || 0) / todayOrdersCount
      : 0;

    return {
      activeOrders: {
        new: newOrders,
        preparing,
        ready,
      },
      today: {
        revenue: Number(todayRevenue._sum.totalAmount || 0),
        orders: todayOrdersCount,
        averageCheck: Math.round(avgCheck),
      },
    };
  }
}

