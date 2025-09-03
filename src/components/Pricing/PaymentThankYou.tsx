import React from 'react';
import { useSearchParams } from 'react-router-dom';

export default function PaymentThankYou() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');

  return (
    <div className="mx-auto max-w-md p-4" dir="rtl">
      <h1 className="mb-4 text-center text-2xl font-bold">תודה על התשלום!</h1>
      {orderId && (
        <p className="text-center">מספר הזמנה: {orderId}</p>
      )}
      <p className="mt-4 text-center">המשך גלישה נעימה.</p>
    </div>
  );
}
