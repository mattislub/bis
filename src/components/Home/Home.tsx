import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Armchair, ArrowRight, Users, Zap, Sparkles } from "lucide-react";
import Logo from "../common/Logo";
import Header from "../common/Header";
import DemoRequestModal from "../common/DemoRequestModal";

const Home: React.FC = () => {
  const features = [
    {
      icon: Users,
      title: "ניהול מתפללים מתקדם",
      description: "מערכת מלאה לניהול פרטי מתפללים וכמות מקומות ישיבה",
    },
    {
      icon: Armchair,
      title: "תצוגה ויזואלית אינטואיטיבית",
      description: "הצגה ברורה של כל מקומות הישיבה עם סימון צבעוני וידידותי למשתמש",
    },
    {
      icon: Zap,
      title: "גרור ושחרר פשוט",
      description: "עיצוב פריסת בית הכנסת/הישיבה בקלות עם טכנולוגיית גרור ושחרר מתקדמת",
    },
  ];

  const advantages = [
    {
      title: "התאמה אישית מלאה",
      description:
        "התאם את המערכת לצרכים המדויקים של הקהילה שלך: שמות, סידור מקומות ושכבות שונות במפה.",
    },
    {
      title: "ידידותיות למשתמש",
      description:
        "ממשק פשוט וברור, מתאים לכל אחד – ללא צורך בהדרכה מקדימה.",
    },
    {
      title: "גמישות וחיסכון בזמן",
      description:
        "שינויים ועריכות מתבצעים בקלות ובמהירות, כך שתמיד תישארו עדכניים.",
    },
  ];

  const [showDemo, setShowDemo] = useState(false);

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-blue-50 via-indigo-50 to-white pb-20"
      dir="rtl"
    >
      <Header />
      <div className="max-w-7xl mx-auto px-4 space-y-24 pt-12">
        {/* Hero */}
        <section className="text-center space-y-8">
          <div className="flex justify-center drop-shadow-md animate-bounce">
            <Logo />
          </div>
          <h1
            className="text-5xl font-extrabold text-gray-900 tracking-tight opacity-0 animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            SeatFlow.tech
          </h1>
          <p
            className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed opacity-0 animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            ניהול מושבים חכם, פשוט וזורם
          </p>
          <p
            className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed opacity-0 animate-fade-in-up"
            style={{ animationDelay: "300ms" }}
          >
            ברוכים הבאים! מערכת מקיפה לניהול מקומות ישיבה בבתי כנסת/ישיבות ובחללי עבודה, עם כלי גרירה ושחרור, ניהול מתפללים ומפה אינטואיטיבית בעברית מלאה.
          </p>

          <div
            className="flex justify-center gap-4 flex-wrap opacity-0 animate-fade-in-up"
            style={{ animationDelay: "400ms" }}
          >
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-blue-600 text-white text-lg font-semibold shadow-sm hover:bg-blue-700 transition"
            >
              התחבר למערכת <ArrowRight className="h-5 w-5" />
            </Link>
            <button
              onClick={() => setShowDemo(true)}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl border border-blue-600 bg-white text-blue-600 text-lg font-semibold hover:bg-blue-50 transition"
            >
              נסה דוגמה <Sparkles className="h-5 w-5" />
            </button>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl border border-blue-600 bg-white text-blue-600 text-lg font-semibold hover:bg-blue-50 transition"
            >
              מחירון
            </Link>
          </div>
        </section>

        {/* Features */}
        <section>
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-14">
            למה לבחור במערכת שלנו?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="flex flex-col items-center text-center rounded-2xl bg-white p-8 shadow-md hover:shadow-xl transition transform hover:-translate-y-1 opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Advantages */}
        <section
          className="rounded-3xl bg-white p-10 shadow-md opacity-0 animate-fade-in-up"
          style={{ animationDelay: "100ms" }}
        >
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">
            יתרונות המערכת
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
            {advantages.map((adv, i) => (
              <div
                key={i}
                className="p-4 opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="text-xl font-semibold text-blue-600 mb-2">
                  {adv.title}
                </div>
                <div className="text-gray-700 leading-relaxed">
                  {adv.description}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <DemoRequestModal isOpen={showDemo} onClose={() => setShowDemo(false)} />
    </div>
  );
};

export default Home;
