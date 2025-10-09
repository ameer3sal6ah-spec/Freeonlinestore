
import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { Trash2Icon, PlusIcon, MinusIcon } from '../components/icons/Icons';
import { CartItem } from '../types';

const CartPage: React.FC = () => {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();

  const renderCartItem = (item: CartItem) => {
    if (item.customization) {
      // Custom T-shirt Item
      const { customization } = item;
      return (
        <div className="flex items-start">
          <div className="relative w-24 h-24 me-4 bg-gray-200 rounded-md">
            <img src={customization.tshirtImageUrl} alt="T-shirt base" className="w-24 h-24 object-cover rounded-md" />
            {customization.logoUrl && customization.logoPosition && (
              <img 
                src={customization.logoUrl} 
                alt="Custom logo" 
                className="absolute object-contain pointer-events-none"
                style={{
                  top: `${customization.logoPosition.y}%`,
                  left: `${customization.logoPosition.x}%`,
                  width: `${customization.logoPosition.width}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            )}
            {customization.text && (
              <div
                className="absolute pointer-events-none flex items-center justify-center"
                style={{
                    top: `${customization.text.y}%`,
                    left: `${customization.text.x}%`,
                    color: customization.text.color,
                    fontSize: `${(customization.text.fontSize / 100) * 96}px`, // 96px is w-24
                    fontFamily: customization.text.fontFamily,
                    transform: 'translate(-50%, -50%)',
                    whiteSpace: 'nowrap',
                }}
              >
                  {customization.text.content}
              </div>
            )}
          </div>
          <div>
            <span className="font-semibold text-lg">{item.product.name}</span>
            <div className="text-sm text-gray-500 mt-1">
              <span>اللون: {customization.color.name}</span>, <span>المقاس: {customization.size}</span>
            </div>
            <p className="text-gray-600 mt-1">{item.product.price.toFixed(2)} ج.م</p>
          </div>
        </div>
      );
    } else {
      // Standard Product Item
      return (
        <div className="flex items-center">
          <img src={(item.product as any).imageUrl} alt={item.product.name} className="w-20 h-20 object-cover rounded-md me-4" />
          <div>
            <Link to={`/product/${item.product.id}`} className="font-semibold text-lg hover:text-teal-600">{item.product.name}</Link>
            <p className="text-gray-500">{item.product.price.toFixed(2)} ج.م</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="bg-gray-100 py-12">
      <div className="container mx-auto px-6">
        <h1 className="text-3xl font-bold text-center mb-8">سلة التسوق</h1>
        {cartCount === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <p className="text-xl text-gray-600 mb-4">سلتك فارغة حالياً.</p>
            <Link to="/design-studio" className="bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-teal-700 transition-colors">
              ابدأ التصميم
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">المنتجات ({cartCount})</h2>
              <div className="space-y-6">
                {cartItems.map(item => (
                  <div key={item.cartItemId} className="flex items-center justify-between border-b pb-6">
                    {renderCartItem(item)}
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <div className="flex items-center border rounded-md">
                        <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} className="px-2 py-1"><PlusIcon className="w-4 h-4" /></button>
                        <span className="px-3">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} className="px-2 py-1"><MinusIcon className="w-4 h-4" /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.cartItemId)} className="text-red-500 hover:text-red-700">
                        <Trash2Icon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 h-fit">
              <h2 className="text-xl font-semibold mb-4">ملخص الطلب</h2>
              <div className="flex justify-between mb-2">
                <span>المجموع الفرعي</span>
                <span>{cartTotal.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between mb-4">
                <span>الشحن</span>
                <span className="text-green-600">مجاني</span>
              </div>
              <div className="border-t pt-4 flex justify-between font-bold text-lg">
                <span>المجموع الإجمالي</span>
                <span>{cartTotal.toFixed(2)} ج.م</span>
              </div>
              <Link to="/checkout" className="block w-full text-center mt-6 bg-teal-600 text-white font-bold py-3 rounded-lg hover:bg-teal-700 transition-colors">
                إتمام عملية الدفع
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;