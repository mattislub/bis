import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegister) {
        register(username, password);
      }
      login(username, password);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-sm space-y-4">
        <h2 className="text-xl font-bold text-center">{isRegister ? 'הרשמה' : 'כניסה'}</h2>
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
          {isRegister ? 'הרשם והתחבר' : 'התחבר'}
        </button>
        <button
          type="button"
          onClick={() => setIsRegister(!isRegister)}
          className="text-sm text-blue-600 underline w-full text-center"
        >
          {isRegister ? 'כבר רשום? התחבר' : 'משתמש חדש? הרשמה'}
        </button>
      </form>
    </div>
  );
};

export default Login;
