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

@Module({
  imports: [
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
