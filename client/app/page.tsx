'use client';
import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DollarSign, Lock, LockOpen, AlertCircle, Check, CreditCard, Banknote, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/axios';
import { toast } from 'sonner';

interface CashSummary {
  id: number;
  date: string;
  opening: number;
  cash: number;
  transfer: number;
  cashReceived: number;
  changeGiven: number;
  transactionCount: number;
  openedAt: string;
  closedAt: string;
}

interface DayData {
  cash: number;
  transfer: number;
  cashReceived: number;
  changeGiven: number;
  total: number;
  transactionCount: number;
  opening?: number;
}

interface SaleSummary {
  total?: number;
  cashReceived?: number;
  changeGiven?: number;
  paymentMethod: 'EFECTIVO' | 'TRANSFERENCIA' | string;
}

const HISTORY_PAGE_SIZE = 10;

export default function CashRegisterPage() {
  const [cashOpen, setCashOpen] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [history, setHistory] = useState<CashSummary[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const formatPrice = (price: number) => {
    const rounded = Math.round((Number(price) || 0) * 100) / 100;
    if (rounded % 1 === 0) {
      return rounded.toLocaleString('es-AR');
    }
    return rounded.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadHistory = useCallback(async (page: number) => {
    try {
      const res = await api.get('/cash-register/history', {
        params: { page, limit: HISTORY_PAGE_SIZE }
      });
      const data = res.data;

      if (Array.isArray(data)) {
        setHistory(data);
        setHistoryTotal(data.length);
        setHistoryTotalPages(1);
        return;
      }

      setHistory(data?.items || []);
      setHistoryTotal(data?.total || 0);
      setHistoryTotalPages(data?.totalPages || 1);
    } catch (error) {
      console.error('Error al cargar historial:', error);
      toast.error('Error al cargar historial');
    }
  }, []);

  const loadCashStatus = useCallback(() => {
    try {
      const saved = sessionStorage.getItem('cashOpen');
      const amount = sessionStorage.getItem('openingAmount');
      const openedAt = sessionStorage.getItem('cashOpenedAt');
      
      if (saved === 'true') {
        if (!openedAt) sessionStorage.setItem('cashOpenedAt', new Date().toISOString());
        setCashOpen(true);
        setOpeningAmount(amount || '');
        setDayData({ cash: 0, transfer: 0, cashReceived: 0, changeGiven: 0, total: 0, transactionCount: 0 });
      } else {
        setCashOpen(false);
        setOpeningAmount('');
        setDayData({ cash: 0, transfer: 0, cashReceived: 0, changeGiven: 0, total: 0, transactionCount: 0 });
      }
    } catch (error) {
      console.error('Error al cargar estado de caja:', error);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadCashStatus, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadCashStatus]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadHistory(historyPage);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [historyPage, loadHistory]);

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
      sessionStorage.setItem('cashOpenedAt', new Date().toISOString());
      setCashOpen(true);
      setDayData(null); // Limpiar datos del cierre anterior
      toast.success(`✓ Caja abierta con $${formatPrice(amount)}`);
    } catch {
      toast.error('Error al abrir caja');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseCash = async () => {
    setIsProcessing(true);
    try {
      const amount = parseFloat(openingAmount) || 0;
      const openedAt = sessionStorage.getItem('cashOpenedAt') || new Date().toISOString();
      const closedAt = new Date().toISOString();
      
      const salesRes = await api.get('/sales/range', {
        params: { from: openedAt, to: closedAt }
      });
      const sales: SaleSummary[] = Array.isArray(salesRes.data) ? salesRes.data : [];
      
      const cashTotal = sales
        .filter((s) => s.paymentMethod === 'EFECTIVO')
        .reduce((sum, s) => sum + (s.total || 0), 0);
      
      const transferTotal = sales
        .filter((s) => s.paymentMethod === 'TRANSFERENCIA')
        .reduce((sum, s) => sum + (s.total || 0), 0);

      const cashReceivedTotal = sales
        .filter((s) => s.paymentMethod === 'EFECTIVO')
        .reduce((sum, s) => sum + (s.cashReceived || s.total || 0), 0);

      const changeGivenTotal = sales
        .filter((s) => s.paymentMethod === 'EFECTIVO')
        .reduce((sum, s) => sum + (s.changeGiven || 0), 0);
      
      const totalSales = cashTotal + transferTotal;

      // Guardar en BD
      const today = new Date();
      const dateStr = getLocalDateString(today);
      
      console.log('Guardando caja:', { dateStr, amount, cashTotal, transferTotal });
      
      const saveRes = await api.post('/cash-register/save', {
        date: dateStr,
        opening: amount,
        cash: cashTotal,
        transfer: transferTotal,
        cashReceived: cashReceivedTotal,
        changeGiven: changeGivenTotal,
        transactionCount: sales.length,
        openedAt,
        closedAt
      });
      
      console.log('Caja guardada en BD:', saveRes.data);

      setDayData({
        cash: cashTotal,
        transfer: transferTotal,
        cashReceived: cashReceivedTotal,
        changeGiven: changeGivenTotal,
        total: totalSales,
        transactionCount: sales.length,
        opening: amount
      });

      sessionStorage.setItem('cashOpen', 'false');
      sessionStorage.removeItem('openingAmount');
      sessionStorage.removeItem('cashOpenedAt');
      setCashOpen(false);
      setOpeningAmount('');
      
      if (historyPage === 1) {
        await loadHistory(1);
      } else {
        setHistoryPage(1);
      }
      
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

  const getEarned = () => {
    if (!dayData) return 0;
    return dayData.total;
  };

  const getDayName = (dateInput: string | Date) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    let dateObj: Date;
    
    if (typeof dateInput === 'string') {
      // Esperamos formato YYYY-MM-DD
      const [year, month, day] = dateInput.split('-').map(Number);
      dateObj = new Date(year, month - 1, day);
    } else {
      dateObj = new Date(dateInput);
    }
    
    return days[dateObj.getDay()];
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
              <div className="text-5xl font-black text-green-700">${formatPrice(parseFloat(openingAmount || '0'))}</div>
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
      {!cashOpen && dayData && dayData.opening !== undefined && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Resumen del Cierre de Hoy ({getTodayName()})</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Abrí Con</CardTitle>
                <DollarSign className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${formatPrice(dayData.opening)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Efectivo Vendido</CardTitle>
                <Banknote className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${formatPrice(dayData.cash)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Transferencias</CardTitle>
                <CreditCard className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">${formatPrice(dayData.transfer)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Cambio Dado</CardTitle>
                <Banknote className="w-4 h-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">${formatPrice(dayData.changeGiven)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Ganado</CardTitle>
                <Check className="w-4 h-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">${formatPrice(getEarned())}</div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-yellow-900">Dinero en Caja (Efectivo)</p>
                <p className="hidden">
                  Abrí con: ${formatPrice(dayData.opening)} + Ventas en efectivo: ${formatPrice(dayData.cash)}
                </p>
                <p className="text-sm text-yellow-800 mt-1">
                  Efectivo recibido: ${formatPrice(dayData.cashReceived)} - Cambio dado: ${formatPrice(dayData.changeGiven)}
                </p>
                <p className="text-lg font-black text-yellow-900 mt-2">
                  Total: ${formatPrice(dayData.opening + dayData.cashReceived - dayData.changeGiven)}
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
                <span className="text-slate-600">Transacciones de esta caja:</span>
                <span className="font-bold">{dayData.transactionCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Ventas en Efectivo:</span>
                <span className="font-bold text-green-600">${formatPrice(dayData.cash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Efectivo Recibido:</span>
                <span className="font-bold text-green-600">${formatPrice(dayData.cashReceived)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Cambio Dado:</span>
                <span className="font-bold text-red-600">-${formatPrice(dayData.changeGiven)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Ventas por Transferencia:</span>
                <span className="font-bold text-blue-600">${formatPrice(dayData.transfer)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t-2">
                <span className="text-slate-800 font-bold">Total Vendido:</span>
                <span className="font-black text-purple-600">${formatPrice(dayData.total)}</span>
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
            <div>
              <h2 className="text-lg font-bold text-slate-800">Historial de Cajas</h2>
              <p className="text-sm text-slate-500">{historyTotal} cierres registrados</p>
            </div>
            {showHistory ? (
              <ChevronUp className="text-slate-600" size={24} />
            ) : (
              <ChevronDown className="text-slate-600" size={24} />
            )}
          </button>

          {showHistory && (
            <div className="border-t-2 border-slate-200">
              <div className="divide-y-2 divide-slate-200">
                {history.map((summary) => {
                const dayName = getDayName(summary.date);
                const earned = summary.cash + summary.transfer;

                return (
                  <div key={summary.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-slate-800">{dayName}</p>
                        <p className="text-sm text-slate-600">
                          {new Date(summary.openedAt).toLocaleString('es-AR')} - {new Date(summary.closedAt).toLocaleTimeString('es-AR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-purple-600">${formatPrice(earned)}</p>
                        <p className="text-xs text-slate-500">Total vendido</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="bg-blue-50 p-2 rounded">
                        <p className="text-slate-600">Abrí Con</p>
                        <p className="font-bold text-blue-600">${formatPrice(summary.opening)}</p>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <p className="text-slate-600">Efectivo</p>
                        <p className="font-bold text-green-600">${formatPrice(summary.cash)}</p>
                      </div>
                      <div className="bg-blue-50 p-2 rounded">
                        <p className="text-slate-600">Transferencia</p>
                        <p className="font-bold text-blue-600">${formatPrice(summary.transfer)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {summary.transactionCount} transacciones
                    </p>
                  </div>
                );
                })}
              </div>

              {historyTotalPages > 1 && (
                <div className="flex items-center justify-between gap-3 p-4 bg-slate-50">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
                    disabled={historyPage <= 1}
                    className="h-10"
                  >
                    <ChevronLeft size={18} />
                    Anterior
                  </Button>
                  <span className="text-sm font-semibold text-slate-600">
                    Pagina {historyPage} de {historyTotalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setHistoryPage((page) => Math.min(historyTotalPages, page + 1))}
                    disabled={historyPage >= historyTotalPages}
                    className="h-10"
                  >
                    Siguiente
                    <ChevronRight size={18} />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
