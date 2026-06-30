import { api } from '@/lib/axios';

export const CashRegisterService = {
  getHistory: async (page: number = 1, limit: number = 10) => {
    const { data } = await api.get('/cash-register/history', {
      params: { page, limit }
    });
    return data;
  },
  saveCash: async (cashData: any) => {
    const { data } = await api.post('/cash-register/save', cashData);
    return data;
  },
  getTodayCash: async () => {
    const { data } = await api.get('/cash-register/today');
    return data;
  }
};
