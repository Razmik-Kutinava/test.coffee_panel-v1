import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/',
})
export class OrdersGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('OrdersGateway');
  private connectedClients: Map<string, { locationId?: string; type?: string }> = new Map();

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.connectedClients.set(client.id, {});
    this.logger.log(`Client connected: ${client.id} (Total: ${this.connectedClients.size})`);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id} (Total: ${this.connectedClients.size})`);
  }

  // Подписка на локацию (для табло баристы)
  @SubscribeMessage('subscribe_barista')
  handleSubscribeBarista(client: Socket, locationId: string) {
    const room = `barista:${locationId}`;
    client.join(room);
    this.connectedClients.set(client.id, { locationId, type: 'barista' });
    this.logger.log(`Barista ${client.id} subscribed to location ${locationId}`);
    return { event: 'subscribed', data: { room, locationId } };
  }

  // Подписка для TV-борда
  @SubscribeMessage('subscribe_tvboard')
  handleSubscribeTVBoard(client: Socket, locationId: string) {
    const room = `tvboard:${locationId}`;
    client.join(room);
    this.connectedClients.set(client.id, { locationId, type: 'tvboard' });
    this.logger.log(`TV Board ${client.id} subscribed to location ${locationId}`);
    return { event: 'subscribed', data: { room, locationId } };
  }

  // Отписка
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, locationId: string) {
    client.leave(`barista:${locationId}`);
    client.leave(`tvboard:${locationId}`);
    this.connectedClients.set(client.id, {});
    this.logger.log(`Client ${client.id} unsubscribed from location ${locationId}`);
    return { event: 'unsubscribed', data: { locationId } };
  }

  // === Методы для отправки событий ===

  // Новый заказ (для баристы)
  notifyNewOrder(locationId: string, order: any) {
    this.logger.log(`Emitting new_order to barista:${locationId}`);
    this.server.to(`barista:${locationId}`).emit('new_order', order);
  }

  // Обновление статуса заказа (для баристы и TV-борда)
  notifyOrderStatusChanged(locationId: string, order: any) {
    this.logger.log(`Emitting order_status_changed to location ${locationId}`);
    this.server.to(`barista:${locationId}`).emit('order_status_changed', order);
    this.server.to(`tvboard:${locationId}`).emit('order_status_changed', order);
  }

  // Полное обновление TV-борда
  notifyTVBoardUpdate(locationId: string, data: { preparing: any[]; ready: any[] }) {
    this.logger.log(`Emitting tvboard_update to tvboard:${locationId}`);
    this.server.to(`tvboard:${locationId}`).emit('tvboard_update', data);
  }

  // Заказ готов (с анимацией)
  notifyOrderReady(locationId: string, order: any) {
    this.logger.log(`Emitting order_ready to tvboard:${locationId}`);
    this.server.to(`tvboard:${locationId}`).emit('order_ready', order);
  }

  // Заказ выдан
  notifyOrderCompleted(locationId: string, orderId: string) {
    this.logger.log(`Emitting order_completed to tvboard:${locationId}`);
    this.server.to(`tvboard:${locationId}`).emit('order_completed', { orderId });
  }

  // Обновление остатков (для баристы)
  notifyStockUpdate(locationId: string, stock: any) {
    this.logger.log(`Emitting stock_update to barista:${locationId}`);
    this.server.to(`barista:${locationId}`).emit('stock_update', stock);
  }

  // Получить статистику подключений
  getConnectionsStats() {
    const stats = {
      total: this.connectedClients.size,
      barista: 0,
      tvboard: 0,
      other: 0,
    };

    this.connectedClients.forEach((info) => {
      if (info.type === 'barista') stats.barista++;
      else if (info.type === 'tvboard') stats.tvboard++;
      else stats.other++;
    });

    return stats;
  }
}

