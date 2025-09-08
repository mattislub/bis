import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../api';

export default function PaymentThankYou() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const { user, updateUser } = useAuth();

  useEffect(() => {
    const refreshRole = async () => {
      if (!user?.email) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(user.email)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.role && data.role !== user.role) {
          updateUser({ role: data.role });
        }
      } catch (err) {
        console.error('Failed to refresh user role', err);
      }
    };
    refreshRole();
  }, [user, updateUser]);

  return (
    <div className="mx-auto max-w-md p-4" dir="rtl">
      <h1 className="mb-4 text-center text-2xl font-bold">תודה שרכשת את החבילה!</h1>
      {orderId && (
        <p className="text-center">מספר הזמנה: {orderId}</p>
      )}
      <p className="mt-4 text-center">שלחנו אליך מייל עם סיסמת התחברות.</p>
      <p className="mt-2 text-center">
        <a href="https://seatflow.tech/login" className="text-blue-600 underline">
          לחץ כאן להתחברות
        </a>
      </p>
    </div>
  );
}
