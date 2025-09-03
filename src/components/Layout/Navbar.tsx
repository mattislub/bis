import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  Settings,
  Mail,
  Info,
  HelpCircle,
  CreditCard,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../common/Logo';
import { useState } from 'react';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/app', label: 'ניהול מתפללים', icon: Users },
    { path: '/app/seats-manage', label: 'ניהול מקומות', icon: Settings },
    { path: '/app/map-guide', label: 'מדריך מפה', icon: HelpCircle },
    { path: '/app/contact', label: 'צור קשר', icon: Mail },
    { path: '/app/about', label: 'אודות', icon: Info },
    { path: '/app/pricing', label: 'מחירון', icon: CreditCard },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo />
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1 space-x-reverse">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4 ml-2" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* User Info & Logout */}
          <div className="hidden lg:flex items-center space-x-4 space-x-reverse">
            {user && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">{user.synagogueName || user.email}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 rounded-xl text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
            >
              <LogOut className="h-4 w-4 ml-2" />
              יציאה
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 ml-2" />
                    {item.label}
                  </button>
                );
              })}
              
              {/* Mobile User Info */}
              {user && (
                <div className="px-4 py-2 text-sm text-gray-600 border-t border-gray-200 mt-4 pt-4">
                  <span className="font-medium">{user.synagogueName || user.email}</span>
                </div>
              )}
              
              {/* Mobile Logout */}
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
              >
                <LogOut className="h-4 w-4 ml-2" />
                יציאה
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;