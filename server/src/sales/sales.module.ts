import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { PrismaService } from '../prisma/prisma.service'; // <--- 1. Importa

@Module({
  controllers: [SalesController],
  providers: [SalesService, PrismaService], // <--- 2. Agrégalo
})
export class SalesModule {}