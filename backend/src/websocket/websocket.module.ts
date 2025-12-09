import { Module, Global } from '@nestjs/common';
import { OrdersGateway } from './websocket.gateway';

@Global()
@Module({
  providers: [OrdersGateway],
  exports: [OrdersGateway],
})
export class WebsocketModule {}

