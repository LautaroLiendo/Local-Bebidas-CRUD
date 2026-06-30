'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Package, List, BarChart3 } from 'lucide-react';
import Image from 'next/image';

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="w-full bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 relative">
              <Image
                src="/logo.svg"
                alt="Licostore Logo"
                width={48}
                height={48}
                className="w-full h-full"
              />
            </div>
            <div className="font-black text-2xl text-blue-600">Licostore</div>
          </Link>
          <div className="flex gap-1">
            <Link href="/pos" className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${pathname === '/pos' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}>
              <ShoppingCart size={20} /> VENDER
            </Link>
            <Link href="/inventory" className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${pathname === '/inventory' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}>
              <Package size={20} /> Inventario
            </Link>
            <Link href="/sales" className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${pathname === '/sales' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}>
              <List size={20} /> Historial
            </Link>
            <Link href="/" className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${pathname === '/' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}>
              <BarChart3 size={20} /> Caja
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}