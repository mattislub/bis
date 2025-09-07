import React, { useEffect, useState } from 'react';

const CouponPopup: React.FC = () => {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 10 * 60 * 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        {submitted ? (
          <div className="space-y-4 text-center">
            <h2 className="text-2xl font-semibold">תודה!</h2>
            <p>קופון ההנחה בדרך אליכם במייל</p>
            <button
              onClick={() => setShow(false)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white"
            >
              סגור
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-center text-gray-700">
              השתמשתם במערכת במשך 10 דקות!
              <br />
              קבלו קופון להנחה של 25% (בתוקף ל-3 ימים) – הכניסו את כתובת המייל שלכם.
            </p>
            <label className="block">
              <span className="text-gray-700">כתובת מייל</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShow(false)}
                className="rounded-lg border px-4 py-2"
              >
                ביטול
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-white"
              >
                שלח
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CouponPopup;

