import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';

@Controller('cash-register')
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  @Post('save')
  async saveCash(@Body() data: {
    date: string;
    opening: number;
    cash: number;
    transfer: number;
    transactionCount?: number;
    openedAt?: string;
    closedAt?: string;
  }) {
    try {
      return await this.cashRegisterService.saveCashSummary({
        date: data.date,
        opening: data.opening,
        cash: data.cash,
        transfer: data.transfer,
        transactionCount: data.transactionCount,
        openedAt: data.openedAt,
        closedAt: data.closedAt
      });
    } catch (error) {
      console.error('Error al guardar caja:', error);
      throw error;
    }
  }

  @Get('history')
  async getHistory(@Query('limit') limit: string = '30') {
    try {
      return await this.cashRegisterService.getCashHistory(parseInt(limit));
    } catch (error) {
      console.error('Error al obtener historial:', error);
      throw error;
    }
  }

  @Get('today')
  async getTodayCash() {
    try {
      return await this.cashRegisterService.getTodayCash();
    } catch (error) {
      console.error('Error al obtener caja de hoy:', error);
      throw error;
    }
  }
}
