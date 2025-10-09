
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Order } from '../../types';
import { WhatsAppIcon } from '../../components/icons/Icons';

const OrdersListPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        const fetchedOrders = await api.getOrders();
        setOrders(fetchedOrders);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);
    
    const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
        const originalOrders = [...orders];
        // Optimistic update
        setOrders(prevOrders => 
            prevOrders.map(o => o.id === orderId ? {...o, status: newStatus} : o)
        );

        const updatedOrder = await api.updateOrderStatus(orderId, newStatus);
        if (!updatedOrder) {
            // Revert on failure
            setOrders(originalOrders);
            alert("فشل تحديث حالة الطلب");
        }
    };

    const formatPhoneNumber = (phone: string): string => {
        let cleaned = phone.replace(/\D/g, ''); // إزالة كل ما ليس برقم
        if (cleaned.startsWith('0')) {
            cleaned = cleaned.substring(1); // إزالة الصفر في البداية
        }
        if (!cleaned.startsWith('20')) {
            cleaned = '20' + cleaned; // إضافة كود الدولة لمصر
        }
        return cleaned;
    };

    const handleWhatsAppConfirm = (order: Order) => {
        const customerPhone = formatPhoneNumber(order.phone);
        // FIX: Access product name via item.product.name
        const itemsSummary = order.items.map(item => `- ${item.product.name} (الكمية: ${item.quantity})`).join('\n');
        
        const message = `
مرحباً ${order.customerName}،
نحن نتصل بك من متجر "Profit store" لتأكيد طلبك رقم:
*${order.id}*

*تفاصيل الطلب:*
${itemsSummary}

*الإجمالي:* ${order.total.toFixed(2)} ج.م (الدفع عند الاستلام)

يرجى الرد بـ "أؤكد" لمتابعة عملية الشحن.
شكراً لثقتك بنا!
        `.trim().replace(/\n\s*\n/g, '\n\n');

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${customerPhone}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    };
    
    const getStatusChip = (status: Order['status']) => {
        switch (status) {
          case 'pending': return 'bg-yellow-100 text-yellow-800';
          case 'shipped': return 'bg-blue-100 text-blue-800';
          case 'delivered': return 'bg-green-100 text-green-800';
          case 'cancelled': return 'bg-red-100 text-red-800';
          default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">الطلبات</h1>

            <div className="bg-white p-6 rounded-lg shadow">
                {loading ? <p>جار التحميل...</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right min-w-[800px]">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-3 font-semibold text-sm text-gray-800 border-b border-gray-200">رقم الطلب</th>
                                    <th className="p-3 font-semibold text-sm text-gray-800 border-b border-gray-200">العميل</th>
                                    <th className="p-3 font-semibold text-sm text-gray-800 border-b border-gray-200">رقم الجوال</th>
                                    <th className="p-3 font-semibold text-sm text-gray-800 border-b border-gray-200">العنوان</th>
                                    <th className="p-3 font-semibold text-sm text-gray-800 border-b border-gray-200">التاريخ</th>
                                    <th className="p-3 font-semibold text-sm text-gray-800 border-b border-gray-200">الإجمالي</th>
                                    <th className="p-3 font-semibold text-sm text-gray-800 border-b border-gray-200">الحالة</th>
                                    <th className="p-3 font-semibold text-sm text-gray-800 border-b border-gray-200">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id} className="border-b">
                                        <td className="p-3 text-xs">{order.id}</td>
                                        <td className="p-3">{order.customerName}</td>
                                        <td className="p-3">{order.phone}</td>
                                        <td className="p-3">{`${order.address}, ${order.city}`}</td>
                                        <td className="p-3">{new Date(order.createdAt).toLocaleString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Cairo' })}</td>
                                        <td className="p-3">{order.total.toFixed(2)} ج.م</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(order.status)}`}>
                                                {statusText[order.status]}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center space-x-2 space-x-reverse">
                                                <select 
                                                    value={order.status} 
                                                    onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                                                    className="border-gray-300 rounded-md text-sm"
                                                >
                                                    <option value="pending">قيد الانتظار</option>
                                                    <option value="shipped">تم الشحن</option>
                                                    <option value="delivered">تم التوصيل</option>
                                                    <option value="cancelled">ملغي</option>
                                                </select>
                                                {order.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleWhatsAppConfirm(order)}
                                                        className="p-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                                                        title="تأكيد الطلب عبر واتساب"
                                                        aria-label="Confirm order via WhatsApp"
                                                    >
                                                        <WhatsAppIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const statusText = {
    pending: 'قيد الانتظار',
    shipped: 'تم الشحن',
    delivered: 'تم التوصيل',
    cancelled: 'ملغي'
};

export default OrdersListPage;