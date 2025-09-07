import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useServerStorage } from '../../hooks/useServerStorage';

const DefaultMapView: React.FC = () => {
  const { maps } = useAppContext();
  const { user } = useAuth();
  const [defaultMapId, setDefaultMapId] = useServerStorage<string>('defaultMapId', '', user?.email);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">מפת ברירת מחדל</h2>
      <select
        value={defaultMapId}
        onChange={e => setDefaultMapId(e.target.value)}
        className="border p-2 rounded"
      >
        <option value="">ללא</option>
        {maps.map(map => (
          <option key={map.id} value={map.id}>
            {map.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DefaultMapView;
