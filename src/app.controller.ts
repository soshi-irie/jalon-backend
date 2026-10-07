import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import type { RideRequest, RouteRequest } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('route')
  getRoute(@Body() { origin, destination }: RouteRequest) {
    return this.appService.getRoute(origin, destination);
  }

  @Post('intermediate')
  getRouteWithPassenger(@Body() { driverOrigin, riderOrigin, riderDestination, driverDestination }: RideRequest) {
    return this.appService.getRouteWithPassenger({driverOrigin, riderOrigin, riderDestination, driverDestination});
  }
}
