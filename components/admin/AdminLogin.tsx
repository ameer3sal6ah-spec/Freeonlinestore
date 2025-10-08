
import React, { useState } from 'react';

const ADMIN_PASSWORD = 'MO9090QaasWE%Vbn7'; // يمكنك تغيير كلمة المرور هنا

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    // Simulate a network request
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        onLoginSuccess();
      } else {
        setError('كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.');
      }
      setIsLoggingIn(false);
    }, 500);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 font-sans">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            لوحة التحكم
          </h1>
          <p className="mt-2 text-gray-600">
            الرجاء إدخال كلمة المرور للوصول.
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700 sr-only"
            >
              كلمة المرور
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 text-right border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="كلمة المرور"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full px-4 py-3 font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? 'جاري الدخول...' : 'دخول'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;