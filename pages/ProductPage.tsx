import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Product } from '../types';
import { useCart } from '../hooks/useCart';
import { StarIcon } from '../components/icons/Icons';

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [addedToCart, setAddedToCart] = useState(false);
  const { addToCart } = useCart();
  
  const productId = Number(id);

  useEffect(() => {
    if (isNaN(productId)) {
        setLoading(false);
        return;
    }
    const fetchProduct = async () => {
      setLoading(true);
      const fetchedProduct = await api.getProductById(productId);
      setProduct(fetchedProduct || null);
      if (fetchedProduct) {
        setSelectedImage(fetchedProduct.imageUrl);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);
  
  if (loading) return <div className="text-center py-20">جار التحميل...</div>;
  if (!product) return <div className="text-center py-20 text-red-500">لم يتم العثور على المنتج.</div>;

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2500);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Image Gallery */}
        <div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
            <img src={selectedImage} alt={product.name} className="w-full h-96 object-cover" />
          </div>
          <div className="flex space-x-2 space-x-reverse">
            {product.images.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`${product.name} thumbnail ${index + 1}`}
                className={`w-20 h-20 object-cover rounded-md cursor-pointer border-2 ${selectedImage === img ? 'border-teal-500' : 'border-transparent'}`}
                onClick={() => setSelectedImage(img)}
              />
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div>
          <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
          <div className="flex items-center mb-6">
            <div className="flex items-center text-yellow-500">
               {[...Array(5)].map((_, i) => (
                   <StarIcon key={i} className={`w-6 h-6 ${i < Math.round(product.rating) ? 'fill-current' : ''}`} />
               ))}
            </div>
            <span className="text-gray-600 me-2">({product.reviews} مراجعة)</span>
          </div>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">{product.description}</p>
          <div className="flex items-baseline space-x-3 space-x-reverse mb-6">
            <span className="text-4xl font-bold text-teal-600">{product.price} ج.م</span>
            {product.originalPrice && (
              <span className="text-2xl text-gray-400 line-through">{product.originalPrice} ج.م</span>
            )}
          </div>
          <div className="flex flex-col">
            <button
              onClick={handleAddToCart}
              className="w-full bg-teal-600 text-white font-bold py-4 px-8 rounded-lg hover:bg-teal-700 transition-colors text-lg"
            >
              أضف إلى السلة
            </button>
            {addedToCart && (
                <div className="mt-4 w-full text-center text-green-700 font-semibold bg-green-100 p-3 rounded-lg transition-opacity duration-300">
                    تمت إضافة المنتج إلى السلة بنجاح!
                </div>
            )}
          </div>
           <div className="mt-6 border-t pt-4">
                <span className={`font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.stock > 0 ? `متوفر (${product.stock} قطعة)` : 'نفدت الكمية'}
                </span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;