import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  MapPin,
  Settings,
  Mail,
  Info,
  Armchair
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { path: '/', label: 'ניהול מתפללים', icon: Users },
    { path: '/seats-view', label: 'תצוגת מקומות', icon: MapPin },
    { path: '/seats-manage', label: 'ניהול מקומות', icon: Settings },
    { path: '/contact', label: 'צור קשר', icon: Mail },
    { path: '/about', label: 'אודות', icon: Info },
  ];

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4 space-x-reverse">
            <Armchair className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-800">מערכת ניהול מקומות ישיבה</h1>
          </div>
          
          <div className="flex space-x-1 space-x-reverse items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4 ml-2" />
                  {item.label}
                </button>
              );
            })}
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex items-center px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              יציאה
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
