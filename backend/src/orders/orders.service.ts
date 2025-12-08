import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus, PaymentStatus, PromocodeScope } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto) {
    const client = await this.prisma.client();

    const location = await client.location.findUnique({ where: { id: dto.locationId } });
    if (!location) throw new NotFoundException('Location not found');

    // Validate products and pricing
    let subtotal = 0;
    const itemsData = [] as any[];

    for (const item of dto.items) {
      const product = await client.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);

      // If location-specific price exists
      const locProd = await client.locationProduct.findUnique({
        where: { locationId_productId: { locationId: dto.locationId, productId: item.productId } },
      }).catch(() => null);

      const basePrice = Number(locProd?.price ?? product.price ?? 0);

      const modifiers = item.modifiers ?? [];
      const modifiersTotal = modifiers.reduce((acc, m) => acc + Number(m.price ?? 0), 0);
      const unitPrice = basePrice + modifiersTotal;
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      itemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        modifiers: modifiers.map((m) => ({ modifierOptionId: m.modifierOptionId, price: m.price ?? 0 })),
      });
    }

    // Promocode validation
    let discountAmount = 0;
    let promocodeId: string | undefined = undefined;
    if (dto.promocodeCode) {
      const promo = await client.promocode.findFirst({
        where: {
          code: dto.promocodeCode,
          isActive: true,
          OR: [
            { scope: PromocodeScope.global },
            { scope: PromocodeScope.location, locationId: dto.locationId },
          ],
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }] },
            { OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] },
          ],
        },
      });
      if (!promo) throw new BadRequestException('Promocode invalid');
      if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
        throw new BadRequestException('Promocode usage limit reached');
      }
      promocodeId = promo.id;
      if (promo.type === 'percent') {
        discountAmount = subtotal * (Number(promo.value) / 100);
      } else {
        discountAmount = Number(promo.value);
      }
      discountAmount = Math.min(discountAmount, subtotal);
    }

    const totalAmount = subtotal - discountAmount;

    const order = await client.order.create({
      data: {
        userId: dto.userId,
        locationId: dto.locationId,
        status: OrderStatus.created,
        paymentStatus: PaymentStatus.pending,
        subtotal,
        totalAmount,
        discountAmount,
        promocodeId,
        items: {
          create: itemsData.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.totalPrice,
            modifiers: {
              create: i.modifiers,
            },
          })),
        },
        history: {
          create: { newStatus: OrderStatus.created },
        },
      },
      include: { items: { include: { modifiers: true, product: true } }, history: true, location: true },
    });

    if (promocodeId) {
      await client.promocode.update({
        where: { id: promocodeId },
        data: { usedCount: { increment: 1 } },
      });
    }

    return order;
  }

  async findAll(status?: OrderStatus, locationId?: string) {
    const client = await this.prisma.client();
    return client.order.findMany({
      where: {
        ...(status && { status }),
        ...(locationId && { locationId }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { modifiers: true, product: true } },
        location: true,
        promocode: true,
        user: true,
        history: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client();
    const order = await client.order.findUnique({
      where: { id },
      include: {
        items: { include: { modifiers: true, product: true } },
        location: true,
        promocode: true,
        user: true,
        history: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const client = await this.prisma.client();
    const order = await client.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    const updated = await client.order.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.paymentStatus && { paymentStatus: dto.paymentStatus }),
      },
      include: {
        items: { include: { modifiers: true, product: true } },
        location: true,
        promocode: true,
        user: true,
      },
    });

    // Add to history
    await client.orderStatusHistory.create({
      data: {
        orderId: id,
        oldStatus: order.status,
        newStatus: dto.status,
        changedById: dto.changedById,
      },
    });

    return updated;
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus) {
    const client = await this.prisma.client();
    const order = await client.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    return client.order.update({
      where: { id },
      data: { paymentStatus },
      include: {
        items: { include: { modifiers: true, product: true } },
        location: true,
        promocode: true,
        user: true,
      },
    });
  }

  async remove(id: string) {
    const client = await this.prisma.client();
    const order = await client.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    // Delete related records first
    await client.orderItemModifier.deleteMany({
      where: { orderItem: { orderId: id } },
    });
    await client.orderItem.deleteMany({
      where: { orderId: id },
    });
    await client.orderStatusHistory.deleteMany({
      where: { orderId: id },
    });

    return client.order.delete({ where: { id } });
  }

  async getStats(locationId?: string) {
    const client = await this.prisma.client();
    const where = locationId ? { locationId } : {};

    const [total, byStatus, byPaymentStatus, totalRevenue] = await Promise.all([
      client.order.count({ where }),
      client.order.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      client.order.groupBy({
        by: ['paymentStatus'],
        where,
        _count: true,
      }),
      client.order.aggregate({
        where: { ...where, paymentStatus: PaymentStatus.succeeded },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count }), {}),
      byPaymentStatus: byPaymentStatus.reduce((acc, item) => ({ ...acc, [item.paymentStatus]: item._count }), {}),
      totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
    };
  }
}
