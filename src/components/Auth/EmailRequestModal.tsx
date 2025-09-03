import React, { useState } from 'react';
import { API_BASE_URL } from '../../api';

interface EmailRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'register' | 'reset';
  onSwitchToReset?: () => void;
}

const EmailRequestModal: React.FC<EmailRequestModalProps> = ({ isOpen, onClose, mode, onSwitchToReset }) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = mode === 'reset' ? '/api/reset' : '/api/register';
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'אירעה שגיאה. נסו שוב.');
        setConflict(mode === 'register' && res.status === 409);
        return;
      }
      setSent(true);
    } catch (err) {
      console.error('Email request error', err);
      setError('אירעה שגיאה. נסו שוב.');
      setConflict(false);
    }
  };

  const titles: Record<typeof mode, string> = {
    register: 'יצירת חשבון',
    reset: 'שחזור סיסמה'
  };

  const successTexts: Record<typeof mode, string> = {
    register: 'פתחנו עבורך חשבון. בדוק את תיבת הדואר שלך כדי לקבל את הסיסמה.',
    reset: 'אם קיים חשבון לכתובת זו, שלחנו סיסמה חדשה למייל.'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
      <div className="rounded-xl bg-white p-6 shadow-lg w-full max-w-md">
        {sent ? (
          <div className="text-center space-y-4">
            <p>{successTexts[mode]}</p>
            <button
              onClick={onClose}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white"
            >
              סגור
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold text-center">{titles[mode]}</h2>
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
                        setEmail('');
                        setError('');
                        setConflict(false);
                      }}
                    >
                      השתמשו בכתובת אחרת
                    </button>
                    <button
                      type="button"
                      className="underline"
                      onClick={() => onSwitchToReset?.()}
                    >
                      שחזרו את הסיסמה
                    </button>
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

export default EmailRequestModal;
