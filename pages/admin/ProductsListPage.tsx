import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Product } from '../../types';
import ProductFormModal from '../../components/admin/ProductFormModal';

const ProductsListPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [pageError, setPageError] = useState<string | null>(null);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setPageError(null);
        try {
            const allProducts = await api.getProducts();
            setProducts(allProducts);
        } catch (error) {
            console.error("Failed to fetch products", error);
            setPageError("فشل تحميل المنتجات. الرجاء تحديث الصفحة.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleAddNew = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };
    
    const handleDelete = async (productToDelete: Product) => {
        if (deletingId) return;
        if (window.confirm(`هل أنت متأكد من رغبتك في حذف "${productToDelete.name}"؟`)) {
            setDeletingId(productToDelete.id);
            setPageError(null);
            try {
                await api.deleteProduct(productToDelete);
                setProducts(prevProducts => prevProducts.filter(p => p.id !== productToDelete.id));
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
                console.error("DETAILED DELETE ERROR:", err);
                setPageError(`فشل حذف المنتج "${productToDelete.name}": ${errorMessage}`);
            } finally {
                setDeletingId(null);
            }
        }
    };

    const handleSave = async (
        productData: Partial<Omit<Product, 'id' | 'createdAt'>>,
        imageFile: File | null
    ) => {
        setIsSaving(true);
        setPageError(null);
        try {
            const savedProduct = await api.saveProduct(productData, imageFile, editingProduct);
            
            if (editingProduct) {
                setProducts(products.map(p => p.id === savedProduct.id ? savedProduct : p));
            } else {
                setProducts([savedProduct, ...products]);
            }
            setIsModalOpen(false);
        } catch (error: any) {
            setPageError(`فشل حفظ المنتج: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">المنتجات</h1>
                <button 
                    onClick={handleAddNew}
                    className="bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors"
                >
                    إضافة منتج جديد
                </button>
            </div>
            
            {pageError && (
                 <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">حدث خطأ! </strong>
                    <span className="block sm:inline">{pageError}</span>
                    <button onClick={() => setPageError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Close">
                        <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>إغلاق</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                    </button>
                </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow">
                 {loading ? <p>جار التحميل...</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-3 font-semibold text-sm text-gray-800 border-b border-gray-200">المنتج</th>
                                    <th className="p-3 font-semibold text-sm text-gray-800 border-b border-gray-200">السعر</th>
                                    <th className="p-3 font-semibold text-sm text-gray-800 border-b border-gray-200">المخزون</th>
                                    <th className="p-3 font-semibold text-sm text-gray-800 border-b border-gray-200">الفئة</th>
                                    <th className="p-3 font-semibold text-sm text-gray-800 border-b border-gray-200">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(product => (
                                    <tr key={product.id} className="border-b">
                                        <td className="p-3 flex items-center">
                                            <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded-md me-4" />
                                            <span>{product.name}</span>
                                        </td>
                                        <td className="p-3">{product.price.toFixed(2)} ج.م</td>
                                        <td className="p-3">
                                            <span className={product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-600'}>
                                                {product.stock}
                                            </span>
                                        </td>
                                        <td className="p-3">{product.category}</td>
                                        <td className="p-3 space-x-4 space-x-reverse">
                                            <button onClick={() => handleEdit(product)} className="text-blue-600 hover:underline" disabled={deletingId === product.id}>تعديل</button>
                                            <button onClick={() => handleDelete(product)} className="text-red-600 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed" disabled={deletingId === product.id}>
                                                {deletingId === product.id ? 'جاري الحذف...' : 'حذف'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <ProductFormModal 
                    product={editingProduct} 
                    onSave={handleSave} 
                    onClose={() => setIsModalOpen(false)} 
                    isSaving={isSaving}
                />
            )}
        </div>
    );
};

export default ProductsListPage;