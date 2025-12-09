import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersGateway } from '../websocket/websocket.gateway';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class BaristaService {
  constructor(
    private prisma: PrismaService,
    private ordersGateway: OrdersGateway,
  ) {}

  // Получить активные заказы для точки
  async getActiveOrders(locationId: string) {
    const client = await this.prisma.client();
    const orders = await client.order.findMany({
      where: {
        locationId,
        status: {
          in: ['paid', 'accepted', 'preparing', 'ready'],
        },
      },
      include: {
        items: {
          include: {
            modifiers: true,
          },
        },
        user: {
          select: {
            id: true,
            telegramFirstName: true,
            telegramUsername: true,
            phone: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // Добавляем время ожидания
    return orders.map((order) => ({
      ...order,
      waitingMinutes: Math.floor(
        (Date.now() - new Date(order.createdAt).getTime()) / 60000,
      ),
    }));
  }

  // Получить детали заказа
  async getOrderDetails(id: string) {
    const client = await this.prisma.client();
    const order = await client.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            modifiers: true,
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            telegramFirstName: true,
            telegramLastName: true,
            telegramUsername: true,
            phone: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        history: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }

    return order;
  }

  // Сменить статус заказа
  async updateOrderStatus(id: string, newStatus: string, cancellationReason?: string) {
    const client = await this.prisma.client();
    const order = await client.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            modifiers: true,
          },
        },
      },
    });

    if (!order) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }

    // Проверка валидности перехода статуса
    const validTransitions: Record<string, string[]> = {
      paid: ['accepted', 'cancelled'],
      accepted: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['completed', 'cancelled'],
    };

    const currentStatus = order.status;
    const allowed = validTransitions[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      throw new HttpException(
        `Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${allowed.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Обновить заказ
    const updateData: any = {
      status: newStatus as OrderStatus,
    };

    // Установить timestamp в зависимости от статуса
    const now = new Date();
    if (newStatus === 'accepted') updateData.acceptedAt = now;
    if (newStatus === 'preparing') updateData.preparingAt = now;
    if (newStatus === 'ready') updateData.readyAt = now;
    if (newStatus === 'completed') updateData.completedAt = now;
    if (newStatus === 'cancelled') {
      updateData.cancelledAt = now;
      updateData.cancellationReason = cancellationReason || 'Отменено баристой';
    }

    const updatedOrder = await client.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            modifiers: true,
          },
        },
        user: {
          select: {
            telegramFirstName: true,
            telegramUsername: true,
          },
        },
      },
    });

    // Записать в историю
    await client.orderStatusHistory.create({
      data: {
        orderId: id,
        oldStatus: currentStatus,
        newStatus: newStatus as OrderStatus,
        changeSource: 'barista',
      },
    });

    // Уведомить через WebSocket
    this.ordersGateway.notifyOrderStatusChanged(order.locationId, updatedOrder);

    // Специальные уведомления для TV-борда
    if (newStatus === 'ready') {
      this.ordersGateway.notifyOrderReady(order.locationId, {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        customerName: updatedOrder.customerName || updatedOrder.user?.telegramFirstName,
      });
    }

    if (newStatus === 'completed') {
      this.ordersGateway.notifyOrderCompleted(order.locationId, id);
    }

    // Обновить TV-борд
    await this.updateTVBoard(order.locationId);

    return updatedOrder;
  }

  // Получить остатки для точки
  async getStock(locationId: string) {
    const client = await this.prisma.client();
    const products = await client.locationProduct.findMany({
      where: { locationId },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
      orderBy: [
        { product: { category: { name: 'asc' } } },
        { product: { name: 'asc' } },
      ],
    });

    return products.map((lp) => ({
      id: lp.id,
      productId: lp.productId,
      productName: lp.product.name,
      categoryName: lp.product.category?.name || 'Без категории',
      stockQuantity: lp.stockQuantity,
      minStockThreshold: lp.minStockThreshold,
      isAvailable: lp.isAvailable,
      unavailableReason: lp.unavailableReason,
      stockStatus: this.getStockStatus(lp.stockQuantity, lp.minStockThreshold),
    }));
  }

  // Обновить остаток
  async updateStock(
    id: string,
    dto: { stockQuantity?: number; isAvailable?: boolean; unavailableReason?: string | null },
  ) {
    const client = await this.prisma.client();
    const locationProduct = await client.locationProduct.findUnique({
      where: { id },
    });

    if (!locationProduct) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    const updated = await client.locationProduct.update({
      where: { id },
      data: {
        stockQuantity: dto.stockQuantity ?? locationProduct.stockQuantity,
        isAvailable: dto.isAvailable ?? locationProduct.isAvailable,
        unavailableReason: dto.unavailableReason,
      },
      include: {
        product: true,
      },
    });

    // Уведомить через WebSocket
    this.ordersGateway.notifyStockUpdate(locationProduct.locationId, updated);

    return updated;
  }

  // Быстрая корректировка остатка
  async adjustStock(id: string, adjustment: number) {
    const client = await this.prisma.client();
    const locationProduct = await client.locationProduct.findUnique({
      where: { id },
    });

    if (!locationProduct) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    const newQuantity = Math.max(0, locationProduct.stockQuantity + adjustment);

    return this.updateStock(id, {
      stockQuantity: newQuantity,
      isAvailable: newQuantity > 0,
      unavailableReason: newQuantity === 0 ? 'Раскупили' : null,
    });
  }

  // Статистика за сегодня
  async getTodayStats(locationId: string) {
    const client = await this.prisma.client();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await client.order.findMany({
      where: {
        locationId,
        createdAt: { gte: today },
      },
      include: {
        items: true,
      },
    });

    const completed = orders.filter((o) => o.status === 'completed');
    const cancelled = orders.filter((o) => o.status === 'cancelled');
    const active = orders.filter((o) =>
      ['paid', 'accepted', 'preparing', 'ready'].includes(o.status),
    );

    const revenue = completed.reduce(
      (sum, o) => sum + Number(o.totalAmount),
      0,
    );

    // Топ товаров
    const productCounts: Record<string, { name: string; count: number }> = {};
    completed.forEach((order) => {
      order.items.forEach((item) => {
        if (!productCounts[item.productName]) {
          productCounts[item.productName] = { name: item.productName, count: 0 };
        }
        productCounts[item.productName].count += item.quantity;
      });
    });

    const topProducts = Object.values(productCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      date: today.toISOString().split('T')[0],
      totalOrders: orders.length,
      completedOrders: completed.length,
      cancelledOrders: cancelled.length,
      activeOrders: active.length,
      revenue,
      averageCheck: completed.length > 0 ? Math.round(revenue / completed.length) : 0,
      statusBreakdown: {
        paid: orders.filter((o) => o.status === 'paid').length,
        accepted: orders.filter((o) => o.status === 'accepted').length,
        preparing: orders.filter((o) => o.status === 'preparing').length,
        ready: orders.filter((o) => o.status === 'ready').length,
        completed: completed.length,
        cancelled: cancelled.length,
      },
      topProducts,
    };
  }

  // Статус WebSocket подключений
  getConnectionsStats() {
    return this.ordersGateway.getConnectionsStats();
  }

  // Вспомогательные методы
  private getStockStatus(quantity: number, threshold: number): string {
    if (quantity === 0) return 'out_of_stock';
    if (quantity <= threshold) return 'low';
    return 'normal';
  }

  // Обновить TV-борд
  private async updateTVBoard(locationId: string) {
    const client = await this.prisma.client();
    
    const preparing = await client.order.findMany({
      where: {
        locationId,
        status: { in: ['accepted', 'preparing'] },
      },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        createdAt: true,
        user: {
          select: { telegramFirstName: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

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
    });

    const data = {
      preparing: preparing.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName || o.user?.telegramFirstName || 'Гость',
      })),
      ready: ready.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName || o.user?.telegramFirstName || 'Гость',
      })),
    };

    this.ordersGateway.notifyTVBoardUpdate(locationId, data);
  }
}
