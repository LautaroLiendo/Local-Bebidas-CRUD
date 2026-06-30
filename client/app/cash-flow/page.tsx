'use client';
import { useState, useEffect } from 'react';
import { SaleService } from '@/services/sale.service';
import { CashRegisterService } from '@/services/cash-register.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Landmark, Calculator, ChevronLeft, ChevronRight } from 'lucide-react';

interface CashHistory {
  items: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function CashFlowPage() {
  const [stats, setStats] = useState({ cashTotal: 0, transferTotal: 0, totalBox: 0 });
  const [history, setHistory] = useState<CashHistory>({ items: [], total: 0, page: 1, limit: 10, totalPages: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    SaleService.getSummary().then(setStats).catch(console.error);
  }, []);

  useEffect(() => {
    loadHistory(history.page);
  }, []);

  const loadHistory = async (page: number) => {
    setLoading(true);
    try {
      const data = await CashRegisterService.getHistory(page, 10);
      setHistory(data);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousPage = () => {
    if (history.page > 1) {
      loadHistory(history.page - 1);
    }
  };

  const handleNextPage = () => {
    if (history.page < history.totalPages) {
      loadHistory(history.page + 1);
    }
  };

  const formatPrice = (price: number) => {
    const rounded = Math.round((Number(price) || 0) * 100) / 100;
    if (rounded % 1 === 0) return rounded.toLocaleString('es-AR');
    return rounded.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
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

      <Card>
        <CardHeader>
          <CardTitle>Historial de Cajas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Fecha</th>
                  <th className="text-left py-3 px-4 font-semibold">Apertura</th>
                  <th className="text-left py-3 px-4 font-semibold">Efectivo</th>
                  <th className="text-left py-3 px-4 font-semibold">Transferencias</th>
                  <th className="text-left py-3 px-4 font-semibold">Total</th>
                  <th className="text-left py-3 px-4 font-semibold">Transacciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      Cargando...
                    </td>
                  </tr>
                ) : history.items.length > 0 ? (
                  history.items.map((item: any) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{new Date(item.closedAt).toLocaleDateString('es-AR')}</td>
                      <td className="py-3 px-4 font-mono">${formatPrice(item.opening)}</td>
                      <td className="py-3 px-4 font-mono text-green-600">${formatPrice(item.cash)}</td>
                      <td className="py-3 px-4 font-mono text-blue-600">${formatPrice(item.transfer)}</td>
                      <td className="py-3 px-4 font-mono font-semibold">${formatPrice(item.cash + item.transfer)}</td>
                      <td className="py-3 px-4">{item.transactionCount}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      No hay cajas registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {history.totalPages > 0 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Página {history.page} de {history.totalPages} ({history.total} registros totales)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={history.page === 1 || loading}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={history.page === history.totalPages || loading}
                  className="flex items-center gap-1"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}  
