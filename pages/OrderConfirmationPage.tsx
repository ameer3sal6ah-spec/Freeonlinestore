
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Order } from '../types';

const OrderConfirmationPage: React.FC = () => {
  const location = useLocation();
  const order: Order | undefined = location.state?.order;

  if (!order) {
    return (
        <div className="container mx-auto px-6 py-20 text-center">
            <div className="bg-white p-10 rounded-lg shadow-lg max-w-2xl mx-auto">
                 <h1 className="text-2xl font-bold text-gray-800 mb-4">صفحة غير موجودة</h1>
                 <p className="text-gray-600 mb-6">لم نتمكن من العثور على تفاصيل الطلب. ربما تم الوصول إلى هذه الصفحة عن طريق الخطأ.</p>
                 <Link to="/shop" className="bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-teal-700 transition-colors">
                    العودة للمتجر
                </Link>
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-20 text-center">
      <div className="bg-white p-10 rounded-lg shadow-lg max-w-2xl mx-auto">
        <svg className="w-20 h-20 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">شكراً لك، تم استلام طلبك بنجاح!</h1>
        <p className="text-gray-600 mb-6">سنتواصل معك قريباً لتأكيد تفاصيل الشحن. نقدر ثقتك بنا.</p>
        
        <div className="bg-gray-100 p-4 rounded-md inline-block mb-8">
          <span className="text-gray-500">رقم طلبك هو:</span>
          <strong className="text-gray-800 text-lg mx-2">{order.id}</strong>
        </div>
        
        <div className="mt-10">
          <Link to="/shop" className="bg-teal-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-teal-700 transition-colors">
            الاستمرار في التسوق
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;