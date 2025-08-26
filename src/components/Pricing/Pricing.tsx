import React from 'react';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'חינמי',
    price: '₪0',
    period: 'לתמיד',
    features: ['מערכת דמה לעיצוב מפת בית הכנסת בלבד'],
  },
  {
    name: 'פרו',
    price: '₪1099',
    period: 'לשנה',
    features: [
      'עיצוב מפת בית הכנסת',
      'מדבקות למקומות',
      'קישור למסך הבית הכנסת',
      'ייצוא לקובץ PDF',
      'אין הגבלה על מספר המפות שאפשר לעצב',
      'ניהול מתפללים',
    ],
    note: 'אפשר לחלק את התשלום ל-12 חודשים',
  },
];

const Pricing: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-12 py-16">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">מחירון</h1>
        <p className="text-xl text-gray-600">בחרו את התכנית המתאימה לכם</p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col rounded-2xl border p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl bg-white ${
              plan.name === 'פרו' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
            }`}
          >
            <div className="relative mb-6 text-center">
              {plan.name === 'פרו' && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">
                  הכי פופולרי
                </span>
              )}
              <h2 className="mb-2 text-2xl font-bold text-gray-900">{plan.name}</h2>
              <div className="text-3xl font-extrabold text-blue-600">
                {plan.price}
                <span className="ml-1 text-base font-normal text-gray-600">
                  {plan.period}
                </span>
              </div>
            </div>
            <ul className="flex-1 space-y-2 text-gray-700">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 rtl:space-x-reverse"
                >
                  <Check className="h-5 w-5 flex-shrink-0 text-blue-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            {plan.note && (
              <div className="mt-6 text-center text-sm text-gray-500">
                {plan.note}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pricing;

