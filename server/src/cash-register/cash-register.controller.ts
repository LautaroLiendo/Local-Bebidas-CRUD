import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';

@Controller('cash-register')
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  @Post('save')
  saveCash(@Body() data: { date: string, opening: number, cash: number, transfer: number }) {
    return this.cashRegisterService.saveCashSummary({
      date: new Date(data.date),
      opening: data.opening,
      cash: data.cash,
      transfer: data.transfer
    });
  }

  @Get('history')
  getHistory(@Query('limit') limit: string = '30') {
    return this.cashRegisterService.getCashHistory(parseInt(limit));
  }

  @Get('today')
  getTodayCash() {
    return this.cashRegisterService.getTodayCash();
  }
}
