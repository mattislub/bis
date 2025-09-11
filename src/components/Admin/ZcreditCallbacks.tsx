import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../api';

interface Callback {
  id: number;
  payload: unknown;
  receivedAt: string;
}

const ZcreditCallbacks: React.FC = () => {
  const [callbacks, setCallbacks] = useState<Callback[]>([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/zcredit-callbacks`)
      .then(res => res.json())
      .then(setCallbacks)
      .catch(err => console.error('load zcredit callbacks error', err));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">ZCredit Callbacks</h2>
      <div className="grid gap-4">
        {callbacks.map(cb => (
          <div key={cb.id} className="border rounded p-4 text-sm break-words">
            <div className="text-gray-600 mb-2">
              {new Date(cb.receivedAt).toLocaleString('he-IL')}
            </div>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(cb.payload, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ZcreditCallbacks;
