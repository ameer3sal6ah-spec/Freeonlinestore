import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Order } from '../../types';

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
                                        <td className="p-3">{new Date(order.createdAt).toLocaleString('ar-SA')}</td>
                                        <td className="p-3">{order.total.toFixed(2)} ج.م</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(order.status)}`}>
                                                {statusText[order.status]}
                                            </span>
                                        </td>
                                        <td className="p-3">
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