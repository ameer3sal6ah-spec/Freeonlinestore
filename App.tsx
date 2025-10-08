
import React from 'react';
import { HashRouter, Route, Routes, Outlet, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';

// Layouts
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProtectedAdminLayout from './components/layout/ProtectedAdminLayout';

// Pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/admin/DashboardPage';
import ProductsListPage from './pages/admin/ProductsListPage';
import OrdersListPage from './pages/admin/OrdersListPage';

// Import the error state from the supabase client
import { supabaseError } from './services/supabaseClient';

// Store Layout Component
const StoreLayout = () => (
  <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800 font-sans">
    <Header />
    <main className="flex-grow">
      <Outlet /> {/* Child routes will render here */}
    </main>
    <Footer />
  </div>
);

const App: React.FC = () => {
  // If there's a configuration error, display a message and stop rendering the app.
  if (supabaseError) {
    return (
      <div dir="rtl" className="font-sans bg-gray-100 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto text-center border-t-4 border-red-500">
          <h1 className="text-2xl font-bold text-red-600 mb-4">خطأ في الإعداد</h1>
          <p className="text-gray-700 text-lg mb-2">{supabaseError}</p>
          <p className="text-gray-600">
            يرجى التأكد من اتباع التعليمات الموجودة في ملف <code className="bg-red-100 text-red-800 font-mono p-1 rounded-md">README.md</code> لتكوين اتصال Supabase بشكل صحيح.
          </p>
        </div>
      </div>
    );
  }

  return (
    <CartProvider>
      <HashRouter>
        <Routes>
          {/* Public Store Routes */}
          <Route element={<StoreLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/confirmation" element={<OrderConfirmationPage />} />
            <Route path="/landing/:id" element={<LandingPage />} />
          </Route>
          
          {/* Protected Admin Routes */}
          <Route path="/admin" element={<ProtectedAdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="products" element={<ProductsListPage />} />
            <Route path="orders" element={<OrdersListPage />} />
          </Route>

        </Routes>
      </HashRouter>
    </CartProvider>
  );
};

export default App;
