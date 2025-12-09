import { Module, DynamicModule } from '@nestjs/common';
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
import { BaristaModule } from './barista/barista.module';
import { TVBoardModule } from './tv-board/tv-board.module';

// WebSocket только для non-serverless (Railway, local)
// На Vercel WebSocket не поддерживается
const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;

// Базовые модули (всегда импортируются)
const coreModules = [
  PrismaModule,
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
];

@Module({
  imports: coreModules,
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  static async forRoot(): Promise<DynamicModule> {
    const imports = [...coreModules];
    
    // Добавляем WebSocket только если не serverless
    if (!isServerless) {
      try {
        const { WebsocketModule } = await import('./websocket/websocket.module');
        imports.push(WebsocketModule);
      } catch (e) {
        console.log('WebSocket module skipped (serverless environment)');
      }
    }

    return {
      module: AppModule,
      imports,
      controllers: [AppController],
      providers: [AppService],
    };
  }
}
