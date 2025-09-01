import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProfileSetup: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [gabbaiName, setGabbaiName] = useState(user?.gabbaiName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [synagogueName, setSynagogueName] = useState(user?.synagogueName || '');
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || '');
  const [contactPhone, setContactPhone] = useState(user?.contactPhone || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      gabbaiName,
      phone,
      synagogueName,
      address,
      city,
      contactPhone,
    });
    if (user) {
      try {
        await fetch(`/api/users/${encodeURIComponent(user.email)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gabbaiName, phone, synagogueName, address, city, contactPhone }),
        });
      } catch (err) {
        // ignore errors for now
      }
    }
    navigate('/app');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold text-center">פרטי בית הכנסת</h2>
        <input
          type="text"
          placeholder="שם הגבאי"
          value={gabbaiName}
          onChange={(e) => setGabbaiName(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="טלפון"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="שם בית הכנסת"
          value={synagogueName}
          onChange={(e) => setSynagogueName(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="כתובת"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="עיר"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="טלפון ליצירת קשר"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="email"
          value={user?.email || ''}
          className="w-full p-2 border rounded bg-gray-100"
          disabled
        />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
          שמור
        </button>
      </form>
    </div>
  );
};

export default ProfileSetup;
