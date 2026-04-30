import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

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
        price: Number(data.price),
        stock: Number(data.stock),
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
        ...(data.price !== undefined && { price: Number(data.price) }),
        ...(data.stock !== undefined && { stock: Number(data.stock) }),
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
          price: Number(item.price || 0),
          stock: Number(item.stock || 0),
          cost: 0,
          categoryId: categoryId
        }
      });
      results.push(created);
    }
    return results;
  }
}