import React from 'react';
import { 
  Armchair, 
  Users, 
  Zap, 
  Shield, 
  Heart, 
  Target,
  CheckCircle,
  Star
} from 'lucide-react';

const About: React.FC = () => {
  const features = [
    {
      icon: Users,
      title: 'ניהול מתפללים מתקדם',
      description: 'מערכת מלאה לניהול פרטי מתפללים וכמות מקומות ישיבה'
    },
    {
      icon: Armchair,
      title: 'תצוגה ויזואלית אינטואיטיבית',
      description: 'הצגה ברורה של כל מקומות הישיבה עם סימון צבעוני וידידותי למשתמש'
    },
    {
      icon: Zap,
      title: 'גרור ושחרר פשוט',
      description: 'עיצוב פריסת המשרד בקלות עם טכנולוגיית גרור ושחרר מתקדמת'
    },
    {
      icon: Shield,
      title: 'שמירת נתונים מקומית',
      description: 'כל הנתונים נשמרים במחשב שלך ללא צורך בחיבור לאינטרנט'
    }
  ];

  const benefits = [
    'חיסכון בזמן וניהול יעיל של משאבי המשרד',
    'שיפור הארגון והסידור במרחב העבודה',
    'קלות בשינוי פריסות ובהתאמה לצרכים משתנים',
    'ממשק ידידותי למשתמש בעברית מלאה',
    'תצוגה ויזואלית ברורה של כל המידע',
    'גישה מהירה לפרטי כל מתפלל ומקום ישיבה'
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="p-4 bg-blue-100 rounded-full">
            <Armchair className="h-12 w-12 text-blue-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">אודות מערכת ניהול מקומות הישיבה</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          מערכת מתקדמת וידידותית למשתמש המיועדת לניהול יעיל של מקומות ישיבה במשרדים, 
          חללי עבודה משותפים ומרחבים ארגוניים
        </p>
      </div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-lg">
          <div className="flex items-center mb-4">
            <Target className="h-8 w-8 text-blue-600 ml-3" />
            <h2 className="text-2xl font-bold text-gray-900">המשימה שלנו</h2>
          </div>
          <p className="text-gray-700 leading-relaxed">
            לפשט ולייעל את ניהול מרחבי העבודה באמצעות כלים טכנולוגיים מתקדמים, 
            תוך מתן מענה לצרכים המשתנים של ארגונים מודרניים ושיפור חווית העבודה של העובדים.
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-8 rounded-lg">
          <div className="flex items-center mb-4">
            <Heart className="h-8 w-8 text-green-600 ml-3" />
            <h2 className="text-2xl font-bold text-gray-900">הערכים שלנו</h2>
          </div>
          <p className="text-gray-700 leading-relaxed">
            אנו מאמינים בפשטות, יעילות וחדשנות. המערכת שלנו מיועדת להיות נגישה לכולם, 
            עם דגש על ממשק בעברית, עיצוב אינטואיטיבי וחווית משתמש מעולה.
          </p>
        </div>
      </div>

      {/* Features */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">התכונות העיקריות</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border">
                <div className="flex items-start space-x-4 space-x-reverse">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">היתרונות שתקבלו</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center space-x-3 space-x-reverse">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span className="text-gray-700">{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-8">המערכת במספרים</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold mb-2">100+</div>
            <div className="text-blue-200">מקומות ישיבה ניתנים לניהול</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">5</div>
            <div className="text-blue-200">מודולים עיקריים במערכת</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">100%</div>
            <div className="text-blue-200">תמיכה בעברית ו-RTL</div>
          </div>
        </div>
      </div>

      {/* Technology */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">הטכנולוגיה שלנו</h2>
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">טכנולוגיות מתקדמות</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• React 18 עם TypeScript למבנה חזק ויציב</li>
                <li>• Tailwind CSS לעיצוב מודרני ורספונסיבי</li>
                <li>• Lucide React לאיקונים עדכניים</li>
                <li>• Local Storage לשמירת נתונים מקומית</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">תכונות מיוחדות</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• ממשק משתמש אינטואיטיבי ונגיש</li>
                <li>• תמיכה מלאה בעברית ו-RTL</li>
                <li>• עיצוב רספונסיבי לכל המכשירים</li>
                <li>• אנימציות חלקות וחווית משתמש מעולה</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center bg-gray-50 p-8 rounded-lg">
        <div className="flex items-center justify-center mb-4">
          <Star className="h-6 w-6 text-yellow-500" />
          <Star className="h-6 w-6 text-yellow-500" />
          <Star className="h-6 w-6 text-yellow-500" />
          <Star className="h-6 w-6 text-yellow-500" />
          <Star className="h-6 w-6 text-yellow-500" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">מערכת ברמה מקצועית</h3>
        <p className="text-gray-600 max-w-2xl mx-auto">
          פותח במיוחד עבור ארגונים המחפשים פתרון יעיל, מודרני וידידותי למשתמש לניהול מרחבי העבודה שלהם.
          המערכת מתאימה למשרדים בכל גודל ומספקת כלים מתקדמים לארגון מיטבי.
        </p>
      </div>
    </div>
  );
};

export default About;
