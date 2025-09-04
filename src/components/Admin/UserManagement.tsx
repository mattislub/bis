import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../api';

interface User {
  email: string;
  gabbaiName?: string;
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
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="text-right">מייל</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.email} className="border-t">
              <td className="py-2">{user.email}</td>
              <td className="py-2 text-left">
                <button
                  className="text-red-600"
                  onClick={() => handleDelete(user.email)}
                >
                  מחיקה
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagement;
