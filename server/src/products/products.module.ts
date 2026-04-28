import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaService } from '../prisma/prisma.service'; // <--- IMPORTANTE

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, PrismaService], // <--- IMPORTANTE
})
export class ProductsModule {}