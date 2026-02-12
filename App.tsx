
import React, { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage';
import ChatPage from './components/ChatPage';
import { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('njadi_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('njadi_user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-yellow-500 font-bold animate-pulse">NJADI AI جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden font-sans">
      {!user ? (
        <AuthPage onLogin={handleLogin} />
      ) : (
        <ChatPage user={user} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default App;
