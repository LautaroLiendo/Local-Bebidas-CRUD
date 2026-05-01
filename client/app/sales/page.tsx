'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<any[]>([]);

  useEffect(() => {
    api.get('/sales').then(res => setSales(res.data));
  }, []);

  const formatPrice = (price: number) => {
    const rounded = Math.round((Number(price) || 0) * 100) / 100;
    if (rounded % 1 === 0) {
      return rounded.toLocaleString('es-AR');
    }
    return rounded.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Historial de Ventas</h1>
      <div className="border rounded-lg bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>{new Date(sale.createdAt).toLocaleString()}</TableCell>
                <TableCell>{sale.paymentMethod}</TableCell>
                <TableCell>
                  {sale.items.map((i: any) => (
                    `${i.productName || i.product?.name || 'Producto'} x${i.quantity} ($${formatPrice(i.price)})`
                  )).join(', ')}
                </TableCell>
                <TableCell className="text-right font-bold">${formatPrice(sale.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
