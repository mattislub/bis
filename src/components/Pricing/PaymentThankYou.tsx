import React from 'react';
import { useSearchParams } from 'react-router-dom';

export default function PaymentThankYou() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');

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
