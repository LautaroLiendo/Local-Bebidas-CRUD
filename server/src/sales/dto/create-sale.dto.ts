export class CreateSaleDto {
  total: number;
  items: {
    productId: number;
    quantity: number;
    unitPrice: number;
  }[];
}