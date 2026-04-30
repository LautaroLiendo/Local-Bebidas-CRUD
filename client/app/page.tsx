'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DollarSign, Lock, LockOpen, AlertCircle, Check, CreditCard, Banknote, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '@/lib/axios';
import { toast } from 'sonner';

interface CashSummary {
  date: string;
  opening: number;
  cash: number;
  transfer: number;
  total: number;
}

export default function CashRegisterPage() {
  const [cashOpen, setCashOpen] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');
  const [dayData, setDayData] = useState<any>(null);
  const [history, setHistory] = useState<CashSummary[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadCashStatus();
    loadHistory();
  }, []);

  const loadHistory = () => {
    try {
      const saved = localStorage.getItem('cashHistory');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
    }
  };

  const loadCashStatus = () => {
    try {
      // Verificar si hay caja abierta
      const saved = sessionStorage.getItem('cashOpen');
      const amount = sessionStorage.getItem('openingAmount');
      
      if (saved === 'true') {
        setCashOpen(true);
        setOpeningAmount(amount || '');
        // NO cargar ventas mientras está abierta
        setDayData({ cash: 0, transfer: 0, total: 0, transactionCount: 0 });
      } else {
        setCashOpen(false);
        setOpeningAmount('');
        setDayData({ cash: 0, transfer: 0, total: 0, transactionCount: 0 });
      }
    } catch (error) {
      console.error('Error al cargar estado de caja:', error);
    }
  };

  const handleOpenCash = async () => {
    const amount = parseFloat(openingAmount) || 0;
    
    if (amount < 0) {
      toast.error('El monto inicial debe ser válido');
      return;
    }

    setIsProcessing(true);
    try {
      sessionStorage.setItem('cashOpen', 'true');
      sessionStorage.setItem('openingAmount', amount.toString());
      setCashOpen(true);
      toast.success(`✓ Caja abierta con $${amount.toFixed(2)}`);
    } catch (error) {
      toast.error('Error al abrir caja');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseCash = async () => {
    setIsProcessing(true);
    try {
      const amount = parseFloat(openingAmount) || 0;
      
      // Cargar ventas del día para guardar resumen
      const salesRes = await api.get('/sales/today');
      const sales = Array.isArray(salesRes.data) ? salesRes.data : [];
      
      const cashTotal = sales
        .filter((s: any) => s.paymentMethod === 'EFECTIVO')
        .reduce((sum: number, s: any) => sum + (s.total || 0), 0);
      
      const transferTotal = sales
        .filter((s: any) => s.paymentMethod === 'TRANSFERENCIA')
        .reduce((sum: number, s: any) => sum + (s.total || 0), 0);
      
      const totalSales = cashTotal + transferTotal;

      // Guardar en historial
      const today = new Date().toLocaleDateString('es-AR').split('/').reverse().join('-');
      const newSummary: CashSummary = {
        date: today,
        opening: amount,
        cash: cashTotal,
        transfer: transferTotal,
        total: totalSales
      };

      const updatedHistory = [newSummary, ...history];
      localStorage.setItem('cashHistory', JSON.stringify(updatedHistory));
      
      // Mostrar resumen final
      setDayData({
        cash: cashTotal,
        transfer: transferTotal,
        total: totalSales,
        transactionCount: sales.length
      });

      // Limpiar sessionStorage
      sessionStorage.setItem('cashOpen', 'false');
      sessionStorage.removeItem('openingAmount');
      setCashOpen(false);
      setOpeningAmount('');
      
      // Recargar historial
      loadHistory();
      
      toast.success('✓ Caja cerrada correctamente');
    } catch (error) {
      console.error('Error al cerrar caja:', error);
      toast.error('Error al cerrar caja');
    } finally {
      setIsProcessing(false);
    }
  };

  const getTodayName = () => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[new Date().getDay()];
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">Cierre de Caja</h1>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold ${
          cashOpen 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {cashOpen ? <LockOpen size={20} /> : <Lock size={20} />}
          {cashOpen ? 'Caja Abierta' : 'Caja Cerrada'}
        </div>
      </div>

      {/* Si caja está ABIERTA: Mostrar SOLO monto inicial */}
      {cashOpen && (
        <div className="grid grid-cols-1 gap-4">
          <Card className="border-4 border-green-400 bg-green-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-black text-green-900">Monto Inicial en Caja</CardTitle>
              <LockOpen className="w-6 h-6 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-black text-green-700">${parseFloat(openingAmount || '0').toFixed(2)}</div>
              <p className="text-sm text-green-600 mt-2">Esta es la cantidad de dinero con la que abriste la caja.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Si caja está CERRADA: Formulario para abrir */}
      {!cashOpen && (
        <div className="bg-white border-2 border-slate-200 rounded-lg p-6 space-y-6">
          <h2 className="text-lg font-bold text-slate-800">Abrir Nueva Caja</h2>
          <p className="text-sm text-slate-600">Ingresa el monto inicial de efectivo para abrir la caja</p>
          
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700 mb-2 block">Monto Inicial ($)</span>
              <Input 
                type="number" 
                placeholder="0.00"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                className="h-11 text-lg font-semibold"
                disabled={isProcessing}
              />
            </label>
          </div>

          <Button 
            onClick={handleOpenCash}
            disabled={isProcessing}
            className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold text-lg"
          >
            <LockOpen className="mr-2" /> Abrir Caja
          </Button>
        </div>
      )}

      {/* Si caja está ABIERTA: Botón para cerrar */}
      {cashOpen && (
        <div className="bg-white border-2 border-red-200 rounded-lg p-6 space-y-4">
          <Button 
            onClick={handleCloseCash}
            disabled={isProcessing}
            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold text-lg"
          >
            <Lock className="mr-2" /> Cerrar Caja y Ver Resumen
          </Button>
        </div>
      )}

      {/* Resumen final (solo después de cerrar) */}
      {!cashOpen && dayData?.total > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Resumen del Cierre de Hoy ({getTodayName()})</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Monto Inicial</CardTitle>
                <DollarSign className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${parseFloat(openingAmount || '0').toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Efectivo Vendido</CardTitle>
                <Banknote className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${dayData.cash.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Transferencias</CardTitle>
                <CreditCard className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">${dayData.transfer.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Ganado</CardTitle>
                <Check className="w-4 h-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">${dayData.total.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-yellow-900">Dinero en Caja (Efectivo)</p>
                <p className="text-sm text-yellow-800 mt-1">
                  Monto inicial: ${parseFloat(openingAmount || '0').toFixed(2)} + Ventas en efectivo: ${dayData.cash.toFixed(2)}
                </p>
                <p className="text-lg font-black text-yellow-900 mt-2">
                  Total: ${(parseFloat(openingAmount || '0') + dayData.cash).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Detalles del Cierre</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Transacciones del Día:</span>
                <span className="font-bold">{dayData.transactionCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Ventas en Efectivo:</span>
                <span className="font-bold text-green-600">${dayData.cash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Ventas por Transferencia:</span>
                <span className="font-bold text-blue-600">${dayData.transfer.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t-2">
                <span className="text-slate-800 font-bold">Total Vendido:</span>
                <span className="font-black text-purple-600">${dayData.total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Historial de Cajas */}
      {history.length > 0 && (
        <div className="bg-white border-2 border-slate-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <h2 className="text-lg font-bold text-slate-800">Historial de Cajas</h2>
            {showHistory ? (
              <ChevronUp className="text-slate-600" size={24} />
            ) : (
              <ChevronDown className="text-slate-600" size={24} />
            )}
          </button>

          {showHistory && (
            <div className="border-t-2 border-slate-200 divide-y-2 divide-slate-200">
              {history.map((summary, idx) => {
                const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                const [year, month, day] = summary.date.split('-');
                const dateObj = new Date(year, parseInt(month) - 1, day);
                const dayName = dayNames[dateObj.getDay()];

                return (
                  <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-slate-800">{dayName}</p>
                        <p className="text-sm text-slate-600">{summary.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-purple-600">${summary.total.toFixed(2)}</p>
                        <p className="text-xs text-slate-500">Total vendido</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="bg-blue-50 p-2 rounded">
                        <p className="text-slate-600">Inicial</p>
                        <p className="font-bold text-blue-600">${summary.opening.toFixed(2)}</p>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <p className="text-slate-600">Efectivo</p>
                        <p className="font-bold text-green-600">${summary.cash.toFixed(2)}</p>
                      </div>
                      <div className="bg-blue-50 p-2 rounded">
                        <p className="text-slate-600">Transferencia</p>
                        <p className="font-bold text-blue-600">${summary.transfer.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
