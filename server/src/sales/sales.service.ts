import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async createSale(data: { paymentMethod: 'EFECTIVO' | 'TRANSFERENCIA', items: { productId: number, quantity: number, unitPrice: number }[] }) {
    const total = data.items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          total,
          paymentMethod: data.paymentMethod,
          items: { create: data.items.map(item => ({ productId: item.productId, quantity: item.quantity, price: item.unitPrice })) }
        }
      });
      for (const item of data.items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
      }
      return sale;
    });
  }

  async getStats() {
    const totalProducts = await this.prisma.product.count();
    const lowStock = await this.prisma.product.count({ where: { stock: { lt: 5 } } });
    const totalSales = await this.prisma.sale.aggregate({ _sum: { total: true } });
    return { totalProducts, lowStock, totalSales: totalSales._sum.total || 0 };
  }

  async findAll() {
    return this.prisma.sale.findMany({
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findByDate(date: Date) {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    return this.prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }
}