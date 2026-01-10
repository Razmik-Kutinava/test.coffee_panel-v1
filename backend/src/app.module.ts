import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { LocationsModule } from './locations/locations.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { PromocodesModule } from './promocodes/promocodes.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { ModifierGroupsModule } from './modifier-groups/modifier-groups.module';
import { ModifierOptionsModule } from './modifier-options/modifier-options.module';
import { BroadcastsModule } from './broadcasts/broadcasts.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { WebsocketModule } from './websocket/websocket.module';
import { BaristaModule } from './barista/barista.module';
import { TVBoardModule } from './tv-board/tv-board.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    PrismaModule,
    WebsocketModule,
    LocationsModule,
    ProductsModule,
    OrdersModule,
    PromocodesModule,
    UsersModule,
    CategoriesModule,
    ModifierGroupsModule,
    ModifierOptionsModule,
    BroadcastsModule,
    DashboardModule,
    BaristaModule,
    TVBoardModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
