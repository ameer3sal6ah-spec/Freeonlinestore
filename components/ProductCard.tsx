
import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { useCart } from '../hooks/useCart';
import { ShoppingCartIcon } from './icons/Icons';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ product });
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <Link to={`/product/${product.id}`} className="block">
        <div className="overflow-hidden">
            <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300" 
            />
        </div>
        <div className="p-4 border-t">
          <h3 className="text-lg font-semibold text-gray-800 truncate mb-1">{product.name}</h3>
          <p className="text-sm text-gray-500">{product.category}</p>
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-baseline space-x-2 space-x-reverse">
                <span className="text-xl font-bold text-teal-600">{product.price} ج.م</span>
                {product.originalPrice && (
                    <span className="text-sm text-gray-400 line-through">{product.originalPrice} ج.م</span>
                )}
            </div>
            <button 
              onClick={handleAddToCart}
              className="p-2 rounded-full bg-gray-100 text-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-teal-500 hover:text-white"
              aria-label="Add to cart"
              title="أضف إلى السلة"
            >
              <ShoppingCartIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;