
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminLogin from '../admin/AdminLogin';
import AdminSidebar from './AdminSidebar';

const ProtectedAdminLayout: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
        sessionStorage.getItem('isAdminAuthenticated') === 'true'
    );

    const handleLoginSuccess = () => {
        sessionStorage.setItem('isAdminAuthenticated', 'true');
        setIsAuthenticated(true);
    };

    if (!isAuthenticated) {
        return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <div className="flex bg-gray-100 min-h-screen font-sans">
            <AdminSidebar />
            <main className="flex-1 p-8">
                <Outlet /> {/* Admin child pages will render here */}
            </main>
        </div>
    );
};
export default ProtectedAdminLayout;
