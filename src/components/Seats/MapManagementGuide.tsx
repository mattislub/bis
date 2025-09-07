import React from 'react';
import {
  Plus,
  Minus,
  Grid3X3,
  Settings,
  BoxSelect,
  Hand,
  ListOrdered,
  Save,
  Trash2,
  Lock,
  Unlock,
  RotateCw,
  Copy,
  ArrowRight,
  ArrowDown,
  ArrowDownRight,
  Scissors
} from 'lucide-react';

type IconType = React.ComponentType<{ className?: string }>;

interface Tool {
  icon: IconType;
  extra?: IconType;
  title: string;
  description: string;
}

const mainTools: Tool[] = [
  { icon: Plus, title: 'הוסף ספסל', description: 'יצירת ספסל חדש על המפה.' },
  { icon: Grid3X3, title: 'צור סרגל', description: 'יצירת שורה של ספסלים ביחס לספסל שנבחר.' },
  { icon: Grid3X3, title: 'הצג/הסתר רשת', description: 'הצגת רשת עזר על המפה.' },
  { icon: Settings, title: 'הצמד לרשת', description: 'הצמדת ספסלים לרשת בעת גרירה.' },
  { icon: BoxSelect, title: 'בחירה מרובה', description: 'אפשרות לבחירת מספר ספסלים יחד.' },
  { icon: Hand, title: 'הזזת המפה', description: 'הזזת כל המפה באמצעות גרירה.' },
  { icon: Scissors, title: 'צייר גבול', description: 'שרטוט קו גבול לפיצול המפה לאזורים.' },
  { icon: ListOrdered, title: 'סדר מחדש מספרי מקומות', description: 'ממספר מחדש את מקומות הישיבה.' },
  { icon: Save, title: 'שמור שינויים', description: 'שמירת מצב המפה הנוכחי.' },
  { icon: Trash2, title: 'נקה מפה', description: 'מחיקת כל הספסלים והאלמנטים מהמפה.' }
];

const zoomTools: Tool[] = [
  { icon: Plus, title: 'הגדל מפה', description: 'מגדיל את רמת הזום של התצוגה.' },
  { icon: Minus, title: 'הקטן מפה', description: 'מקטין את רמת הזום של התצוגה.' }
];

const benchTools: Tool[] = [
  {
    icon: Lock,
    extra: Unlock,
    title: 'קבע/שחרר ספסל',
    description: 'מנע או אפשר גרירה של ספסל.'
  },
  {
    icon: RotateCw,
    title: 'סובב ספסל',
    description: 'סיבוב הספסל ב-90°.'
  },
  {
    icon: Copy,
    extra: ArrowRight,
    title: 'העתק אופקי',
    description: 'יצירת עותק של הספסל לצד ימין.'
  },
  {
    icon: Copy,
    extra: ArrowDown,
    title: 'העתק אנכי',
    description: 'יצירת עותק של הספסל למטה.'
  },
  {
    icon: ArrowDownRight,
    title: 'שינוי גודל אלמנט',
    description: 'גרור את הידיות הכחולות כדי לשנות את גודל האלמנט.'
  },
  {
    icon: Trash2,
    title: 'מחק ספסל',
    description: 'הסרת הספסל או האלמנט מהמפה.'
  }
];

const MapManagementGuide: React.FC = () => {
  const renderTool = (tool: Tool, index: number) => {
    const Icon = tool.icon;
    const Extra = tool.extra;
    return (
      <div
        key={index}
        className="flex items-center p-4 bg-white rounded-lg shadow border"
      >
        <div className="flex items-center space-x-2 space-x-reverse">
          <Icon className="h-5 w-5 text-blue-600" />
          {Extra && <Extra className="h-4 w-4 text-blue-600" />}
        </div>
        <div className="mr-4">
          <h3 className="font-semibold text-gray-900">{tool.title}</h3>
          <p className="text-gray-600 text-sm">{tool.description}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">מדריך כלי ניהול המפה</h1>
        <p className="text-gray-600">
          הסבר על כל הכפתורים והאפשרויות במסך ניהול המפה.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">סרגל כלים ראשי</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mainTools.map(renderTool)}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">בקרות זום</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {zoomTools.map(renderTool)}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">כלי ספסל</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {benchTools.map(renderTool)}
        </div>
      </div>
    </div>
  );
};

export default MapManagementGuide;

