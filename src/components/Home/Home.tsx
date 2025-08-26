import React from 'react';
import { Link } from 'react-router-dom';
import { Armchair, ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
      <div className="max-w-3xl mx-auto p-8 text-center space-y-6 bg-white rounded-lg shadow">
        <div className="flex justify-center">
          <Armchair className="h-16 w-16 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900">מערכת ניהול מקומות ישיבה</h1>
        <p className="text-xl text-gray-700">
          ברוכים הבאים! זוהי מערכת מקיפה לניהול מקומות ישיבה במשרדים ובחללי עבודה, הכוללת
          כלי גרירה ושחרור, ניהול מתפללים ומפה אינטואיטיבית בעברית מלאה.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
        >
          התחבר למערכת
          <ArrowRight className="mr-2 h-5 w-5" />
        </Link>
      </div>
    </div>
  );
};

export default Home;
