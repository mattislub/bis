import React from 'react';

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
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">מחירון</h1>
        <p className="text-xl text-gray-600">בחרו את התכנית המתאימה לכם</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className="bg-white p-8 rounded-lg shadow-md border flex flex-col"
          >
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h2>
              <div className="text-3xl font-extrabold text-blue-600">
                {plan.price}
                <span className="text-base font-normal text-gray-600 ml-1">
                  {plan.period}
                </span>
              </div>
            </div>
            <ul className="space-y-2 text-gray-700 flex-1">
              {plan.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
            {plan.note && (
              <div className="mt-6 text-sm text-gray-500 text-center">
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

