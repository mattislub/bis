import React, { useState } from 'react';
import { User } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { Plus, Edit2, Trash2, Save, X, User as UserIcon } from 'lucide-react';

const UserManagement: React.FC = () => {
  const { users, setUsers } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    phone: '',
    department: '',
  });

  const departments = ['פיתוח', 'עיצוב', 'שיווק', 'מכירות', 'כספים', 'משאבי אנוש', 'תפעול'];

  const handleSaveUser = () => {
    if (!formData.name || !formData.email) return;

    if (editingUser) {
      setUsers(prev => prev.map(user => 
        user.id === editingUser ? { ...user, ...formData } as User : user
      ));
      setEditingUser(null);
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        ...formData as Required<Omit<User, 'id' | 'avatar'>>,
      };
      setUsers(prev => [...prev, newUser]);
      setIsAdding(false);
    }

    setFormData({ name: '', email: '', phone: '', department: '' });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user.id);
    setFormData(user);
    setIsAdding(false);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק משתמש זה?')) {
      setUsers(prev => prev.filter(user => user.id !== userId));
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', phone: '', department: '' });
  };

  const handleAddNew = () => {
    setIsAdding(true);
    setEditingUser(null);
    setFormData({ name: '', email: '', phone: '', department: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">ניהול משתמשים</h1>
        <button
          onClick={handleAddNew}
          disabled={isAdding || editingUser}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4 ml-2" />
          הוסף משתמש חדש
        </button>
      </div>

      {(isAdding || editingUser) && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-blue-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            {editingUser ? 'עריכת משתמש' : 'הוספת משתמש חדש'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">שם מלא *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="הכנס שם מלא"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">אימייל *</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="example@domain.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">טלפון</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="050-1234567"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">מחלקה</label>
              <select
                value={formData.department || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">בחר מחלקה</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex space-x-3 space-x-reverse">
            <button
              onClick={handleSaveUser}
              disabled={!formData.name || !formData.email}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 ml-2" />
              שמור
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <X className="h-4 w-4 ml-2" />
              ביטול
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white p-4 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-500">
                    {user.phone} • {user.department}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2 space-x-reverse">
                <button
                  onClick={() => handleEditUser(user)}
                  disabled={isAdding || editingUser}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="עריכה"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  disabled={isAdding || editingUser}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="מחיקה"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {users.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">אין משתמשים רשומים במערכת</p>
            <p className="text-gray-400">לחץ על "הוסף משתמש חדש" כדי להתחיל</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;