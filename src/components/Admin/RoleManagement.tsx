import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../api';

interface User {
  email: string;
  role: string;
}

const RoleManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/users`)
      .then(res => res.json())
      .then(setUsers)
      .catch(err => console.error('load users error', err));
  }, []);

  const updateRole = async (email: string, role: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/users/${email}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      setUsers(prev => prev.map(u => (u.email === email ? { ...u, role } : u)));
    } catch (err) {
      console.error('update role error', err);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">ניהול תפקידי משתמשים</h2>
      <div className="grid gap-4">
        {users.map(user => (
          <div key={user.email} className="border rounded p-4 shadow">
            <div className="font-bold mb-2">{user.email}</div>
            <select
              value={user.role}
              onChange={e => updateRole(user.email, e.target.value)}
              className="border p-1 rounded"
            >
              <option value="demo">demo</option>
              <option value="pro">pro</option>
              <option value="manager">manager</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoleManagement;
