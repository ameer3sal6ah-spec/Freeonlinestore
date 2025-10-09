
import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { ShoppingCartIcon } from '../icons/Icons';

const Header: React.FC = () => {
  const { cartCount } = useCart();

  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-teal-600">
          Profit store
        </Link>
        <nav className="hidden md:flex items-center space-x-6 space-x-reverse">
          <Link to="/" className="text-gray-600 hover:text-teal-600 transition-colors">الرئيسية</Link>
          <Link to="/design-studio" className="text-gray-600 hover:text-teal-600 transition-colors font-semibold">🎨 صمم بنفسك</Link>
          <Link to="/published-designs" className="text-gray-600 hover:text-teal-600 transition-colors">👕 تصاميم إبداعية</Link>
          <Link to="/digital-products" className="text-gray-600 hover:text-teal-600 transition-colors">🎮 منتجات رقمية</Link>
        </nav>
        <div className="flex items-center">
          <Link to="/cart" className="relative text-gray-600 hover:text-teal-600 transition-colors">
            <ShoppingCartIcon className="h-6 w-6" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
           <Link to="/admin/dashboard" className="ms-6 text-sm text-gray-500 hover:text-teal-600">لوحة التحكم</Link>
        </div>
      </div>
    </header>
  );
};

export default Header;