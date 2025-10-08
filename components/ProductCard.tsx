import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { StarIcon } from './icons/Icons';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 group flex flex-col h-full">
      <Link to={`/product/${product.id}`} className="block flex flex-col h-full">
        <div className="relative">
          <img src={product.imageUrl} alt={product.name} className="w-full h-56 object-cover" />
          {product.originalPrice && (
            <span className="absolute top-3 right-3 bg-red-500 text-white text-sm font-bold px-2 py-1 rounded-md">
                خصم {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
            </span>
          )}
        </div>
        <div className="p-4 flex-grow">
          <h3 className="text-lg font-semibold text-gray-800 truncate">{product.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{product.category}</p>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-1 space-x-reverse">
              <span className="text-xl font-bold text-teal-600">{product.price} ج.م</span>
              {product.originalPrice && (
                <span className="text-sm text-gray-400 line-through">{product.originalPrice} ج.م</span>
              )}
            </div>
            <div className="flex items-center text-sm text-gray-600">
                <StarIcon className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="ms-1">{product.rating}</span>
            </div>
          </div>
        </div>
        <div className="p-4 pt-0">
          <div className="w-full text-center bg-teal-600 text-white py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors opacity-0 group-hover:opacity-100 duration-300">
            عرض التفاصيل
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;