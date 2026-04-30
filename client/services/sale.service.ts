import { api } from '@/lib/axios';

export const SaleService = {
  create: async (saleData: any) => {
    const { data } = await api.post('/sales', saleData);
    return data;
  },
  getSummary: async () => {
    const { data } = await api.get('/sales/summary');
    return data;
  }
};