import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import EmailRequestModal from './EmailRequestModal';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      login(username, password);
      navigate('/app');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-sm space-y-4">
        <h2 className="text-xl font-bold text-center">כניסה</h2>
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <input
          type="text"
          placeholder="שם משתמש"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="סיסמה"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
          התחבר
        </button>
        <button
          type="button"
          onClick={() => setShowReset(true)}
          className="text-sm text-blue-600 underline w-full text-center"
        >
          שכחת סיסמה?
        </button>
        <button
          type="button"
          onClick={() => setShowRegister(true)}
          className="text-sm text-blue-600 underline w-full text-center"
        >
          יצירת חשבון
        </button>
      </form>
      <EmailRequestModal
        isOpen={showReset}
        onClose={() => setShowReset(false)}
        mode="reset"
      />
      <EmailRequestModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        mode="register"
      />
    </div>
  );
};

export default Login;
