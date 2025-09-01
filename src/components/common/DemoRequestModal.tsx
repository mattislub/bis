import React, { useState } from "react";

interface DemoRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DemoRequestModal: React.FC<DemoRequestModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting registration request", { email });
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      console.log("Register request completed", res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Registration failed", res.status, errorText);
        return;
      }
      console.log("Registration succeeded");
      setSent(true);
    } catch (err) {
      console.error("Registration error", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
      <div className="rounded-xl bg-white p-6 shadow-lg w-full max-w-md">
        {sent ? (
          <div className="text-center space-y-4">
            <p>סיסמה נשלחה למייל שלך.</p>
            <button
              onClick={onClose}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white"
            >
              סגור
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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

