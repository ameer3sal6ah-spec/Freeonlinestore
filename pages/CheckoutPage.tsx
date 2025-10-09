

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import api from '../services/api';

const CheckoutPage: React.FC = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    
    setIsSubmitting(true);
    const orderData = {
      customerName: formData.name,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      items: cartItems,
      total: cartTotal,
    };

    try {
      const newOrder = await api.submitOrder(orderData);
      clearCart();
      navigate('/confirmation', { state: { order: newOrder } });
    } catch (error) {
      console.error("Failed to submit order:", error);
      // Show an error message to the user
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0 && !isSubmitting) {
      return (
        <div className="text-center py-20">
            <p className="text-xl">سلتك فارغة. لا يمكنك إتمام الطلب.</p>
        </div>
      );
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-center mb-8">إتمام الطلب</h1>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        {/* Checkout Form */}
        <div className="lg:col-span-3 bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-6">معلومات الشحن</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" required />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">رقم الجوال</label>
              <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" required />
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
              <input type="text" id="address" name="address" value={formData.address} onChange={handleInputChange} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" required />
            </div>
             <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">المدينة</label>
              <input type="text" id="city" name="city" value={formData.city} onChange={handleInputChange} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" required />
            </div>
            <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-2">طريقة الدفع</h3>
                <div className="p-4 border rounded-md bg-gray-50">
                    <p className="font-semibold">الدفع عند الاستلام</p>
                    <p className="text-sm text-gray-600">سيتم الدفع نقداً لمندوب التوصيل عند استلام الطلب.</p>
                </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-teal-600 text-white font-bold py-3 rounded-lg hover:bg-teal-700 transition-colors disabled:bg-gray-400">
              {isSubmitting ? 'جاري تأكيد الطلب...' : `تأكيد الطلب والدفع عند الاستلام`}
            </button>
          </form>
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow-md h-fit">
          <h2 className="text-2xl font-semibold mb-6">ملخص الطلب</h2>
          <div className="space-y-4">
            {cartItems.map(item => (
              <div key={item.cartItemId} className="flex justify-between items-center">
                <div className="flex items-center">
                  {/* FIX: Removed unnecessary `as any` type casting */}
                  <img src={item.customization ? item.customization.finalDesignUrl : item.product.imageUrl} alt={item.product.name} className="w-16 h-16 rounded-md me-4 object-cover"/>
                  <div>
                    <p className="font-semibold">{item.product.name}</p>
                    <p className="text-sm text-gray-500">الكمية: {item.quantity}</p>
                  </div>
                </div>
                <p className="font-semibold">{(item.product.price * item.quantity).toFixed(2)} ج.م</p>
              </div>
            ))}
          </div>
          <div className="border-t mt-6 pt-4 space-y-2">
            <div className="flex justify-between">
              <p>المجموع الفرعي</p>
              <p>{cartTotal.toFixed(2)} ج.م</p>
            </div>
            <div className="flex justify-between">
              <p>الشحن</p>
              <p className="text-green-600">مجاني</p>
            </div>
            <div className="flex justify-between font-bold text-xl mt-2">
              <p>الإجمالي</p>
              <p>{cartTotal.toFixed(2)} ج.م</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
