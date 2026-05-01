import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private parseNumber(value: unknown): number {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (value === null || value === undefined) return 0;

    const raw = String(value).trim();
    if (!raw) return 0;

    const cleaned = raw.replace(/\s/g, '');
    const hasComma = cleaned.includes(',');
    const hasDot = cleaned.includes('.');

    if (hasComma && hasDot) {
      const lastComma = cleaned.lastIndexOf(',');
      const lastDot = cleaned.lastIndexOf('.');
      const normalized = lastComma > lastDot
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned.replace(/,/g, '');
      return Number(normalized) || 0;
    }

    if (hasComma) {
      return Number(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
    }

    if (hasDot && /^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
      return Number(cleaned.replace(/\./g, '')) || 0;
    }

    return Number(cleaned.replace(/,/g, '')) || 0;
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: { category: true },
      orderBy: { name: 'asc' }
    });
  }

  async findAllCategories() {
    return this.prisma.category.findMany();
  }

  async create(data: { name: string, price: number, stock: number, categoryId?: number, categoryName?: string }) {
    let categoryId: number | null = null;
    
    if (data.categoryId) {
      categoryId = data.categoryId;
    } else if (data.categoryName) {
      const category = await this.prisma.category.upsert({
        where: { name: data.categoryName },
        update: {},
        create: { name: data.categoryName },
      });
      categoryId = category.id;
    }

    return this.prisma.product.create({
      data: {
        name: data.name,
        price: this.parseNumber(data.price),
        stock: Math.trunc(this.parseNumber(data.stock)),
        cost: 0,
        categoryId: categoryId
      }
    });
  }

  async update(id: number, data: { name?: string, price?: number, stock?: number, categoryId?: number }) {
    return this.prisma.product.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.price !== undefined && { price: this.parseNumber(data.price) }),
        ...(data.stock !== undefined && { stock: Math.trunc(this.parseNumber(data.stock)) }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId })
      },
      include: { category: true }
    });
  }

  async remove(id: number) {
    return this.prisma.product.delete({
      where: { id }
    });
  }

  async bulkCreate(products: any[]) {
    const results: any[] = []; // Se define el tipo para evitar el error 'never'

    for (const item of products) {
      if (!item.name) continue; 

      let categoryId: number | null = null;
      if (item.categoryName) {
        const category = await this.prisma.category.upsert({
          where: { name: String(item.categoryName) },
          update: {},
          create: { name: String(item.categoryName) },
        });
        categoryId = category.id;
      }

      const created = await this.prisma.product.create({
        data: {
          name: String(item.name),
          price: this.parseNumber(item.price),
          stock: Math.trunc(this.parseNumber(item.stock)),
          cost: 0,
          categoryId: categoryId
        }
      });
      results.push(created);
    }
    return results;
  }
}
