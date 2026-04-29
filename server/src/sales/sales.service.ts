import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async create(createSaleDto: CreateSaleDto) {
    return await this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          total: createSaleDto.total,
          items: {
            create: createSaleDto.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
      });

      for (const item of createSaleDto.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
      return sale;
    });
  }

  async findAll() {
    return await this.prisma.sale.findMany({
      include: { items: { include: { product: true } } },
    });
  }

  async findOne(id: number) {
    return await this.prisma.sale.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });
  }

async update(id: number, updateSaleDto: UpdateSaleDto) {
    // Extraemos 'items' de updateSaleDto para que no intentemos pasárselo a Prisma.
    // 'data' contendrá todo lo que vino en el DTO, EXCEPTO los items.
    const { items, ...data } = updateSaleDto; 
    
    return await this.prisma.sale.update({
      where: { id },
      data: data, // Aquí solo pasamos los campos planos (como 'total')
    });
  }

  async remove(id: number) {
    return await this.prisma.sale.delete({
      where: { id },
    });
  }
}