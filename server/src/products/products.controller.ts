import { Controller, Get, Post, Body, Put, Delete, Param } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll() {
    // Los parámetros de query se pueden enviar pero aquí hacemos findAll sin paginar
    // El frontend manejará la paginación
    return this.productsService.findAll();
  }

  @Get('categories')
  findAllCategories() {
    return this.productsService.findAllCategories();
  }

  @Post()
  create(@Body() body: any) {
    return this.productsService.create(body);
  }

  @Post('bulk')
  bulkCreate(@Body() products: any[]) {
    return this.productsService.bulkCreate(products);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.productsService.update(+id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}