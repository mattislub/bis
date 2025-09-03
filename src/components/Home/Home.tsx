import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Armchair, 
  ArrowRight, 
  Users, 
  Zap, 
  Sparkles, 
  CheckCircle, 
  Star,
  Shield,
  Clock,
  Smartphone,
  Globe
} from "lucide-react";
import Logo from "../common/Logo";
import Header from "../common/Header";
import DemoRequestModal from "../common/DemoRequestModal";

const Home: React.FC = () => {
  const features = [
    {
      icon: Users,
      title: "ניהול מתפללים מתקדם",
      description: "מערכת מלאה לניהול פרטי מתפללים וכמות מקומות ישיבה עם מעקב אחר התחייבויות",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Armchair,
      title: "תצוגה ויזואלית אינטואיטיבית",
      description: "הצגה ברורה של כל מקומות הישיבה עם סימון צבעוני וממשק ידידותי למשתמש",
      color: "from-green-500 to-green-600"
    },
    {
      icon: Zap,
      title: "גרור ושחרר פשוט",
      description: "עיצוב פריסת בית הכנסת בקלות עם טכנולוגיית גרור ושחרר מתקדמת",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Shield,
      title: "אבטחה ואמינות",
      description: "שמירת נתונים מאובטחת עם גיבוי אוטומטי ושחזור מהיר",
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: Clock,
      title: "חיסכון בזמן",
      description: "אוטומציה של תהליכים ושיפור יעילות בניהול בית הכנסת",
      color: "from-teal-500 to-teal-600"
    },
    {
      icon: Smartphone,
      title: "נגיש מכל מכשיר",
      description: "עובד בצורה מושלמת על מחשב, טאבלט וסמארטפון",
      color: "from-pink-500 to-pink-600"
    },
  ];

  const stats = [
    { number: "1000+", label: "מקומות ישיבה", icon: Armchair },
    { number: "50+", label: "בתי כנסת", icon: Globe },
    { number: "99.9%", label: "זמינות", icon: Shield },
    { number: "24/7", label: "תמיכה", icon: Clock },
  ];

  const testimonials = [
    {
      name: "רב דוד כהן",
      role: "גבאי בית כנסת 'אהבת שלום'",
      content: "המערכת חסכה לנו שעות רבות בכל שבוע. הניהול הפך להיות פשוט ויעיל.",
      rating: 5
    },
    {
      name: "יוסי לוי",
      role: "מנהל קהילה",
      content: "ממשק נהדר בעברית, קל לשימוש ומתאים בדיוק לצרכים שלנו.",
      rating: 5
    },
    {
      name: "שרה אברהם",
      role: "רכזת אירועים",
      content: "האפשרות לעצב מפות שונות לחגים השונים היא פשוט מדהימה!",
      rating: 5
    }
  ];

  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full">
            <div className="w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse absolute top-20 right-20"></div>
            <div className="w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse absolute bottom-20 left-20 animation-delay-2000"></div>
          </div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-20">
          <div className="text-center space-y-8">
            <div className="flex justify-center mb-8">
              <div className="transform hover:scale-110 transition-transform duration-300">
                <Logo />
              </div>
            </div>
            
            <div className="space-y-6">
              <h1 className="text-6xl md:text-7xl font-black text-gray-900 tracking-tight">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  SeatFlow
                </span>
                <span className="text-gray-900">.tech</span>
              </h1>
              
              <p className="text-2xl md:text-3xl font-bold text-gray-700 max-w-4xl mx-auto">
                ניהול מושבים חכם, פשוט וזורם
              </p>
              
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                המערכת המתקדמת ביותר לניהול מקומות ישיבה בבתי כנסת. 
                עיצוב מפות אינטואיטיבי, ניהול מתפללים מתקדם וכלים חכמים לארגון מושלם.
              </p>
            </div>

            <div className="flex justify-center gap-6 flex-wrap pt-8">
              <Link
                to="/login"
                className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                התחבר למערכת 
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <button
                onClick={() => setShowDemo(true)}
                className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl border-2 border-blue-600 bg-white text-blue-600 text-lg font-bold hover:bg-blue-50 transform hover:-translate-y-1 transition-all duration-300"
              >
                נסה דוגמה 
                <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
              </button>
              
              <Link
                to="/pricing"
                className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 text-white text-lg font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                מחירון
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
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
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              למה לבחור ב-SeatFlow?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              המערכת המתקדמת והידידותית ביותר לניהול מקומות ישיבה
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100"
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
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              מה אומרים עלינו
            </h2>
            <p className="text-xl text-gray-600">
              לקוחות מרוצים מכל רחבי הארץ
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-bold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600 text-sm">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            מוכנים להתחיל?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            הצטרפו לאלפי בתי כנסת שכבר משתמשים במערכת שלנו
          </p>
          <div className="flex justify-center gap-6 flex-wrap">
            <Link
              to="/login"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-blue-600 text-lg font-bold hover:bg-gray-50 transform hover:-translate-y-1 transition-all duration-300 shadow-lg"
            >
              התחל עכשיו
              <ArrowRight className="h-5 w-5" />
            </Link>
            <button
              onClick={() => setShowDemo(true)}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl border-2 border-white text-white text-lg font-bold hover:bg-white hover:text-blue-600 transform hover:-translate-y-1 transition-all duration-300"
            >
              צפה בדמו
              <Sparkles className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Logo />
              </div>
              <p className="text-gray-400 leading-relaxed max-w-md">
                המערכת המתקדמת ביותר לניהול מקומות ישיבה בבתי כנסת. 
                פשוט, יעיל ומתאים לכל גודל קהילה.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">קישורים מהירים</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/pricing" className="hover:text-white transition-colors">מחירון</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">התחברות</Link></li>
                <li><button onClick={() => setShowDemo(true)} className="hover:text-white transition-colors">דמו</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">צור קשר</h3>
              <ul className="space-y-2 text-gray-400">
                <li>info@seatflow.tech</li>
                <li>050-123-4567</li>
                <li>תל אביב, ישראל</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 SeatFlow.tech. כל הזכויות שמורות.
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">תנאי שימוש</a>
              <a href="#" className="hover:text-white transition-colors">מדיניות פרטיות</a>
              <a href="#" className="hover:text-white transition-colors">עזרה</a>
            </div>
          </div>
        </div>
      </footer>

      <DemoRequestModal isOpen={showDemo} onClose={() => setShowDemo(false)} />
    </div>
  );
};

export default Home;