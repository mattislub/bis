import React from 'react';
import { useSearchParams } from 'react-router-dom';

export default function PaymentCancelled() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');

  return (
    <div className="mx-auto max-w-md p-4" dir="rtl">
      <h1 className="mb-4 text-center text-2xl font-bold">התשלום בוטל</h1>
      {orderId && (
        <p className="text-center">מספר הזמנה: {orderId}</p>
      )}
      <p className="mt-4 text-center">אם זו טעות, נסו שוב לבצע את התשלום.</p>
    </div>
  );
}
