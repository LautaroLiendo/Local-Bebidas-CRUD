import { Controller, Post, Get, Body, Query } from '@nestjs/common';
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

  @Get('summary')
  getSummary() {
    return this.salesService.getDailySummary();
  }

  @Get('today')
  findToday() {
    return this.salesService.findByDate(new Date());
  }

  @Get('range')
  findByRange(@Query('from') from: string, @Query('to') to: string) {
    return this.salesService.findByRange(new Date(from), new Date(to));
  }

  @Get()
  findAll() {
    return this.salesService.findAll();
  }
}
