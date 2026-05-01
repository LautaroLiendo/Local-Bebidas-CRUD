'use client';
import { useState, useEffect, useRef } from 'react';
import { ProductService } from '@/services/product.service'; 
import { SaleService } from '@/services/sale.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Wallet, ArrowRightLeft, Plus, Minus, Search, Trash2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function POSPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('EFECTIVO');
  const [search, setSearch] = useState('');
  const [changeAmount, setChangeAmount] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [cashOpen, setCashOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const itemsPerPage = 12;

  const loadProducts = () => ProductService.findAll().then(setProducts);

  useEffect(() => {
    loadProducts();
    checkCashStatus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') { e.preventDefault(); searchInputRef.current?.focus(); }
      if (e.key === 'F2' && cashOpen) { e.preventDefault(); handleCheckout(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkCashStatus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [cart, paymentMethod, cashOpen]);

  const checkCashStatus = () => {
    const saved = sessionStorage.getItem('cashOpen');
    setCashOpen(saved === 'true');
  };

  const formatPrice = (price: number) => {
    // Separador de miles pero sin decimales si no los hay
    const rounded = Math.round((Number(price) || 0) * 100) / 100;
    if (rounded % 1 === 0) {
      return rounded.toLocaleString('es-AR');
    }
    return rounded.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const addToCart = (p: any) => {
    if (p.stock <= 0) return toast.error("Producto sin stock");
    const existing = cart.find(i => i.id === p.id);
    if (existing && existing.qty >= p.stock) return toast.error("Stock insuficiente");
    setCart(existing ? cart.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...cart, { ...p, qty: 1 }]);
  };

  const total = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);

  const handleCheckout = async () => {
    if (!cashOpen) {
      toast.error('Debes abrir la caja antes de vender');
      return;
    }
    if (cart.length === 0) return;
    const paidAmount = paymentMethod === 'EFECTIVO' ? Number(receivedAmount || total) : 0;
    const changeGiven = paymentMethod === 'EFECTIVO' ? Math.max(0, paidAmount - total) : 0;

    if (paymentMethod === 'EFECTIVO' && paidAmount < total) {
      toast.error('El efectivo recibido no alcanza para pagar la venta');
      return;
    }

    try {
      // Asegurar que enviamos el precio unitario para cada item
      await SaleService.create({ 
        paymentMethod,
        cashReceived: paymentMethod === 'EFECTIVO' ? paidAmount : 0,
        changeGiven,
        items: cart.map(i => ({ 
          productId: i.id, 
          quantity: i.qty, 
          unitPrice: i.price  // Guardar el precio actual del producto
        })) 
      });
      toast.success("Venta procesada con éxito");
      setCart([]);
      setChangeAmount(0);
      setReceivedAmount('');
      loadProducts();
    } catch { toast.error("Error al registrar la venta"); }
  };

  // Filtros y paginación
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.name.toLowerCase().includes(search.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-100 overflow-hidden">
      {/* Banner de alerta si caja no está abierta */}
      {!cashOpen && (
        <div className="bg-red-500 text-white px-4 py-3 font-black text-center text-lg flex items-center justify-center gap-2 animate-pulse">
          <AlertCircle size={24} /> ⚠️ CAJA CERRADA - No puedes vender. Abre la caja primero.
        </div>
      )}
      
      {/* Contenedor principal con max-h */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-2 lg:gap-4 p-2 lg:p-4">
        
        {/* Lado Izquierdo: Productos */}
        <div className="flex-1 lg:flex-[2] flex flex-col min-h-0">
          {/* Buscador */}
          <div className="relative flex-shrink-0 mb-2 lg:mb-3">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <Input 
              ref={searchInputRef} 
              placeholder="Buscar (F1)..." 
              className="pl-10 h-10 lg:h-11 text-sm lg:text-base font-semibold shadow-md border-2 border-slate-200 rounded-lg focus:border-blue-500" 
              onChange={(e) => {setSearch(e.target.value); setCurrentPage(1);}} 
              value={search}
            />
          </div>

          {/* Grid de Productos - SOLO ESTO SCROLLEA */}
          <div className="flex-1 overflow-y-auto bg-white rounded-lg border-2 border-slate-100 p-2 lg:p-3 min-h-0">
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-1.5 lg:gap-2">
              {paginatedProducts.map(p => (
                <button 
                  key={p.id} 
                  onClick={() => addToCart(p)} 
                  className={`flex flex-col p-2 lg:p-2.5 rounded-lg border-2 shadow-sm transition-all text-left text-xs
                    ${p.stock > 5 
                      ? 'bg-white border-slate-200 hover:border-blue-500 hover:shadow-md cursor-pointer' 
                      : p.stock > 0 
                      ? 'bg-yellow-50 border-yellow-300 hover:border-yellow-500 hover:shadow-md cursor-pointer' 
                      : 'bg-red-50 border-red-300 opacity-50 cursor-not-allowed'
                    }
                  `}
                  disabled={p.stock <= 0}
                >
                  <span className="font-bold text-slate-800 line-clamp-1 text-xs lg:text-sm">{p.name}</span>
                  <span className="text-base lg:text-xl font-black text-blue-600 mt-1">${formatPrice(p.price)}</span>
                  <div className={`mt-1 px-1.5 py-0.5 rounded text-xs font-bold w-fit flex items-center gap-0.5 ${
                    p.stock > 5 ? 'bg-green-100 text-green-700' : p.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {p.stock <= 0 && <AlertCircle size={10} />}
                    {p.stock}
                  </div>
                </button>
              ))}
            </div>

            {paginatedProducts.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <Search size={36} className="opacity-50" />
                <p className="font-semibold text-sm">No hay productos</p>
              </div>
            )}
          </div>

          {/* Paginación - Siempre visible */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-lg border-2 border-slate-100 p-2 mt-2 lg:mt-3 flex-shrink-0">
              <span className="text-xs font-semibold text-slate-600">
                Pág {currentPage}/{totalPages}
              </span>
              <div className="flex gap-0.5">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                </Button>
                
                <div className="flex gap-0.5">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page = i + 1;
                    if (totalPages > 5 && currentPage > 3) {
                      page = currentPage - 2 + i;
                    }
                    if (page > totalPages) return null;
                    
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0 text-xs"
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>

                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Lado Derecho: Carrito - Compacto y sin scrolls del body */}
        <div className="w-full lg:flex-1 bg-white rounded-lg shadow-lg border-2 border-slate-100 flex flex-col min-h-0 max-h-[45vh] lg:max-h-none">
        
        {/* Header del Carrito */}
        <div className="p-3 lg:p-4 border-b-2 border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg flex-shrink-0">
          <h2 className="text-base lg:text-lg font-black flex items-center gap-2 text-slate-800">
            <ShoppingCart className="text-blue-600" size={20} /> 
            Carrito
          </h2>
          <span className="bg-blue-600 text-white px-2.5 lg:px-3 py-1 rounded-full text-xs lg:text-sm font-bold">{cart.length}</span>
        </div>

        {/* Items del Carrito - SCROLLEA SI ES NECESARIO */}
        <div className="flex-1 overflow-y-auto p-2 lg:p-3 space-y-2 min-h-0">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
              <ShoppingCart size={32} className="opacity-50" />
              <p className="text-xs lg:text-sm font-semibold">Carrito vacío</p>
            </div>
          ) : (
            cart.map(item => {
              const subtotal = item.price * item.qty;
              return (
                <div key={item.id} className="flex flex-col p-2 lg:p-2.5 bg-slate-50 rounded-lg border-2 border-slate-200 hover:border-blue-300 transition-colors gap-1.5">
                  <div className="flex justify-between items-start gap-1">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs lg:text-sm text-slate-800 line-clamp-1">{item.name}</p>
                      <p className="text-xs text-slate-500">${formatPrice(item.price)} x {item.qty}</p>
                    </div>
                    <p className="font-black text-sm lg:text-base text-blue-600 flex-shrink-0">${formatPrice(subtotal)}</p>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-0.5 bg-white rounded border border-slate-200 p-0.5">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 w-7 p-0 rounded"
                        onClick={() => setCart(cart.map(i=>i.id===item.id?{...i, qty:Math.max(1, i.qty-1)}:i))}
                      >
                        <Minus size={14} className="text-red-600"/>
                      </Button>
                      <span className="font-black font-mono w-5 text-center text-xs">{item.qty}</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 w-7 p-0 rounded"
                        onClick={() => addToCart(item)}
                      >
                        <Plus size={14} className="text-green-600"/>
                      </Button>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 w-7 p-0 rounded"
                      onClick={() => setCart(cart.filter(i=>i.id!==item.id))}
                    >
                      <Trash2 size={14} className="text-red-600"/>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Total y Botones - SIEMPRE VISIBLE */}
        <div className="p-2.5 lg:p-3 bg-gradient-to-t from-slate-900 to-slate-800 rounded-b-lg border-t-2 border-slate-100 space-y-2 flex-shrink-0">
          
          {/* Total */}
          <div className="p-2 lg:p-2.5 bg-slate-700 rounded">
            <p className="text-slate-300 font-semibold text-xs mb-0.5">Total</p>
            <p className="text-2xl lg:text-4xl font-black text-white">${formatPrice(total)}</p>
          </div>

          {/* Cambio */}
          {paymentMethod === 'EFECTIVO' && total > 0 && (
            <div className="p-2 lg:p-2.5 bg-yellow-500/20 border-2 border-yellow-400 rounded">
              <p className="text-yellow-100 font-semibold text-xs mb-1">Cambio</p>
              <p className="text-lg lg:text-2xl font-black text-yellow-300">${formatPrice(changeAmount)}</p>
              <Input 
                type="number" 
                placeholder="Recibido" 
                value={receivedAmount}
                className="mt-1.5 h-7 lg:h-8 text-xs lg:text-sm font-semibold bg-white border-2 border-yellow-300 rounded"
                onChange={(e) => {
                  setReceivedAmount(e.target.value);
                  setChangeAmount(Math.max(0, Number(e.target.value) - total));
                }}
              />
            </div>
          )}

          {/* Métodos de Pago */}
          <div className="grid grid-cols-2 gap-1">
            <Button 
              className={`h-8 lg:h-9 font-bold text-xs lg:text-sm rounded transition-all ${
                paymentMethod === 'EFECTIVO' 
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-400/50' 
                  : 'bg-slate-600 hover:bg-slate-700 text-slate-200'
              }`}
              onClick={() => {setPaymentMethod('EFECTIVO'); setChangeAmount(0); setReceivedAmount('');}}
            >
              <Wallet size={14} className="mr-0.5"/> Efe.
            </Button>
            <Button 
              className={`h-8 lg:h-9 font-bold text-xs lg:text-sm rounded transition-all ${
                paymentMethod === 'TRANSFERENCIA' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-400/50' 
                  : 'bg-slate-600 hover:bg-slate-700 text-slate-200'
              }`}
              onClick={() => {setPaymentMethod('TRANSFERENCIA'); setChangeAmount(0); setReceivedAmount('');}}
            >
              <ArrowRightLeft size={14} className="mr-0.5"/> Trans.
            </Button>
          </div>

          {/* Botón Finalizar */}
          <Button 
            className="w-full h-10 lg:h-11 text-sm lg:text-base font-black bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-400/50 rounded disabled:opacity-50 disabled:cursor-not-allowed" 
            onClick={handleCheckout}
            disabled={cart.length === 0 || !cashOpen}
          >
            VENDER (F2)
          </Button>
        </div>
      </div>
    </div>
    </div>
  );
}
