
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Message, User, Mood, ChatMode, ChatSession, VoiceName } from '../types';
import { THEMES, MOTIVATIONAL_QUOTES, SYSTEM_INSTRUCTION, VOICE_OPTIONS } from '../constants';
import { GeminiService, decodeBase64, decodeAudioData } from '../services/gemini';
import { 
  Rocket, Image as ImageIcon, Code, Mic, Copy, Play, 
  LogOut, Sparkles, Square, MessageSquare, Volume2, MicOff,
  Menu, X, Plus, Video, PhoneOff, Trash2, StopCircle, RefreshCw, VolumeX, Settings
} from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface ChatPageProps {
  user: User;
  onLogout: () => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ user, onLogout }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentMood, setCurrentMood] = useState<Mood>('neutral');
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [liveWithCamera, setLiveWithCamera] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>(user.voiceName || 'Kore');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const liveSessionRef = useRef<any>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const liveMediaStreamRef = useRef<MediaStream | null>(null);

  const gemini = useRef(new GeminiService(user.apiKey));
  const theme = THEMES[user.theme];

  useEffect(() => {
    const saved = localStorage.getItem(`njadi_history_${user.email}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setSessions(parsed);
      if (parsed.length > 0) loadSession(parsed[0].id, parsed);
      else createNewChat();
    } else {
      createNewChat();
    }
  }, []);

  useEffect(() => {
    if (currentSessionId) {
      const updatedSessions = sessions.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages, lastMood: currentMood, updatedAt: Date.now() } 
          : s
      );
      localStorage.setItem(`njadi_history_${user.email}`, JSON.stringify(updatedSessions));
    }
  }, [messages, currentMood]);

  const createNewChat = () => {
    const id = Date.now().toString();
    const newSession: ChatSession = {
      id,
      title: 'محادثة جديدة',
      messages: [],
      lastMood: 'neutral',
      updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(id);
    setMessages([]);
    setCurrentMood('neutral');
    setIsSidebarOpen(false);
    
    const welcomeMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `مرحبا بيك يا ذيب! أنا NJADI AI من تصميم علي ولد النجادي. واش نقدر نعاونك اليوم؟`,
      type: 'text',
      timestamp: Date.now(),
      mood: 'joy'
    };
    setMessages([welcomeMsg]);
    setCurrentMood('joy');
  };

  const loadSession = (id: string, currentSessions = sessions) => {
    const session = currentSessions.find(s => s.id === id);
    if (session) {
      setCurrentSessionId(id);
      setMessages(session.messages);
      setCurrentMood(session.lastMood);
      setIsSidebarOpen(false);
    }
  };

  const stopCurrentAudio = () => {
    if (currentAudioSourceRef.current) {
      try { currentAudioSourceRef.current.stop(); } catch (e) {}
      currentAudioSourceRef.current = null;
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'ar-DZ';
      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) setInputText(prev => prev + event.results[i][0].transcript);
          else transcript += event.results[i][0].transcript;
        }
      };
      recognitionRef.current.onerror = () => stopRecording();
    }
  }, []);

  const handleSpeak = async (text: string) => {
    if (!isVoiceEnabled) return;
    stopCurrentAudio();
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      }
      if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
      
      const base64Audio = await gemini.current.textToSpeech(text, selectedVoice);
      if (base64Audio) {
        const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), audioContextRef.current);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.start();
        currentAudioSourceRef.current = source;
      }
    } catch (error) { console.error("Audio error:", error); }
  };

  const extractMood = (text: string): { cleanText: string, mood: Mood } => {
    const moodMatch = text.match(/\[MOOD:(\w+)\]/);
    let mood: Mood = 'neutral';
    if (moodMatch) {
      mood = (['neutral', 'love', 'sadness', 'joy', 'tech', 'anger'].includes(moodMatch[1]) ? moodMatch[1] : 'neutral') as Mood;
    } else {
      const low = text.toLowerCase();
      if (low.includes('حب') || low.includes('قلب')) mood = 'love';
      else if (low.includes('حزن') || low.includes('دموع')) mood = 'sadness';
      else if (low.includes('كود') || low.includes('برمج')) mood = 'tech';
      else if (low.includes('ههه') || low.includes('فرح')) mood = 'joy';
    }
    return { cleanText: text.replace(/\[MOOD:\w+\]/g, '').trim(), mood };
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: inputText, type: 'text', timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    const textToSend = inputText;
    setInputText('');
    setIsTyping(true);
    try {
      const history = messages.slice(-10).map(m => ({ role: m.role === 'user' ? 'user' : 'model' as any, parts: [{ text: m.content }] }));
      if (textToSend.toLowerCase().includes('صورة') || textToSend.toLowerCase().includes('توليد')) {
        const imageUrl = await gemini.current.generateImage(textToSend);
        const aiMsg: Message = { id: (Date.now()+1).toString(), role: 'assistant', content: 'راني ولدتلك الصورة يا ذيب!', type: 'image', imageUrl, timestamp: Date.now(), mood: 'joy' };
        setMessages(prev => [...prev, aiMsg]);
        setCurrentMood('joy');
      } else {
        const responseText = await gemini.current.generateText(textToSend, history);
        const { cleanText, mood } = extractMood(responseText);
        const aiMsg: Message = { id: (Date.now()+1).toString(), role: 'assistant', content: cleanText, type: 'text', timestamp: Date.now(), mood };
        setMessages(prev => [...prev, aiMsg]);
        setCurrentMood(mood);
        handleSpeak(cleanText);
      }
    } catch (error) { console.error(error); } finally { setIsTyping(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = (reader.result as string).split(',')[1];
      const isImage = file.type.startsWith('image/');
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: `تحليل: ${file.name}`, type: isImage?'image':'code', imageUrl: isImage ? reader.result as string : undefined, timestamp: Date.now() }]);
      setIsTyping(true);
      try {
        const analysis = await gemini.current.analyzeImage(isImage ? "حلل هذه الصورة بلهجة جزائرية" : "حلل هذا الكود بلهجة جزائرية", base64Data);
        const { cleanText, mood } = extractMood(analysis);
        setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', content: cleanText, type: 'text', timestamp: Date.now(), mood }]);
        setCurrentMood(mood);
        handleSpeak(cleanText);
      } catch (err) { console.error(err); } finally { setIsTyping(false); }
    };
    reader.readAsDataURL(file);
  };

  const toggleCamera = async () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    if (isLiveOpen && liveWithCamera) {
      if (liveMediaStreamRef.current) {
        liveMediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: { facingMode: nextFacing, width: 640, height: 480 } 
        });
        liveMediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera flip error:", err);
      }
    }
  };

  const startLiveMode = async (withCamera: boolean) => {
    setLiveWithCamera(withCamera);
    setIsLiveOpen(true);
    const ai = new GoogleGenAI({ apiKey: user.apiKey });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: withCamera ? { facingMode, width: 640, height: 480 } : false 
      });
      liveMediaStreamRef.current = stream;
      if (withCamera && videoRef.current) videoRef.current.srcObject = stream;

      const inputAudioCtx = new AudioContext({ sampleRate: 16000 });
      const outputAudioCtx = new AudioContext({ sampleRate: 24000 });
      let nextStartTime = 0;
      const sources = new Set<AudioBufferSourceNode>();

      liveSessionRef.current = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputAudioCtx.createMediaStreamSource(stream);
            const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const base64 = btoa(String.fromCharCode(...new Uint8Array(int16.buffer)));
              liveSessionRef.current?.sendRealtimeInput({ media: { data: base64, mimeType: 'audio/pcm;rate=16000' } });
            };
            source.connect(processor);
            processor.connect(inputAudioCtx.destination);

            if (withCamera) {
              const interval = setInterval(() => {
                if (!canvasRef.current || !videoRef.current) return;
                const ctx = canvasRef.current.getContext('2d');
                ctx?.drawImage(videoRef.current, 0, 0, 320, 240);
                const frameBase64 = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
                liveSessionRef.current?.sendRealtimeInput({ media: { data: frameBase64, mimeType: 'image/jpeg' } });
              }, 1500); // Send frame for scene analysis every 1.5s
              (liveSessionRef.current as any).frameInterval = interval;
            }
          },
          onmessage: async (msg: any) => {
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              nextStartTime = Math.max(nextStartTime, outputAudioCtx.currentTime);
              const buffer = await decodeAudioData(decodeBase64(audioData), outputAudioCtx, 24000);
              const source = outputAudioCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputAudioCtx.destination);
              source.start(nextStartTime);
              nextStartTime += buffer.duration;
              sources.add(source);
            }
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } },
          systemInstruction: SYSTEM_INSTRUCTION
        }
      });
    } catch (err) { console.error(err); setIsLiveOpen(false); }
  };

  const stopLiveMode = () => {
    if (liveSessionRef.current) {
      clearInterval(liveSessionRef.current.frameInterval);
      liveSessionRef.current.close?.();
    }
    if (liveMediaStreamRef.current) liveMediaStreamRef.current.getTracks().forEach(t => t.stop());
    setIsLiveOpen(false);
  };

  const moodStyles = useMemo(() => {
    switch (currentMood) {
      case 'love': return { gradient: 'from-rose-950 via-pink-900 to-black', particles: '❤️' };
      case 'sadness': return { gradient: 'from-blue-950 via-slate-900 to-black', particles: '💧' };
      case 'joy': return { gradient: 'from-yellow-950 via-amber-900 to-black', particles: '✨' };
      case 'tech': return { gradient: 'from-emerald-950 via-green-900 to-black', particles: '⚡' };
      case 'anger': return { gradient: 'from-orange-950 via-red-900 to-black', particles: '🔥' };
      default: return { gradient: 'from-gray-950 via-black to-black', particles: '🐺' };
    }
  }, [currentMood]);

  const startRecording = () => { recognitionRef.current?.start(); setIsRecording(true); };
  const stopRecording = () => { recognitionRef.current?.stop(); setIsRecording(false); };

  return (
    <div className={`fixed inset-0 flex mood-transition text-right overflow-hidden bg-black`} dir="rtl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="particle text-2xl opacity-10" style={{ left: `${Math.random()*100}%`, top: '110%', animationDelay: `${Math.random()*8}s`, animationDuration: `${6+Math.random()*8}s` }}>{moodStyles.particles}</div>
        ))}
      </div>
      <div className={`absolute inset-0 bg-gradient-to-br ${moodStyles.gradient} opacity-50 transition-all duration-1000 z-0`}></div>
      <div className="wolf-bg opacity-[0.05] z-0"></div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 right-0 w-80 glass z-50 transform transition-transform duration-500 ease-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col shadow-2xl`}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-black text-2xl text-yellow-500">سجل الذيب</h3>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all hover:rotate-90"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-4">
          <button onClick={createNewChat} className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-black py-4 rounded-2xl hover:scale-[1.03] active:scale-95 transition-all shadow-xl shadow-yellow-500/30"><Plus className="w-5 h-5" />دردشة جديدة</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {sessions.map(s => (
            <div key={s.id} onClick={() => loadSession(s.id)} className={`group relative w-full p-4 rounded-2xl text-right border transition-all cursor-pointer ${currentSessionId === s.id ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}>
              <div className="font-bold truncate text-sm mb-1">{s.title}</div>
              <button onClick={(e) => { e.stopPropagation(); setSessions(sessions.filter(it => it.id !== s.id)); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col relative z-10">
        <header className="h-20 glass flex items-center justify-between px-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5 shadow-lg"><Menu className="w-6 h-6" /></button>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-yellow-600 to-yellow-400 flex items-center justify-center shadow-2xl rotate-3"><Sparkles className="w-6 h-6 text-black" /></div>
              <div>
                <h2 className="text-xl font-black text-white leading-none">NJADI AI</h2>
                <span className="text-[10px] text-yellow-500/70 font-bold uppercase tracking-widest mt-1 block">ALI OULD ENNJADI</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <button onClick={() => setIsSettingsOpen(true)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 border border-white/5 shadow-lg" title="الإعدادات">
               <Settings className="w-6 h-6" />
             </button>
             <button onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} className={`p-3 rounded-2xl transition-all shadow-lg ${isVoiceEnabled ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' : 'bg-red-500/10 text-red-400 border-red-500/20'} border`} title="تفعيل/تعطيل الصوت التلقائي">
               {isVoiceEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
             </button>
             <button onClick={() => startLiveMode(false)} className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl hover:bg-blue-500/20 border border-blue-500/20 hover:scale-110 shadow-lg"><Mic className="w-6 h-6" /></button>
             <button onClick={() => startLiveMode(true)} className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl hover:bg-emerald-500/20 border border-emerald-500/20 hover:scale-110 shadow-lg"><Video className="w-6 h-6" /></button>
             <button onClick={onLogout} className="p-3 bg-red-500/10 text-red-400 rounded-2xl hover:scale-110 shadow-lg"><LogOut className="w-6 h-6" /></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 flex flex-col custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[70%] rounded-[2.5rem] p-7 shadow-3xl relative group transition-all ${msg.role === 'user' ? 'bg-white/10 text-white rounded-tr-none' : `bg-gradient-to-br from-yellow-500 to-yellow-600 text-black font-bold rounded-tl-none shadow-yellow-500/20`}`}>
                {msg.imageUrl && <img src={msg.imageUrl} className="mb-5 rounded-3xl overflow-hidden border-2 border-black/10 w-full max-h-[400px] object-cover shadow-2xl" />}
                <p className="text-xl leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <div className="mt-5 flex items-center gap-4 pt-4 border-t border-black/5 opacity-50 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => navigator.clipboard.writeText(msg.content)} className="p-2 hover:bg-black/5 rounded-xl transition-all" title="نسخ"><Copy className="w-4 h-4"/></button>
                   {msg.role === 'assistant' && (
                     <>
                      <button onClick={() => handleSpeak(msg.content)} className="p-2 hover:bg-black/5 rounded-xl transition-all" title="استماع"><Play className="w-4 h-4"/></button>
                      <button onClick={stopCurrentAudio} className="p-2 hover:bg-black/5 rounded-xl text-red-900 transition-all" title="توقف"><StopCircle className="w-4 h-4"/></button>
                     </>
                   )}
                   <span className="text-[10px] mr-auto font-black">{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            </div>
          ))}
          {isTyping && <div className="flex justify-start"><div className="glass px-8 py-4 rounded-full flex gap-2 items-center"><div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce [animation-delay:0.2s]"></div><div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce [animation-delay:0.4s]"></div></div></div>}
          <div ref={chatEndRef} className="h-6" />
        </main>

        <footer className="p-6 md:p-8 glass border-t border-white/10 bg-black/60 relative z-40">
          <div className="max-w-5xl mx-auto flex items-center gap-4">
            <button onClick={() => fileInputRef.current?.click()} className="p-5 bg-white/5 rounded-3xl hover:bg-blue-500/20 text-blue-400 border border-white/5 transition-all shadow-xl"><ImageIcon className="w-7 h-7" /></button>
            <div className="flex-1 relative group">
              <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder={isRecording ? "تكلم يا ذيب..." : "اكتب رسالتك هنا..."} className="w-full bg-white/5 border border-white/10 rounded-[1.8rem] px-8 py-5 text-right outline-none focus:border-yellow-500/50 text-xl transition-all" />
            </div>
            <button onClick={isRecording ? stopRecording : startRecording} className={`p-5 rounded-3xl transition-all border ${isRecording ? 'bg-red-600 animate-pulse text-white shadow-red-500/50' : 'bg-white/5 text-red-400 hover:bg-red-500/10'}`}>{isRecording ? <Square className="w-7 h-7" /> : <Mic className="w-7 h-7" />}</button>
            <button onClick={handleSendMessage} disabled={!inputText.trim()} className={`p-5 rounded-3xl shadow-3xl transition-all ${!inputText.trim() ? 'bg-white/5 opacity-50' : 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-black hover:scale-110 active:scale-95'}`}><Rocket className="w-7 h-7" /></button>
          </div>
        </footer>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 text-white text-right">
          <div className="w-full max-w-sm glass p-8 rounded-[2rem] border border-white/10 shadow-3xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-2xl font-black text-yellow-500">إعدادات الصوت</h3>
              <button onClick={() => setIsSettingsOpen(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">اختر الصوت الذي يروق لك:</p>
              <div className="grid grid-cols-1 gap-2">
                {VOICE_OPTIONS.map(v => (
                  <button 
                    key={v.name} 
                    onClick={() => { setSelectedVoice(v.name); handleSpeak("بصحتك يا خويا، هادا هو صوتي الجديد"); }} 
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${selectedVoice === v.name ? 'border-yellow-500 bg-yellow-500/20' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                  >
                    <span>{v.label}</span>
                    {selectedVoice === v.name && <Volume2 className="w-4 h-4 text-yellow-500" />}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setIsSettingsOpen(false)} className="w-full py-3 bg-yellow-500 text-black font-black rounded-xl shadow-xl">حفظ الإعدادات</button>
          </div>
        </div>
      )}

      {/* Live Overlay */}
      {isLiveOpen && (
        <div className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
          <div className="absolute top-10 right-10 flex items-center gap-3 bg-red-600 px-6 py-3 rounded-full animate-pulse shadow-3xl"><div className="w-3 h-3 bg-white rounded-full"></div><span className="font-black text-white">بث حي - تحليل المشهد</span></div>
          <div className="absolute top-10 left-10 flex gap-4">
            <button onClick={toggleCamera} className="p-5 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 group backdrop-blur-md"><RefreshCw className="w-8 h-8 group-hover:rotate-180 transition-transform duration-700" /></button>
            <button onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} className="p-5 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 backdrop-blur-md">
              {isVoiceEnabled ? <Volume2 className="w-8 h-8" /> : <VolumeX className="w-8 h-8" />}
            </button>
          </div>
          <div className="relative w-full max-w-3xl aspect-video rounded-[3rem] overflow-hidden bg-white/5 border border-white/10 shadow-3xl flex items-center justify-center mb-16">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
            {liveWithCamera ? (
              <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover filter brightness-110 contrast-110 ${facingMode==='user'?'scale-x-[-1]':''}`} />
            ) : (
              <div className="flex flex-col items-center gap-10">
                 <div className="w-40 h-40 rounded-full bg-yellow-500/20 flex items-center justify-center animate-ping absolute"></div>
                 <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-yellow-600 to-yellow-400 flex items-center justify-center relative z-20 shadow-3xl"><Volume2 className="w-16 h-16 text-black animate-pulse" /></div>
                 <p className="text-3xl font-black text-yellow-500">نجادي يسمع فيك...</p>
              </div>
            )}
            <canvas ref={canvasRef} width="320" height="240" className="hidden" />
          </div>
          <button onClick={stopLiveMode} className="flex items-center gap-4 bg-gradient-to-r from-red-700 to-red-500 text-white px-12 py-6 rounded-[2.5rem] font-black text-2xl hover:scale-110 active:scale-95 transition-all shadow-3xl shadow-red-600/40"><PhoneOff className="w-8 h-8" />إنهاء البث</button>
        </div>
      )}

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
    </div>
  );
};

export default ChatPage;
