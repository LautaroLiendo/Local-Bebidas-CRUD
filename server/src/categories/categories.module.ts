import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { PrismaService } from '../prisma/prisma.service'; // <--- 1. Importa el servicio

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, PrismaService], // <--- 2. Agrégalo a los providers
})
export class CategoriesModule {}