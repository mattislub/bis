import React from 'react';
import { Link } from 'react-router-dom';
import { Armchair, ArrowRight, Users, Zap } from 'lucide-react';

const Home: React.FC = () => {
  const features = [
    {
      icon: Users,
      title: 'ניהול מתפללים מתקדם',
      description:
        'מערכת מלאה לניהול פרטי מתפללים וכמות מקומות ישיבה'
    },
    {
      icon: Armchair,
      title: 'תצוגה ויזואלית אינטואיטיבית',
      description:
        'הצגה ברורה של כל מקומות הישיבה עם סימון צבעוני וידידותי למשתמש'
    },
    {
      icon: Zap,
      title: 'גרור ושחרר פשוט',
      description:
        'עיצוב פריסת המשרד בקלות עם טכנולוגיית גרור ושחרר מתקדמת'
    }
  ];

  const stats = [
    { value: '100+', label: 'מקומות ישיבה ניתנים לניהול' },
    { value: '5', label: 'מודולים עיקריים במערכת' },
    { value: '100%', label: 'תמיכה בעברית ו-RTL' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-16" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 space-y-20">
        <section className="text-center space-y-6">
          <div className="flex justify-center">
            <Armchair className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">מערכת ניהול מקומות ישיבה</h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            ברוכים הבאים! זוהי מערכת מקיפה לניהול מקומות ישיבה במשרדים ובחללי עבודה,
            הכוללת כלי גרירה ושחרור, ניהול מתפללים ומפה אינטואיטיבית בעברית מלאה.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
            >
              התחבר למערכת
              <ArrowRight className="mr-2 h-5 w-5" />
            </Link>
            <Link
              to="/view/example"
              className="inline-flex items-center px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg text-lg font-medium hover:bg-blue-50 transition-colors"
            >
              נסה דוגמה
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg text-lg font-medium hover:bg-blue-50 transition-colors"
            >
              מחירון
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">למה לבחור במערכת שלנו?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center space-y-4"
                >
                  <div className="flex justify-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-3xl font-bold text-center mb-8">המערכת במספרים</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-4xl font-bold text-blue-600 mb-2">{stat.value}</div>
                <div className="text-gray-700">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
