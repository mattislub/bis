import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const Header: React.FC = () => (
  <header className="bg-white shadow-sm border-b">
    <div className="container mx-auto px-4 py-4 flex justify-between items-center">
      <Logo />
      <Link
        to="/login"
        className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
      >
        התחברות
      </Link>
    </div>
  </header>
);

export default Header;
