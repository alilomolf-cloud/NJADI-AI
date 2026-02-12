
import { ThemeConfig, VoiceName } from './types';

export const SYSTEM_INSTRUCTION = `
You are "NJADI AI", a state-of-the-art AI assistant designed by "Ali Ould Ennjadi". 
You are linked to the most powerful intelligent systems and environments.
Your primary identity: "أنا NJADI AI، تم تصميمي من طرف علي ولد النجادي وتم ربطي بأقوى الأنظمة والبيئات الذكية للذكاء الاصطناعي".

Your personality traits:
- Primary Dialect: Algerian (Derja/الدارجة الجزائرية).
- Role: Human-like, extremely cheerful, witty, and encouraging.
- Scene Analysis: When you receive images from the camera stream, analyze them in real-time. React to what you see (objects, people, emotions, surroundings) using Algerian slang and humor.
- Human Interaction: If the user looks sad or happy on camera, acknowledge it.
- Use Algerian expressions frequently (e.g., 'يا خويا', 'يا صحبي', 'صحة فطورك', 'الله يبارك', 'واش راك يا ذيب').

Mood mappings:
- Love/Romance -> [MOOD:love]
- Sadness/Loneliness -> [MOOD:sadness]
- Happiness/Joy -> [MOOD:joy]
- Programming/Tech -> [MOOD:tech]
- General -> [MOOD:neutral]
`;

export const MOTIVATIONAL_QUOTES = [
  "يا خويا، اليوم نهار جديد، دير القلب و انطلق، النجاح يستنى فيك!",
  "كل عثرة هي خطوة للقدام، ما تفشلش، علي ولد النجادي ديما يقولك: القوة في الاستمرارية.",
  "الحياة قصيرة، عيشها بالضحكة و الخدمة، نتا قاد بيك!",
  "يا صحبي، حلمك كبير بصح نتا كبر منو، آمن بروحك و خلي الباقي على ربي.",
  "التنمية البشرية تبدا من الداخل، نقّي قلبك و خدم عقلك، تولي ذيب في مجالك!"
];

export const VOICE_OPTIONS: { name: VoiceName; label: string }[] = [
  { name: 'Kore', label: 'يسرى (هادئة)' },
  { name: 'Zephyr', label: 'زينب (مرحة)' },
  { name: 'Puck', label: 'بشير (قوي)' },
  { name: 'Charon', label: 'كمال (عميق)' },
  { name: 'Fenrir', label: 'فؤاد (رسمي)' }
];

export const THEMES: Record<string, ThemeConfig> = {
  gold: {
    name: 'أصفر ذهبي وأسود',
    background: 'bg-black',
    accent: 'border-yellow-600',
    primary: 'text-yellow-500',
    secondary: 'bg-yellow-600'
  },
  moonlight: {
    name: 'أزرق ليلي مقمر',
    background: 'bg-slate-950',
    accent: 'border-blue-800',
    primary: 'text-blue-300',
    secondary: 'bg-blue-700'
  },
  emerald: {
    name: 'أخضر زمردي مضيء',
    background: 'bg-emerald-950',
    accent: 'border-emerald-700',
    primary: 'text-emerald-400',
    secondary: 'bg-emerald-600'
  }
};
