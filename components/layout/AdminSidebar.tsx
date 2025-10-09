
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, PackageIcon, ListOrderedIcon } from '../icons/Icons';

const AdminSidebar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { href: '/admin/dashboard', label: 'لوحة التحكم', icon: <HomeIcon className="w-5 h-5" /> },
    { href: '/admin/products', label: 'المنتجات', icon: <PackageIcon className="w-5 h-5" /> },
    { href: '/admin/orders', label: 'الطلبات', icon: <ListOrderedIcon className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-gray-800 text-white p-6 flex flex-col">
      <div className="text-2xl font-bold mb-10">
        <Link to="/admin/dashboard">لوحة التحكم</Link>
      </div>
      <nav className="flex-grow">
        <ul>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                className={`flex items-center space-x-3 space-x-reverse rounded-md px-3 py-2 text-lg transition-colors ${
                  location.pathname === item.href
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div>
        <Link to="/" className="text-sm text-gray-400 hover:text-white">العودة للمتجر</Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;