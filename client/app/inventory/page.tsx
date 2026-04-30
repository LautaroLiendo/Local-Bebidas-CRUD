'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, ChevronLeft, ChevronRight, AlertTriangle, AlertCircle, Edit2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  
  const itemsPerPage = 30;

  const load = async () => {
    try {
      setIsLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        api.get(`/products?t=${Date.now()}`),
        api.get('/categories')
      ]);
      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
      setCurrentPage(1);
    } catch (e) { 
      toast.error("Error al cargar datos");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const binaryData = evt.target?.result;
          const workbook = XLSX.read(binaryData, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(sheet);
          
          if (data.length === 0) {
            toast.error("El archivo Excel está vacío");
            setIsLoading(false);
            return;
          }

          const response = await api.post('/products/bulk', data);
          toast.success(`¡${response.data.length} productos importados correctamente!`);
          setTimeout(() => load(), 500);
        } catch (error: any) {
          console.error('Error en Excel:', error);
          toast.error("Error en el Excel. Asegúrate de tener: name, price, stock, categoryName");
        }
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Error al leer archivo:', error);
      toast.error("Error al leer el archivo");
      setIsLoading(false);
    }
  };

  const handleSaveProduct = async (product: any) => {
    try {
      if (product.id) {
        // Editar
        await api.put(`/products/${product.id}`, {
          name: product.name,
          price: Number(product.price),
          stock: Number(product.stock),
          categoryId: product.categoryId
        });
        toast.success('Producto actualizado');
      } else {
        // Crear
        await api.post('/products', {
          name: product.name,
          price: Number(product.price),
          stock: Number(product.stock),
          categoryId: product.categoryId,
          cost: 0
        });
        toast.success('Producto creado');
      }
      setOpenDialog(false);
      setEditingProduct(null);
      load();
    } catch (error) {
      toast.error('Error al guardar producto');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Producto eliminado');
      load();
    } catch (error) {
      toast.error('Error al eliminar producto');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) {
      toast.error('Nombre de categoría requerido');
      return;
    }
    try {
      await api.post('/categories', { name: newCategory });
      toast.success('Categoría creada');
      setNewCategory('');
      setShowNewCategory(false);
      load();
    } catch (error) {
      toast.error('Error al crear categoría');
    }
  };

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    const pageNum = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNum);
  };

  const lowStockProducts = products.filter(p => p.stock <= 2);
  const noStockProducts = products.filter(p => p.stock === 0);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black">Inventario ({products.length})</h1>
        <div className="flex gap-2">
          <input type="file" id="excel" className="hidden" onChange={handleFileUpload} accept=".csv, .xlsx" disabled={isLoading} />
          <Button onClick={() => document.getElementById('excel')?.click()} disabled={isLoading}>
            <Upload className="mr-2"/> {isLoading ? 'Cargando...' : 'Importar Excel'}
          </Button>
          
          <Dialog open={openDialog && !editingProduct?.id} onOpenChange={(open) => {
            setOpenDialog(open);
            if (open) setEditingProduct({ categoryId: categories[0]?.id || null });
          }}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-2"/> Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo Producto</DialogTitle>
              </DialogHeader>
              {editingProduct && (
                <EditProductForm 
                  product={editingProduct} 
                  categories={categories}
                  onSave={handleSaveProduct}
                  onShowNewCategory={() => setShowNewCategory(true)}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Dialog para crear categoría */}
      <Dialog open={showNewCategory} onOpenChange={setShowNewCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Categoría</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nombre de categoría"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={handleCreateCategory} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Crear
              </Button>
              <Button onClick={() => setShowNewCategory(false)} variant="outline" className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alertas de Stock */}
      {(noStockProducts.length > 0 || lowStockProducts.length > 0) && (
        <div className="space-y-3">
          {noStockProducts.length > 0 && (
            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-bold text-red-900">⚠️ Productos Sin Stock</h3>
                  <p className="text-sm text-red-800 mt-1">
                    {noStockProducts.map(p => p.name).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {lowStockProducts.length > 0 && (
            <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-bold text-yellow-900">⚠️ Stock Bajo (≤ 2 unidades)</h3>
                  <p className="text-sm text-yellow-800 mt-1">
                    {lowStockProducts.map(p => `${p.name} (${p.stock})`).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  No hay productos para mostrar
                </TableCell>
              </TableRow>
            ) : (
              currentProducts.map(p => (
                <TableRow 
                  key={p.id}
                  className={`
                    ${p.stock === 0 ? 'bg-red-50 hover:bg-red-100' : p.stock <= 2 ? 'bg-yellow-50 hover:bg-yellow-100' : ''}
                  `}
                >
                  <TableCell className="font-bold">{p.name}</TableCell>
                  <TableCell className="text-slate-600">{p.category?.name || 'Sin categoría'}</TableCell>
                  <TableCell>${p.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={`font-bold px-3 py-1 rounded-lg ${
                      p.stock === 0 
                        ? 'bg-red-100 text-red-700' 
                        : p.stock <= 2 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {p.stock}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex gap-2 justify-center">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setEditingProduct(p)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Producto</DialogTitle>
                          </DialogHeader>
                          <EditProductForm 
                            product={p} 
                            categories={categories}
                            onSave={handleSaveProduct}
                            onShowNewCategory={() => setShowNewCategory(true)}
                          />
                        </DialogContent>
                      </Dialog>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteProduct(p.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border rounded-xl p-4">
          <div className="text-sm text-slate-600">
            Mostrando {startIndex + 1} a {Math.min(endIndex, products.length)} de {products.length} productos
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function EditProductForm({ product, categories, onSave, onShowNewCategory }: any) {
  const [formData, setFormData] = useState(product || {});

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-semibold block mb-1">Nombre</label>
        <Input 
          value={formData.name || ''}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="Nombre del producto"
        />
      </div>
      <div>
        <label className="text-sm font-semibold block mb-1">Precio ($)</label>
        <Input 
          type="number"
          step="0.01"
          value={formData.price || ''}
          onChange={(e) => setFormData({...formData, price: e.target.value})}
          placeholder="0.00"
        />
      </div>
      <div>
        <label className="text-sm font-semibold block mb-1">Stock</label>
        <Input 
          type="number"
          value={formData.stock || ''}
          onChange={(e) => setFormData({...formData, stock: e.target.value})}
          placeholder="0"
        />
      </div>
      <div>
        <label className="text-sm font-semibold block mb-1">Categoría</label>
        <div className="flex gap-2">
          <select 
            value={formData.categoryId || ''}
            onChange={(e) => setFormData({...formData, categoryId: Number(e.target.value) || null})}
            className="flex-1 h-10 px-3 border rounded-lg"
          >
            <option value="">Sin categoría</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <Button onClick={onShowNewCategory} variant="outline">+</Button>
        </div>
      </div>
      <Button onClick={() => onSave(formData)} className="w-full bg-blue-600 hover:bg-blue-700">
        Guardar
      </Button>
    </div>
  );
}
