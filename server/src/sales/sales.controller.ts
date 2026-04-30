import { Controller, Post, Get, Body } from '@nestjs/common';
import { SalesService } from './sales.service';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Body() saleData: any) {
    return this.salesService.createSale(saleData);
  }

  @Get('stats')
  getStats() {
    return this.salesService.getStats();
  }

  @Get('today')
  findToday() {
    return this.salesService.findByDate(new Date());
  }

  @Get()
  findAll() {
    return this.salesService.findAll();
  }
}