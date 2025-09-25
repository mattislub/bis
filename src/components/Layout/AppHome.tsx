import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Settings, Map, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AppHome: React.FC = () => {
  const { user } = useAuth();

  const shortcuts = [
    {
      title: 'ניהול מתפללים',
      description: 'הוספה, עדכון והקצאת מקומות ישיבה לכל מתפלל.',
      icon: Users,
      to: '/app/worshipers',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'ניהול מקומות',
      description: 'עיצוב מפת המושבים ועריכת חלוקה לאזורים.',
      icon: Settings,
      to: '/app/seats-manage',
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      title: 'מדריך מפה',
      description: 'הסברים, טיפים וסרטונים לעבודה עם המערכת.',
      icon: Map,
      to: '/app/map-guide',
      gradient: 'from-emerald-500 to-emerald-600',
    },
    {
      title: 'צור קשר',
      description: 'צרו קשר לתמיכה או לשאלות נוספות מול הצוות.',
      icon: Mail,
      to: '/app/contact',
      gradient: 'from-orange-500 to-orange-600',
    },
  ];

  return (
    <div className="space-y-10" dir="rtl">
      <header className="text-center space-y-4">
        <p className="text-sm font-medium text-blue-600">SeatFlow.tech</p>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900">
          ברוכים הבאים למערכת הניהול
        </h1>
        <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
          {user?.synagogueName
            ? `שלום ${user.synagogueName}! בחרו את הפעולה הרצויה כדי להתחיל לעבוד.`
            : 'בחרו את אחד האיזורים כדי להתחיל לנהל את המערכת שלכם.'}
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {shortcuts.map(({ title, description, icon: Icon, to, gradient }) => (
          <Link
            key={title}
            to={to}
            className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient}`} />
            <div className="relative flex flex-col gap-6">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-colors duration-300 group-hover:bg-blue-600 group-hover:text-white">
                <Icon className="h-7 w-7" />
              </span>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                <p className="text-gray-600 leading-relaxed">{description}</p>
              </div>
              <div className="flex items-center justify-between text-sm font-semibold text-blue-600">
                <span>כניסה</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AppHome;
