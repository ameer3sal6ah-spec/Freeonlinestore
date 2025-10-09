
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const products = await api.getProducts();
      setFeaturedProducts(products.slice(0, 4));
      setLoading(false);
    };
    fetchProducts();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gray-200" style={{backgroundImage: "url('https://picsum.photos/seed/fashion/1600/600')", backgroundSize: 'cover', backgroundPosition: 'center'}}>
        <div className="bg-black bg-opacity-50">
            <div className="container mx-auto px-6 py-24 text-center text-white">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">أطلق إبداعك، صمم تيشرتك بنفسك!</h1>
                <p className="text-lg md:text-xl mb-8">اختر اللون، المقاس، وأضف تصميمك الخاص أو اختر من مكتبتنا المميزة.</p>
                <Link to="/design-studio" className="bg-teal-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-teal-700 transition-colors text-lg animate-pulse">
                👕 ابدأ التصميم الآن
                </Link>
            </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-10">منتجات رقمية مميزة</h2>
          {loading ? (
            <div className="text-center">جار التحميل...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
           <div className="text-center mt-12">
                <Link to="/digital-products" className="text-teal-600 font-semibold hover:underline">
                    عرض كل المنتجات الرقمية &rarr;
                </Link>
            </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;