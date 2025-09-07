import React, { useState } from "react";
import { API_BASE_URL } from "../../api";

interface DemoRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DemoRequestModal: React.FC<DemoRequestModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting registration request", { email });
    try {
      const res = await fetch(`${API_BASE_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      console.log("Register request completed", res.status);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "אירעה שגיאה. נסו שוב.");
        setConflict(res.status === 409);
        return;
      }
      console.log("Registration succeeded");
      setSent(true);
    } catch (err) {
      console.error("Registration error", err);
      setError("אירעה שגיאה. נסו שוב.");
      setConflict(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
      <div className="rounded-xl bg-white p-6 shadow-lg w-full max-w-md">
        {sent ? (
          <div className="space-y-6 text-center">
            <h2 className="text-2xl font-semibold">תודה שנרשמת!</h2>
            <p>
              המערכת פתחה עבורך חשבון באופן אוטומטי.
              <br />
              שם המשתמש שלך הוא כתובת המייל שסיפקת, ובתיבת הדואר האלקטרוני שלך
              מחכה לך סיסמה זמנית לכניסה לחשבון.
            </p>
            <div className="space-y-2">
              <p className="text-lg font-medium">✨ מה מחכה לך עכשיו במערכת?</p>
              <ul className="space-y-1 text-right">
                <li>
                  🏛️ עיצוב מפת בית הכנסת – צור והתאם את מפת המושבים בצורה
                  פשוטה ונוחה.
                </li>
                <li>
                  👥 ניהול רשימת המתפללים – הוסף, עדכן ונהל את כל המתפללים במקום
                  אחד.
                </li>
              </ul>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white"
            >
              סגור
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-center text-gray-700">
              הכניסו את כתובת המייל שלכם, ונשלח אליכם במייל פרטי חשבון ה-דמו שלכם
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
            {error && (
              <div className="text-center text-sm text-red-600 space-y-2">
                <p>{error}</p>
                {conflict && (
                  <div className="flex justify-center gap-4">
                    <button
                      type="button"
                      className="underline"
                      onClick={() => {
                        setEmail("");
                        setError("");
                        setConflict(false);
                      }}
                    >
                      השתמשו בכתובת אחרת
                    </button>
                    <a href="#/login" className="underline">
                      שחזרו את הסיסמה
                    </a>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
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

export default DemoRequestModal;

