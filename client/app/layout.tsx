import { Navbar } from '@/components/ui/navbar';
import { Toaster } from "@/components/ui/sonner";
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 min-h-screen text-gray-900">
        <Navbar />
        <main className="container mx-auto px-6 py-8">
          {children}
        </main>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}