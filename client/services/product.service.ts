// client/services/product.service.ts
import { api } from '@/lib/axios';

export const ProductService = {
  findAll: async () => {
    const { data } = await api.get('/products');
    return data;
  },
  create: async (productData: any) => {
    const { data } = await api.post('/products', productData);
    return data;
  }
};