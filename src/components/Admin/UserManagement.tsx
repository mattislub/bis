import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../api';

interface User {
  email: string;
  gabbaiName?: string;
  phone?: string;
  synagogueName?: string;
  address?: string;
  city?: string;
  contactPhone?: string;
  role?: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/users`)
      .then(res => res.json())
      .then(setUsers)
      .catch(err => console.error('load users error', err));
  }, []);

  const handleDelete = async (email: string) => {
    if (!window.confirm(`למחוק את ${email}?`)) return;
    try {
      await fetch(`${API_BASE_URL}/api/users/${email}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.email !== email));
    } catch (err) {
      console.error('delete user error', err);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">ניהול משתמשים</h2>
      <div className="grid gap-4">
        {users.map(user => (
          <div key={user.email} className="border rounded p-4 shadow">
            <div className="font-bold mb-2">{user.email}</div>
            {user.gabbaiName && <div>גבאי: {user.gabbaiName}</div>}
            {user.phone && <div>טלפון: {user.phone}</div>}
            {user.synagogueName && <div>שם בית הכנסת: {user.synagogueName}</div>}
            {user.address && <div>כתובת: {user.address}</div>}
            {user.city && <div>עיר: {user.city}</div>}
            {user.contactPhone && <div>טלפון איש קשר: {user.contactPhone}</div>}
            {user.role && <div>תפקיד: {user.role}</div>}
            <button
              className="text-red-600 mt-2"
              onClick={() => handleDelete(user.email)}
            >
              מחיקה
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;
