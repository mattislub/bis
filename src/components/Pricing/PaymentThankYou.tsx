import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../api';
import {
  CheckCircle,
  Mail,
  ArrowLeft,
  Sparkles,
  Crown,
  Users,
  Map,
  Monitor,
  Shield,
  Zap
} from 'lucide-react';
import Logo from '../common/Logo';

export default function PaymentThankYou() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const { user, updateUser } = useAuth();

  useEffect(() => {
    const refreshRole = async () => {
      if (!user?.email) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(user.email)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.role && data.role !== user.role) {
          updateUser({ role: data.role });
        }
      } catch (err) {
        console.error('Failed to refresh user role', err);
      }
    };
    refreshRole();
  }, [user, updateUser]);

  const proFeatures = [
    {
      icon: Map,
      title: 'עיצוב מפות ללא הגבלה',
      description: 'צור כמה מפות שתרצה לחגים שונים ואירועים מיוחדים',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Monitor,
      title: 'קישור למסך תצוגה',
      description: 'הצג את המפה על מסך גדול בבית הכנסת בצורה מקצועית',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Users,
      title: 'ניהול מתפללים מתקדם',
      description: 'כלים מתקדמים לניהול רשימות, התחייבויות ועליות לתורה',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Shield,
      title: 'גיבוי אוטומטי',
      description: 'כל הנתונים שלך מגובים באופן אוטומטי ובטוח',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: Zap,
      title: 'תמיכה מהירה',
      description: 'קבל תמיכה טכנית מהירה ומקצועית בכל עת',
      color: 'from-teal-500 to-teal-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50" dir="rtl">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Success Card */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-12 text-center relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-green-600/20"></div>
              <div className="relative z-10">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <h1 className="text-4xl font-black text-white mb-4">
                  🎉 תודה על הרכישה!
                </h1>
                <p className="text-green-100 text-xl">
                  החבילה הפרו שלך מופעלת ומוכנה לשימוש
                </p>
                {orderId && (
                  <div className="mt-4 inline-block bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                    <span className="text-green-100 text-sm">מספר הזמנה: </span>
                    <span className="text-white font-mono font-bold">{orderId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
              {/* Welcome Message */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <Crown className="h-8 w-8 text-yellow-500 ml-2" />
                  <h2 className="text-3xl font-bold text-gray-900">ברוכים הבאים לחבילה הפרו!</h2>
                </div>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
                  עכשיו יש לך גישה לכל התכונות המתקדמות של המערכת. 
                  שלחנו אליך מייל עם פרטי ההתחברות החדשים.
                </p>
              </div>

              {/* Email Notice */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-blue-600 ml-3" />
                  <h3 className="text-xl font-bold text-gray-900">בדוק את תיבת המייל שלך</h3>
                </div>
                <p className="text-gray-700 text-center">
                  שלחנו אליך מייל עם סיסמת התחברות חדשה וכל הפרטים הנדרשים להתחלה.
                  אם לא רואה את המייל, בדוק גם בתיקיית הספאם.
                </p>
              </div>

              {/* Pro Features */}
              <div>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    מה זמין לך עכשיו בחבילה הפרו:
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {proFeatures.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={index}
                        className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group hover:-translate-y-1"
                      >
                        <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl mb-4 group-hover:scale-110 transition-transform`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">{feature.title}</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                <Link
                  to="/login"
                  className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-green-600 to-green-700 text-white text-lg font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                  התחבר לחשבון הפרו שלך
                  <ArrowLeft className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <Link
                  to="/"
                  className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl border-2 border-gray-300 bg-white text-gray-700 text-lg font-bold hover:bg-gray-50 transform hover:-translate-y-1 transition-all duration-300"
                >
                  חזור לעמוד הבית
                  <ArrowLeft className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Support Section */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 text-center border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-2">צריך עזרה?</h4>
                <p className="text-gray-600 mb-4">
                  כלקוח פרו, אתה זכאי לתמיכה מהירה ומקצועית
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm">
                  <a 
                    href="mailto:info@seatflow.online" 
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Mail className="h-4 w-4" />
                    info@seatflow.online
                  </a>
                  <span className="hidden sm:block text-gray-400">|</span>
                  <a 
                    href="tel:052-718-6026" 
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    📞 052-718-6026
                  </a>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-8 py-6 text-center border-t border-gray-200">
              <div className="flex justify-center mb-4">
                <Logo />
              </div>
              <p className="text-gray-500 text-sm">
                © 2025 SeatFlow.tech - כל הזכויות שמורות | ניהול מושבים חכם, פשוט וזורם
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

