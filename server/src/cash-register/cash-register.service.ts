import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CashRegisterService {
  constructor(private prisma: PrismaService) {}

  async saveCashSummary(data: { date: Date, opening: number, cash: number, transfer: number }) {
    const dateOnly = new Date(data.date.getFullYear(), data.date.getMonth(), data.date.getDate());
    
    return this.prisma.cashRegister.upsert({
      where: { date: dateOnly },
      update: {
        opening: data.opening,
        cash: data.cash,
        transfer: data.transfer
      },
      create: {
        date: dateOnly,
        opening: data.opening,
        cash: data.cash,
        transfer: data.transfer
      }
    });
  }

  async getCashHistory(limit: number = 30) {
    return this.prisma.cashRegister.findMany({
      orderBy: { date: 'desc' },
      take: limit
    });
  }

  async getTodayCash() {
    const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    return this.prisma.cashRegister.findUnique({
      where: { date: today }
    });
  }
}
