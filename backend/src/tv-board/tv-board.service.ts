import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TVBoardService {
  constructor(private prisma: PrismaService) {}

  // Получить данные TV-борда по slug
  async getBoardDataBySlug(slug: string) {
    const client = await this.prisma.client();
    const location = await client.location.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        address: true,
        tvBoardEnabled: true,
        tvBoardTheme: true,
      },
    });

    if (!location) {
      throw new HttpException('Location not found', HttpStatus.NOT_FOUND);
    }

    if (!location.tvBoardEnabled) {
      throw new HttpException('TV Board is disabled for this location', HttpStatus.FORBIDDEN);
    }

    return this.getBoardData(location.id, location);
  }

  // Получить данные TV-борда по ID
  async getBoardData(locationId: string, locationData?: any) {
    const client = await this.prisma.client();
    
    const location = locationData || await client.location.findUnique({
      where: { id: locationId },
      select: {
        id: true,
        name: true,
        address: true,
        tvBoardEnabled: true,
        tvBoardTheme: true,
      },
    });

    if (!location) {
      throw new HttpException('Location not found', HttpStatus.NOT_FOUND);
    }

    // Заказы "Готовится" (accepted, preparing)
    const preparing = await client.order.findMany({
      where: {
        locationId,
        status: { in: ['accepted', 'preparing'] },
      },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        status: true,
        createdAt: true,
        acceptedAt: true,
        user: {
          select: { telegramFirstName: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Заказы "Готово" (ready)
    const ready = await client.order.findMany({
      where: {
        locationId,
        status: 'ready',
      },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        readyAt: true,
        user: {
          select: { telegramFirstName: true },
        },
      },
      orderBy: { readyAt: 'desc' },
      take: 10, // Максимум 10 готовых заказов на экране
    });

    // Статистика за сегодня
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStats = await client.order.aggregate({
      where: {
        locationId,
        status: 'completed',
        completedAt: { gte: today },
      },
      _count: true,
    });

    return {
      location: {
        id: location.id,
        name: location.name,
        address: location.address,
      },
      theme: this.parseTheme(location.tvBoardTheme),
      preparing: preparing.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName || o.user?.telegramFirstName || 'Гость',
        status: o.status,
        waitingMinutes: Math.floor(
          (Date.now() - new Date(o.acceptedAt || o.createdAt).getTime()) / 60000,
        ),
      })),
      ready: ready.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName || o.user?.telegramFirstName || 'Гость',
        readyMinutes: Math.floor(
          (Date.now() - new Date(o.readyAt!).getTime()) / 60000,
        ),
      })),
      stats: {
        completedToday: todayStats._count,
        currentQueue: preparing.length,
        readyToPickup: ready.length,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Получить тему TV-борда
  async getTheme(slug: string) {
    const client = await this.prisma.client();
    const location = await client.location.findUnique({
      where: { slug },
      select: { tvBoardTheme: true },
    });

    if (!location) {
      throw new HttpException('Location not found', HttpStatus.NOT_FOUND);
    }

    return this.parseTheme(location.tvBoardTheme);
  }

  // Парсинг темы с дефолтными значениями
  private parseTheme(themeJson: any) {
    const defaults = {
      backgroundColor: '#1a1a2e',
      textColor: '#ffffff',
      accentColor: '#00ff88',
      preparingColor: '#ffa500',
      readyColor: '#00ff88',
      logoUrl: null,
      showStats: true,
      soundEnabled: true,
      animationsEnabled: true,
    };

    if (!themeJson || typeof themeJson !== 'object') {
      return defaults;
    }

    return { ...defaults, ...themeJson };
  }
}
