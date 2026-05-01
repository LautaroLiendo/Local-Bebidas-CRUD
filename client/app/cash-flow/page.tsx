'use client';
import { useState, useEffect } from 'react';
import { SaleService } from '@/services/sale.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Landmark, Calculator } from 'lucide-react';

export default function CashFlowPage() {
  const [stats, setStats] = useState({ cashTotal: 0, transferTotal: 0, totalBox: 0 });

  useEffect(() => {
    SaleService.getSummary().then(setStats).catch(console.error);
  }, []);

  const formatPrice = (price: number) => {
    const rounded = Math.round((Number(price) || 0) * 100) / 100;
    if (rounded % 1 === 0) return rounded.toLocaleString('es-AR');
    return rounded.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold">Arqueo de Caja (Cierre Diario)</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Dinero en Efectivo</CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-green-600">${formatPrice(stats.cashTotal)}</div>
            <p className="text-xs text-muted-foreground">Debería estar físicamente en el cajón</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Transferencias Bancarias</CardTitle>
            <Landmark className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-blue-600">${formatPrice(stats.transferTotal)}</div>
            <p className="text-xs text-muted-foreground">Dinero digital en la cuenta del banco</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-primary">
        <CardContent className="p-8 flex flex-col items-center justify-center space-y-4">
          <Calculator className="w-12 h-12 text-primary" />
          <h2 className="text-2xl font-semibold">Ventas Totales del Día</h2>
          <div className="text-6xl font-black font-mono">${formatPrice(stats.totalBox)}</div>
        </CardContent>
      </Card>
    </div>
  );
}  
