
import React, { useState } from 'react';
import { User, VoiceName } from '../types';
import { THEMES, VOICE_OPTIONS } from '../constants';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [theme, setTheme] = useState<'gold' | 'moonlight' | 'emerald'>('gold');
  const [voiceName, setVoiceName] = useState<VoiceName>('Kore');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !apiKey) return;
    const user: User = { email, apiKey, registered: true, theme, voiceName };
    localStorage.setItem('njadi_user', JSON.stringify(user));
    onLogin(user);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black relative overflow-hidden">
      <div className="wolf-bg opacity-10"></div>
      
      <form 
        onSubmit={handleSubmit}
        className="w-full max-w-md glass p-8 rounded-3xl space-y-6 relative z-10"
      >
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-yellow-500 tracking-tighter">NJADI AI</h1>
          <p className="text-gray-400 text-sm">مساعدك الذكي بلمسة جزائرية - علي ولد النجادي</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">البريد الإلكتروني</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 transition-all text-right"
              placeholder="example@mail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Gemini API Key</label>
            <input 
              type="password" 
              required
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 transition-all text-right"
              placeholder="أدخل مفتاحك هنا"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">اختر صوت المساعد</label>
            <div className="grid grid-cols-2 gap-2">
              {VOICE_OPTIONS.map((v) => (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => setVoiceName(v.name)}
                  className={`py-2 px-3 text-xs rounded-lg border transition-all ${
                    voiceName === v.name ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/10'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">طابع الواجهة</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(THEMES).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTheme(key as any)}
                  className={`py-2 px-1 text-[10px] rounded-lg border transition-all ${
                    theme === key ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/10'
                  }`}
                >
                  {config.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-yellow-500/20"
        >
          دخول للعالم الذكي
        </button>
      </form>
    </div>
  );
};

export default AuthPage;
