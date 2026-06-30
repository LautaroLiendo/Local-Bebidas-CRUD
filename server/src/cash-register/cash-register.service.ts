import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CashRegisterService {
  constructor(private prisma: PrismaService) {}

  async saveCashSummary(data: {
    date: string | Date;
    opening: number;
    cash: number;
    transfer: number;
    cashReceived?: number;
    changeGiven?: number;
    transactionCount?: number;
    openedAt?: string | Date;
    closedAt?: string | Date;
  }) {
    let dateOnly: Date;
    
    if (typeof data.date === 'string') {
      // Esperamos formato YYYY-MM-DD
      const [year, month, day] = data.date.split('-').map(Number);
      dateOnly = new Date(year, month - 1, day);
    } else {
      dateOnly = new Date(data.date.getFullYear(), data.date.getMonth(), data.date.getDate());
    }
    
    return this.prisma.cashRegister.create({
      data: {
        date: dateOnly,
        opening: Number(data.opening) || 0,
        cash: Number(data.cash) || 0,
        transfer: Number(data.transfer) || 0,
        cashReceived: Number(data.cashReceived) || 0,
        changeGiven: Number(data.changeGiven) || 0,
        transactionCount: Number(data.transactionCount) || 0,
        openedAt: data.openedAt ? new Date(data.openedAt) : new Date(),
        closedAt: data.closedAt ? new Date(data.closedAt) : new Date(),
      }
    });
  }

  async getCashHistory(page: number = 1, limit: number = 10) {
    const safePage = Math.max(1, page || 1);
    const safeLimit = Math.min(Math.max(1, limit || 10), 100);
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.cashRegister.findMany({
        orderBy: { closedAt: 'desc' },
        skip,
        take: safeLimit
      }),
      this.prisma.cashRegister.count()
    ]);

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit))
    };
  }

  async getTodayCash() {
    const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    return this.prisma.cashRegister.findFirst({
      where: { date: today },
      orderBy: { closedAt: 'desc' }
    });
  }
}
