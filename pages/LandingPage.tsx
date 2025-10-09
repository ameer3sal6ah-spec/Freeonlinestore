


import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Product } from '../types';
import { useCart } from '../hooks/useCart';
import { StarIcon } from '../components/icons/Icons';

const LandingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  const productId = Number(id);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (isNaN(productId)) {
        setLoading(false);
        return;
    }
    const fetchProduct = async () => {
      setLoading(true);
      const fetchedProduct = await api.getProductById(productId);
      setProduct(fetchedProduct || null);
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  const handleBuyNow = () => {
    if (product) {
      // FIX: The addToCart function expects an object with a product property.
      addToCart({ product });
      navigate('/checkout');
    }
  };
  
  if (loading) return <div className="text-center min-h-screen flex items-center justify-center">جار التحميل...</div>;
  if (!product) return <div className="text-center min-h-screen flex items-center justify-center text-red-500">لم يتم العثور على المنتج.</div>;

  return (
    <div className="bg-white">
      <div className="container mx-auto max-w-4xl py-8 px-4">
        {/* Header */}
        <header className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-teal-700">عرض خاص لفترة محدودة!</h1>
          <p className="text-md text-gray-600">لا تفوّت فرصة الحصول على {product.name}</p>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Product Image */}
            <div className="rounded-lg overflow-hidden shadow-2xl">
              <img src={product.imageUrl} alt={product.name} className="w-full h-auto object-cover" />
            </div>

            {/* Product Details & CTA */}
            <div className="text-center md:text-right">
                <h2 className="text-3xl md:text-4xl font-extrabold mb-3">{product.name}</h2>
                <div className="flex items-center justify-center md:justify-start mb-4">
                    <div className="flex items-center text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} className={`w-5 h-5 ${i < Math.round(product.rating) ? 'fill-current' : ''}`} />
                    ))}
                    </div>
                    <span className="text-gray-600 me-2 text-sm">({product.reviews} تقييم إيجابي)</span>
                </div>
                <p className="text-gray-700 text-lg leading-relaxed mb-5">{product.description}</p>
                <div className="flex items-baseline justify-center md:justify-start space-x-3 space-x-reverse mb-6 bg-yellow-100 p-3 rounded-md">
                    <span className="text-4xl font-bold text-red-600">{product.price} ج.م</span>
                    {product.originalPrice && (
                    <span className="text-2xl text-gray-500 line-through">{product.originalPrice} ج.م</span>
                    )}
                </div>

                <div className="animate-pulse">
                    <button
                    onClick={handleBuyNow}
                    className="w-full bg-red-600 text-white font-bold py-4 px-8 rounded-lg shadow-lg hover:bg-red-700 transition-transform transform hover:scale-105 text-xl"
                    >
                    اطلب الآن وادفع عند الاستلام
                    </button>
                </div>
                <p className="text-green-600 font-semibold mt-3">شحن مجاني وسريع لجميع المدن!</p>
            </div>
        </div>
        
        {/* Footer */}
        <footer className="text-center text-gray-500 mt-12 border-t pt-4">
            <p>&copy; {new Date().getFullYear()} Profit store. جميع الحقوق محفوظة.</p>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;