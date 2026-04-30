import { api } from '@/lib/axios';

export const CategoryService = {
  findAll: async () => {
    const { data } = await api.get('/categories');
    return data;
  },
};