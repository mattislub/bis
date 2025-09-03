import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Logo from './Logo';

const Header: React.FC = () => (
  <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 rounded-2xl mb-8">
    <div className="container mx-auto px-6 py-4 flex justify-between items-center">
      <Logo />
      <Link
        to="/login"
        className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
      >
        התחברות
        <ArrowLeft className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  </header>
);

export default Header;