import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import api from '../../services/api';

const DashboardPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            const fetchedOrders = await api.getOrders();
            setOrders(fetchedOrders);
            setLoading(false);
        };
        fetchOrders();
    }, []);

    const totalRevenue = orders.reduce((sum, order) => (order.status === 'delivered' ? sum + order.total : sum), 0);
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const totalOrders = orders.length;

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
            <h1 className="text-3xl font-bold mb-8">لوحة التحكم</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-lg">إجمالي الإيرادات</h3>
                    <p className="text-3xl font-bold">{totalRevenue.toFixed(2)} ج.م</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-lg">الطلبات قيد الانتظار</h3>
                    <p className="text-3xl font-bold">{pendingOrders}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-lg">إجمالي الطلبات</h3>
                    <p className="text-3xl font-bold">{totalOrders}</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-4">أحدث الطلبات</h2>
                {loading ? <p>جار التحميل...</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-3 font-semibold text-sm text-gray-800 border-b border-gray-200">رقم الطلب</th>
                                    <th className="p-3 font-semibold text-sm text-gray-800 border-b border-gray-200">العميل</th>
                                    <th className="p-3 font-semibold text-sm text-gray-800 border-b border-gray-200">التاريخ</th>
                                    <th className="p-3 font-semibold text-sm text-gray-800 border-b border-gray-200">الإجمالي</th>
                                    <th className="p-3 font-semibold text-sm text-gray-800 border-b border-gray-200">الحالة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.slice(0, 5).map(order => (
                                    <tr key={order.id} className="border-b">
                                        <td className="p-3">{order.id}</td>
                                        <td className="p-3">{order.customerName}</td>
                                        <td className="p-3">{new Date(order.createdAt).toLocaleDateString('ar-SA')}</td>
                                        <td className="p-3">{order.total.toFixed(2)} ج.م</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(order.status)}`}>
                                                {statusText[order.status]}
                                            </span>
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


export default DashboardPage;