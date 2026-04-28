import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service'; // <--- EL PUENTE

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {} // Inyectamos Prisma

  async create(createProductDto: CreateProductDto) {
    return await this.prisma.product.create({
      data: createProductDto,
    });
  }

  async findAll() {
    return await this.prisma.product.findMany({
      include: { category: true }, // Trae la categoría relacionada
    });
  }

  async findOne(id: number) {
    return await this.prisma.product.findUnique({
      where: { id: Number(id) },
    });
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    return await this.prisma.product.update({
      where: { id: Number(id) },
      data: updateProductDto,
    });
  }

  async remove(id: number) {
    return await this.prisma.product.delete({
      where: { id: Number(id) },
    });
  }
}