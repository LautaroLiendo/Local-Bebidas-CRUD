import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { SalesModule } from './sales/sales.module';

@Module({
  imports: [ProductsModule, CategoriesModule, SalesModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
