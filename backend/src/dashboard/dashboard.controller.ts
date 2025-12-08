import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getOverview(
    @Query('period') period?: 'today' | 'week' | 'month',
    @Query('locationId') locationId?: string,
  ) {
    return this.dashboardService.getOverview(period || 'today', locationId);
  }

  @Get('top-products')
  getTopProducts(
    @Query('locationId') locationId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.dashboardService.getTopProducts(locationId, limit ? parseInt(limit) : 5);
  }

  @Get('by-location')
  getByLocation() {
    return this.dashboardService.getByLocation();
  }

  @Get('realtime')
  getRealtime(@Query('locationId') locationId?: string) {
    return this.dashboardService.getRealtime(locationId);
  }
}

