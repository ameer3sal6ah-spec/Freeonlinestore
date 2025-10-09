
import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { SearchIcon } from '../components/icons/Icons';

const PublishedDesignsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const allProducts = await api.getProducts();
      // Filter for user-published designs
      const publishedDesigns = allProducts.filter(p => p.category === 'تصاميم المستخدمين');
      setProducts(publishedDesigns);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return products;
    }
    return products.filter(product =>
      product.name.toLowerCase().includes(query) ||
      (product.description && product.description.toLowerCase().includes(query))
    );
  }, [products, searchQuery]);

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-center mb-6">👕 تصاميم إبداعية من مجتمعنا</h1>
      <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
        هنا تجد تصاميم فريدة تم إنشاؤها ونشرها بواسطة مستخدمين آخرين. اختر ما يعجبك وأضفه إلى سلتك!
      </p>

      {/* Search Bar */}
      <div className="mb-10 max-w-2xl mx-auto">
        <div className="relative">
            <input
                type="text"
                placeholder="ابحث في تصاميم المبدعين..."
                className="w-full p-4 ps-12 text-lg border border-gray-300 rounded-full shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search for published designs"
            />
            <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                <SearchIcon className="w-6 h-6 text-gray-400" />
            </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-lg">جار تحميل الإبداعات...</div>
      ) : (
        <>
            {filteredProducts.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {filteredProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white rounded-lg shadow-md">
                    <p className="text-xl text-gray-600 mb-4">
                        {searchQuery ? 'لم يتم العثور على تصاميم تطابق بحثك.' : 'لا توجد تصاميم منشورة بعد. كن أول من ينشر!'}
                    </p>
                    <p className="text-gray-500">
                        {searchQuery ? 'حاول استخدام كلمات بحث مختلفة.' : 'اذهب إلى استوديو التصميم وشارك إبداعك.'}
                    </p>
                </div>
            )}
        </>
      )}
    </div>
  );
};

export default PublishedDesignsPage;