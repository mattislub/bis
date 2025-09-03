import React from 'react';
import {
  Armchair,
  Users,
  Zap,
  Shield,
  Heart,
  Target,
  CheckCircle,
  Star,
  Award,
  Lightbulb,
  Globe,
  Clock
} from 'lucide-react';
import Header from '../common/Header';

const About: React.FC = () => {
  const features = [
    {
      icon: Users,
      title: 'ניהול מתפללים מתקדם',
      description: 'מערכת מלאה לניהול פרטי מתפללים וכמות מקומות ישיבה עם מעקב אחר התחייבויות',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Armchair,
      title: 'תצוגה ויזואלית אינטואיטיבית',
      description: 'הצגה ברורה של כל מקומות הישיבה עם סימון צבעוני וממשק ידידותי למשתמש',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Zap,
      title: 'גרור ושחרר פשוט',
      description: 'עיצוב פריסת בית הכנסת בקלות עם טכנולוגיית גרור ושחרר מתקדמת',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Shield,
      title: 'אבטחה ואמינות',
      description: 'שמירת נתונים מאובטחת עם גיבוי אוטומטי ושחזור מהיר',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const benefits = [
    'חיסכון בזמן וניהול יעיל של משאבי בית הכנסת',
    'שיפור הארגון והסידור במרחב העבודה',
    'קלות בשינוי פריסות ובהתאמה לצרכים משתנים',
    'ממשק ידידותי למשתמש בעברית מלאה',
    'תצוגה ויזואלית ברורה של כל המידע',
    'גישה מהירה לפרטי כל מתפלל ומקום ישיבה',
    'ייצוא מפות לקבצי PDF איכותיים',
    'תמיכה במספר מוסדות ומשתמשים בו־זמנית',
  ];

  const stats = [
    { number: "1000+", label: "מקומות ישיבה", icon: Armchair },
    { number: "50+", label: "בתי כנסת", icon: Globe },
    { number: "99.9%", label: "זמינות", icon: Shield },
    { number: "24/7", label: "תמיכה", icon: Clock },
  ];

  const values = [
    {
      icon: Target,
      title: 'המשימה שלנו',
      description: 'לפשט ולייעל את ניהול מרחבי העבודה באמצעות כלים טכנולוגיים מתקדמים, תוך מתן מענה לצרכים המשתנים של ארגונים מודרניים.',
      color: 'from-blue-50 to-indigo-100'
    },
    {
      icon: Heart,
      title: 'הערכים שלנו',
      description: 'אנו מאמינים בפשטות, יעילות וחדשנות. המערכת שלנו מיועדת להיות נגישה לכולם, עם דגש על ממשק בעברית ועיצוב אינטואיטיבי.',
      color: 'from-green-50 to-emerald-100'
    },
    {
      icon: Lightbulb,
      title: 'החזון שלנו',
      description: 'להיות המערכת המובילה בישראל לניהול מקומות ישיבה, תוך מתן פתרונות חכמים ומותאמים לכל סוג של ארגון וקהילה.',
      color: 'from-purple-50 to-violet-100'
    }
  ];

  return (
    <div className="space-y-16">
      <Header />
      
      {/* Hero Section */}
      <div className="text-center relative">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full">
            <div className="w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          </div>
        </div>
        
        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-6">
          <Armchair className="h-12 w-12 text-blue-600" />
        </div>
        <h1 className="text-5xl font-black text-gray-900 mb-6">
          אודות <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">SeatFlow</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
          המערכת המתקדמת והידידותית ביותר לניהול מקומות ישיבה בבתי כנסת, 
          חללי עבודה משותפים ומרחבים ארגוניים. פותחה במיוחד עבור הקהילה הישראלית.
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                <Icon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-3xl font-black text-gray-900 mb-2">{stat.number}</div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {values.map((value, index) => {
          const Icon = value.icon;
          return (
            <div key={index} className={`bg-gradient-to-br ${value.color} p-8 rounded-3xl shadow-lg hover:shadow-xl transition-shadow`}>
              <div className="flex items-center mb-4">
                <Icon className="h-8 w-8 text-blue-600 ml-3" />
                <h2 className="text-2xl font-bold text-gray-900">{value.title}</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {value.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Features */}
      <div>
        <h2 className="text-4xl font-black text-gray-900 text-center mb-12">התכונות העיקריות</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-3xl shadow-lg">
        <h2 className="text-3xl font-black text-gray-900 text-center mb-8">היתרונות שתקבלו</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center space-x-3 space-x-reverse">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span className="text-gray-700">{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Technology */}
      <div>
        <h2 className="text-3xl font-black text-gray-900 text-center mb-8">הטכנולוגיה שלנו</h2>
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Award className="h-6 w-6 text-blue-600 ml-2" />
                טכנולוגיות מתקדמות
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• React 18 עם TypeScript למבנה חזק ויציב</li>
                <li>• Tailwind CSS לעיצוב מודרני ורספונסיבי</li>
                <li>• Lucide React לאיקונים עדכניים</li>
                <li>• PostgreSQL לשמירת נתונים מאובטחת</li>
                <li>• Node.js עם Express לשרת מהיר ויציב</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Star className="h-6 w-6 text-yellow-500 ml-2" />
                תכונות מיוחדות
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• ממשק משתמש אינטואיטיבי ונגיש</li>
                <li>• תמיכה מלאה בעברית ו-RTL</li>
                <li>• עיצוב רספונסיבי לכל המכשירים</li>
                <li>• אנימציות חלקות וחווית משתמש מעולה</li>
                <li>• גיבוי אוטומטי ושחזור מהיר</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center bg-gradient-to-r from-blue-600 to-purple-700 text-white p-8 rounded-3xl">
        <div className="flex items-center justify-center mb-4">
          <Star className="h-6 w-6 text-yellow-400" />
          <Star className="h-6 w-6 text-yellow-400" />
          <Star className="h-6 w-6 text-yellow-400" />
          <Star className="h-6 w-6 text-yellow-400" />
          <Star className="h-6 w-6 text-yellow-400" />
        </div>
        <h3 className="text-2xl font-bold mb-4">מערכת ברמה מקצועית</h3>
        <p className="text-blue-100 max-w-3xl mx-auto leading-relaxed">
          פותחה במיוחד עבור ארגונים המחפשים פתרון יעיל, מודרני וידידותי למשתמש לניהול מרחבי העבודה שלהם.
          המערכת מתאימה לבתי כנסת בכל גודל ומספקת כלים מתקדמים לארגון מיטבי.
        </p>
        <div className="mt-6 text-sm text-blue-200">
          © 2025 SeatFlow.tech - כל הזכויות שמורות
        </div>
      </div>
    </div>
  );
};

export default About;
