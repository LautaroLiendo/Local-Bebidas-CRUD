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

  private cleanName(value: unknown): string {
    return String(value ?? '').trim().replace(/\s+/g, ' ');
  }

  private normalizeProductName(value: unknown): string {
    return this.cleanName(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
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

  async replaceFromImport(products: any[]) {
    const groupedProducts = new Map<string, {
      name: string;
      price: number;
      stock: number;
      categoryName: string | null;
    }>();

    for (const item of products) {
      const name = this.cleanName(item.name);
      const normalizedName = this.normalizeProductName(name);
      if (!normalizedName) continue;

      const stock = Math.trunc(this.parseNumber(item.stock));
      const price = this.parseNumber(item.price);
      const categoryName = this.cleanName(item.categoryName) || null;
      const existing = groupedProducts.get(normalizedName);

      if (existing) {
        existing.stock += stock;
        if (price > 0) existing.price = price;
        if (!existing.categoryName && categoryName) existing.categoryName = categoryName;
      } else {
        groupedProducts.set(normalizedName, {
          name,
          price,
          stock,
          categoryName
        });
      }
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE "SaleItem"
        SET "productName" = "Product"."name"
        FROM "Product"
        WHERE "SaleItem"."productId" = "Product"."id"
        AND "SaleItem"."productName" = 'Producto eliminado'
      `;
      await tx.$executeRaw`UPDATE "SaleItem" SET "productId" = NULL WHERE "productId" IS NOT NULL`;
      const deletedProducts = await tx.$executeRaw`DELETE FROM "Product"`;
      await tx.$executeRaw`ALTER SEQUENCE "Product_id_seq" RESTART WITH 1`;

      const results: any[] = [];

      for (const item of groupedProducts.values()) {
        let categoryId: number | null = null;
        if (item.categoryName) {
          const category = await tx.category.upsert({
            where: { name: item.categoryName },
            update: {},
            create: { name: item.categoryName },
          });
          categoryId = category.id;
        }

        const created = await tx.product.create({
          data: {
            name: item.name,
            price: item.price,
            stock: item.stock,
            cost: 0,
            categoryId
          }
        });
        results.push(created);
      }

      return {
        deleted: Number(deletedProducts),
        created: results.length,
        products: results
      };
    });
  }

  async bulkCreate(products: any[]) {
    return this.replaceFromImport(products);
  }
}
