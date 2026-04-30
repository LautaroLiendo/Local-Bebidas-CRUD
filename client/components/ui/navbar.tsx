'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Package, List, BarChart3 } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="w-full bg-slate-900 shadow-md">
      <div className="container mx-auto flex gap-2 p-2">
        <Link href="/pos" className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-xl font-black text-xl transition-all duration-200 ${pathname === '/pos' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
          <ShoppingCart size={24} /> VENDER
        </Link>
        <Link href="/inventory" className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-xl font-bold text-lg transition-all duration-200 ${pathname === '/inventory' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
          <Package size={20} /> Inventario
        </Link>
        <Link href="/sales" className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-xl font-bold text-lg transition-all duration-200 ${pathname === '/sales' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
          <List size={20} /> Historial
        </Link>
        <Link href="/" className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-xl font-bold text-lg transition-all duration-200 ${pathname === '/' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
          <BarChart3 size={20} /> Caja
        </Link>
      </div>
    </nav>
  );
}