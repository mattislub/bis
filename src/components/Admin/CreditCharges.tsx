import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../api';

interface CreditCharge {
  chargeId: number;
  email: string | null;
  orderId: string;
  amount: string;
  currency: string;
  transactionDate: string | null;
  status: string;
  isPaid: boolean;
}

const CreditCharges: React.FC = () => {
  const [charges, setCharges] = useState<CreditCharge[]>([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/credit-charges`)
      .then(res => res.json())
      .then(setCharges)
      .catch(err => console.error('load credit charges error', err));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">חיובים</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">Order ID</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Amount</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Paid</th>
              <th className="px-4 py-2 border">Date</th>
            </tr>
          </thead>
          <tbody>
            {charges.map(c => (
              <tr key={c.chargeId} className="text-center">
                <td className="px-4 py-2 border">{c.orderId}</td>
                <td className="px-4 py-2 border">{c.email || '-'}</td>
                <td className="px-4 py-2 border">{c.amount} {c.currency}</td>
                <td className="px-4 py-2 border">{c.status}</td>
                <td className="px-4 py-2 border">{c.isPaid ? '✔️' : ''}</td>
                <td className="px-4 py-2 border">{c.transactionDate ? new Date(c.transactionDate).toLocaleString('he-IL') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CreditCharges;
