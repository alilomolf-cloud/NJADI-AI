
export type Mood = 'neutral' | 'love' | 'sadness' | 'joy' | 'tech' | 'anger';
export type ChatMode = 'text' | 'voice';
export type VoiceName = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'image' | 'audio' | 'code';
  imageUrl?: string;
  audioUrl?: string;
  mood?: Mood;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastMood: Mood;
  updatedAt: number;
}

export interface User {
  email: string;
  apiKey: string;
  registered: boolean;
  theme: 'gold' | 'moonlight' | 'emerald';
  voiceName: VoiceName;
}

export interface ThemeConfig {
  name: string;
  background: string;
  accent: string;
  primary: string;
  secondary: string;
}
