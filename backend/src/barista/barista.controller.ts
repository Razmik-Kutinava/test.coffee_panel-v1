import { Controller, Get, Patch, Param, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { BaristaService } from './barista.service';

@Controller('barista')
export class BaristaController {
  constructor(private readonly service: BaristaService) {}

  // Получить активные заказы для точки
  @Get('orders')
  async getOrders(@Query('locationId') locationId: string) {
    if (!locationId) {
      throw new HttpException('locationId is required', HttpStatus.BAD_REQUEST);
    }
    return this.service.getActiveOrders(locationId);
  }

  // Получить детали заказа
  @Get('orders/:id')
  async getOrder(@Param('id') id: string) {
    return this.service.getOrderDetails(id);
  }

  // Сменить статус заказа
  @Patch('orders/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: { status: string; cancellationReason?: string },
  ) {
    return this.service.updateOrderStatus(id, dto.status, dto.cancellationReason);
  }

  // Получить остатки товаров для точки
  @Get('stock')
  async getStock(@Query('locationId') locationId: string) {
    if (!locationId) {
      throw new HttpException('locationId is required', HttpStatus.BAD_REQUEST);
    }
    return this.service.getStock(locationId);
  }

  // Обновить остаток товара
  @Patch('stock/:id')
  async updateStock(
    @Param('id') id: string,
    @Body() dto: { stockQuantity?: number; isAvailable?: boolean; unavailableReason?: string },
  ) {
    return this.service.updateStock(id, dto);
  }

  // Быстрая корректировка остатка (+1/-1)
  @Patch('stock/:id/adjust')
  async adjustStock(
    @Param('id') id: string,
    @Body() dto: { adjustment: number },
  ) {
    return this.service.adjustStock(id, dto.adjustment);
  }

  // Статистика за сегодня
  @Get('stats')
  async getStats(@Query('locationId') locationId: string) {
    if (!locationId) {
      throw new HttpException('locationId is required', HttpStatus.BAD_REQUEST);
    }
    return this.service.getTodayStats(locationId);
  }

  // Статус WebSocket подключений
  @Get('connections')
  async getConnections() {
    return this.service.getConnectionsStats();
  }
}

