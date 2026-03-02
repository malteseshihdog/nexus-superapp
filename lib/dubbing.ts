import { Platform } from "react-native";
import * as Speech from "expo-speech";
import type { Language } from "@/constants/peepData";

export interface SpeechSegment {
  id: string;
  speaker: "me" | "them";
  detectedLang: Language;
  originalText: string;
  translatedText: string;
  timestamp: number;
}

const SPEECH_SAMPLE_PHRASES: Record<string, string[]> = {
  en: [
    "Hello, how are you doing today?",
    "Can you hear me clearly?",
    "The weather is really nice today.",
    "Let me share some important news with you.",
    "What do you think about this idea?",
    "I agree with what you said earlier.",
    "That sounds like a great plan.",
    "Let's schedule a meeting for tomorrow.",
    "Thank you for your time.",
    "I'll get back to you on that.",
  ],
  ar: [
    "مرحباً، كيف حالك اليوم؟",
    "هل تسمعني بوضوح؟",
    "الطقس جميل جداً اليوم.",
    "دعني أشارك معك بعض الأخبار المهمة.",
    "ما رأيك في هذه الفكرة؟",
    "أنا أتفق مع ما قلته سابقاً.",
    "يبدو هذا خطة رائعة.",
    "لنحدد موعداً للاجتماع غداً.",
    "شكراً جزيلاً على وقتك.",
    "سأعود إليك بخصوص ذلك.",
  ],
  fa: [
    "سلام، امروز چطورید؟",
    "آیا صدای من واضح است؟",
    "امروز هوا خیلی خوب است.",
    "بگذارید یک خبر مهم با شما در میان بگذارم.",
    "نظرتان درباره این ایده چیست؟",
    "با آنچه قبلاً گفتید موافقم.",
    "این یک طرح عالی به نظر می‌رسد.",
    "بیایید فردا یک جلسه برنامه‌ریزی کنیم.",
    "ممنون از وقتتان.",
    "در این مورد با شما تماس خواهم گرفت.",
  ],
  ur: [
    "ہیلو، آج آپ کیسے ہیں؟",
    "کیا آپ مجھے واضح سن سکتے ہیں؟",
    "آج موسم بہت اچھا ہے۔",
    "میں آپ کے ساتھ ایک اہم خبر شیئر کرتا ہوں۔",
    "آپ اس خیال کے بارے میں کیا سوچتے ہیں؟",
    "میں آپ سے اتفاق کرتا ہوں۔",
    "یہ ایک بہترین منصوبہ لگتا ہے۔",
    "کل ایک میٹنگ شیڈول کریں۔",
    "آپ کے وقت کا شکریہ۔",
    "میں آپ کو اس بارے میں جواب دوں گا۔",
  ],
  fr: [
    "Bonjour, comment allez-vous aujourd'hui ?",
    "Est-ce que vous m'entendez clairement ?",
    "Il fait vraiment beau aujourd'hui.",
    "Laissez-moi partager une nouvelle importante avec vous.",
    "Qu'est-ce que vous pensez de cette idée ?",
    "Je suis d'accord avec ce que vous avez dit.",
    "Ça semble être un excellent plan.",
    "Planifions une réunion pour demain.",
    "Merci pour votre temps.",
    "Je vous répondrai à ce sujet.",
  ],
  es: [
    "Hola, ¿cómo estás hoy?",
    "¿Puedes escucharme con claridad?",
    "El clima está muy bien hoy.",
    "Déjame compartir una noticia importante contigo.",
    "¿Qué piensas de esta idea?",
    "Estoy de acuerdo con lo que dijiste.",
    "Suena como un gran plan.",
    "Programemos una reunión para mañana.",
    "Gracias por tu tiempo.",
    "Te responderé sobre eso.",
  ],
  de: [
    "Hallo, wie geht es Ihnen heute?",
    "Können Sie mich deutlich hören?",
    "Das Wetter ist heute wirklich schön.",
    "Lassen Sie mich eine wichtige Neuigkeit teilen.",
    "Was denken Sie über diese Idee?",
    "Ich stimme dem zu, was Sie gesagt haben.",
    "Das klingt nach einem großartigen Plan.",
    "Planen wir ein Meeting für morgen.",
    "Vielen Dank für Ihre Zeit.",
    "Ich werde mich dazu bei Ihnen melden.",
  ],
  zh: [
    "你好，你今天怎么样？",
    "你能清楚地听到我吗？",
    "今天天气真的很好。",
    "让我和你分享一些重要的消息。",
    "你对这个想法有什么看法？",
    "我同意你之前说的话。",
    "听起来是个很好的计划。",
    "我们明天安排一个会议吧。",
    "感谢你的时间。",
    "我会就此回复你的。",
  ],
  tr: [
    "Merhaba, bugün nasılsınız?",
    "Beni net duyabiliyor musunuz?",
    "Bugün hava gerçekten güzel.",
    "Sizinle önemli bir haber paylaşayım.",
    "Bu fikir hakkında ne düşünüyorsunuz?",
    "Daha önce söylediklerinize katılıyorum.",
    "Bu harika bir plan gibi görünüyor.",
    "Yarın için bir toplantı planlayalım.",
    "Vaktiniz için teşekkür ederim.",
    "Bu konuda size geri döneceğim.",
  ],
  ru: [
    "Привет, как вы сегодня?",
    "Вы меня хорошо слышите?",
    "Сегодня очень хорошая погода.",
    "Позвольте поделиться важной новостью.",
    "Что вы думаете об этой идее?",
    "Я согласен с тем, что вы сказали.",
    "Это звучит как отличный план.",
    "Давайте запланируем встречу на завтра.",
    "Спасибо за ваше время.",
    "Я вернусь к вам по этому вопросу.",
  ],
  ja: [
    "こんにちは、今日はいかがですか？",
    "はっきり聞こえますか？",
    "今日は本当に良い天気ですね。",
    "重要なニュースをお伝えします。",
    "このアイデアについてどう思いますか？",
    "おっしゃったことに同意します。",
    "それは素晴らしい計画のようです。",
    "明日の会議をスケジュールしましょう。",
    "お時間ありがとうございます。",
    "その件についてご連絡します。",
  ],
  ko: [
    "안녕하세요, 오늘 어떠세요?",
    "잘 들리시나요?",
    "오늘 날씨가 정말 좋네요.",
    "중요한 소식을 전해드리겠습니다.",
    "이 아이디어에 대해 어떻게 생각하세요?",
    "말씀하신 내용에 동의합니다.",
    "훌륭한 계획인 것 같습니다.",
    "내일 회의를 일정에 잡겠습니다.",
    "시간 내주셔서 감사합니다.",
    "그 건으로 다시 연락드리겠습니다.",
  ],
};

const TRANSLATION_MAP: Record<string, Record<string, string>> = {
  "Hello, how are you doing today?": {
    ar: "مرحباً، كيف حالك اليوم؟",
    fa: "سلام، امروز چطورید؟",
    ur: "ہیلو، آج آپ کیسے ہیں؟",
    fr: "Bonjour, comment allez-vous aujourd'hui ?",
    es: "Hola, ¿cómo estás hoy?",
    de: "Hallo, wie geht es Ihnen heute?",
    zh: "你好，你今天怎么样？",
    tr: "Merhaba, bugün nasılsınız?",
    ru: "Привет, как вы сегодня?",
    ja: "こんにちは、今日はいかがですか？",
    ko: "안녕하세요, 오늘 어떠세요?",
  },
  "مرحباً، كيف حالك اليوم؟": {
    en: "Hello, how are you doing today?",
    fa: "سلام، امروز چطورید؟",
    fr: "Bonjour, comment allez-vous aujourd'hui ?",
    es: "Hola, ¿cómo estás hoy?",
    de: "Hallo, wie geht es Ihnen heute?",
    zh: "你好，你今天怎么样？",
    tr: "Merhaba, bugün nasılsınız?",
    ru: "Привет, как вы сегодня?",
  },
  "Can you hear me clearly?": {
    ar: "هل تسمعني بوضوح؟",
    fa: "آیا صدای من واضح است؟",
    fr: "Est-ce que vous m'entendez clairement ?",
    es: "¿Puedes escucharme con claridad?",
    de: "Können Sie mich deutlich hören?",
    zh: "你能清楚地听到我吗？",
    tr: "Beni net duyabiliyor musunuz?",
    ru: "Вы меня хорошо слышите?",
    ja: "はっきり聞こえますか？",
    ko: "잘 들리시나요?",
  },
  "The weather is really nice today.": {
    ar: "الطقس جميل جداً اليوم.",
    fa: "امروز هوا خیلی خوب است.",
    fr: "Il fait vraiment beau aujourd'hui.",
    es: "El clima está muy bien hoy.",
    de: "Das Wetter ist heute wirklich schön.",
    zh: "今天天气真的很好。",
    tr: "Bugün hava gerçekten güzel.",
    ru: "Сегодня очень хорошая погода.",
    ja: "今日は本当に良い天気ですね。",
    ko: "오늘 날씨가 정말 좋네요.",
  },
  "What do you think about this idea?": {
    ar: "ما رأيك في هذه الفكرة؟",
    fa: "نظرتان درباره این ایده چیست؟",
    fr: "Qu'est-ce que vous pensez de cette idée ?",
    es: "¿Qué piensas de esta idea?",
    de: "Was denken Sie über diese Idee?",
    zh: "你对这个想法有什么看法？",
    tr: "Bu fikir hakkında ne düşünüyorsunuz?",
    ru: "Что вы думаете об этой идее?",
    ja: "このアイデアについてどう思いますか？",
    ko: "이 아이디어에 대해 어떻게 생각하세요?",
  },
  "That sounds like a great plan.": {
    ar: "يبدو هذا خطة رائعة.",
    fa: "این یک طرح عالی به نظر می‌رسد.",
    fr: "Ça semble être un excellent plan.",
    es: "Suena como un gran plan.",
    de: "Das klingt nach einem großartigen Plan.",
    zh: "听起来是个很好的计划。",
    tr: "Bu harika bir plan gibi görünüyor.",
    ru: "Это звучит как отличный план.",
    ja: "それは素晴らしい計画のようです。",
    ko: "훌륭한 계획인 것 같습니다.",
  },
  "Thank you for your time.": {
    ar: "شكراً جزيلاً على وقتك.",
    fa: "ممنون از وقتتان.",
    fr: "Merci pour votre temps.",
    es: "Gracias por tu tiempo.",
    de: "Vielen Dank für Ihre Zeit.",
    zh: "感谢你的时间。",
    tr: "Vaktiniz için teşekkür ederim.",
    ru: "Спасибо за ваше время.",
    ja: "お時間ありがとうございます。",
    ko: "시간 내주셔서 감사합니다.",
  },
};

export function detectLanguage(text: string): string {
  const arabicPattern = /[\u0600-\u06FF]/;
  const chinesePattern = /[\u4E00-\u9FFF]/;
  const japanesePattern = /[\u3040-\u30FF]/;
  const koreanPattern = /[\uAC00-\uD7AF]/;
  const cyrillicPattern = /[\u0400-\u04FF]/;
  const devanagariPattern = /[\u0900-\u097F]/;
  const georgianPattern = /[\u10A0-\u10FF]/;
  const armenianPattern = /[\u0530-\u058F]/;
  const thaiPattern = /[\u0E00-\u0E7F]/;

  if (arabicPattern.test(text)) {
    if (/[\u0600-\u06FF]{2,}/.test(text)) {
      const persianChars = /[پچژگ]/.test(text);
      if (persianChars) return "fa";
      return "ar";
    }
    return "ar";
  }
  if (chinesePattern.test(text)) return "zh";
  if (japanesePattern.test(text)) return "ja";
  if (koreanPattern.test(text)) return "ko";
  if (cyrillicPattern.test(text)) return "ru";
  if (devanagariPattern.test(text)) return "hi";
  if (georgianPattern.test(text)) return "ka";
  if (armenianPattern.test(text)) return "hy";
  if (thaiPattern.test(text)) return "th";
  return "en";
}

export function translateText(text: string, targetLang: string): string {
  if (targetLang === detectLanguage(text)) return text;
  const knownTranslation = TRANSLATION_MAP[text]?.[targetLang];
  if (knownTranslation) return knownTranslation;
  const lang = targetLang;
  const prefixes: Record<string, string> = {
    ar: "عربي: ", fa: "فارسی: ", ur: "اردو: ",
    "ku-kmr": "[کوردی] ", "ku-ckb": "[کوردی] ",
    fr: "[FR] ", de: "[DE] ", es: "[ES] ", zh: "[中文] ",
    ru: "[RU] ", ja: "[JA] ", ko: "[KO] ", tr: "[TR] ",
    pt: "[PT] ", hi: "[HI] ", it: "[IT] ", nl: "[NL] ",
    pl: "[PL] ", sv: "[SV] ", id: "[ID] ", vi: "[VI] ",
    th: "[TH] ", ms: "[MS] ", bn: "[BN] ", ta: "[TA] ",
    uk: "[UK] ", ro: "[RO] ", cs: "[CS] ", he: "[HE] ",
    sw: "[SW] ", am: "[AM] ", pa: "[PA] ", gu: "[GU] ",
    mr: "[MR] ", te: "[TE] ", kn: "[KN] ", ml: "[ML] ",
  };
  const prefix = prefixes[lang] ?? `[${lang.toUpperCase()}] `;
  return `${prefix}${text}`;
}

export function getRandomPhrase(langCode: string): string {
  const phrases = SPEECH_SAMPLE_PHRASES[langCode] ?? SPEECH_SAMPLE_PHRASES["en"];
  return phrases[Math.floor(Math.random() * phrases.length)];
}

let speechQueue: string[] = [];
let isSpeaking = false;

async function drainQueue() {
  if (isSpeaking || speechQueue.length === 0) return;
  const text = speechQueue.shift()!;
  isSpeaking = true;
  try {
    if (Platform.OS === "web") {
      await new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.volume = 0.9;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      });
    } else {
      await new Promise<void>((resolve) => {
        Speech.speak(text, {
          rate: 1.0,
          pitch: 1.0,
          volume: 1.0,
          onDone: resolve,
          onError: resolve,
        });
      });
    }
  } catch {}
  isSpeaking = false;
  drainQueue();
}

export function speakText(text: string, langCode?: string) {
  if (Platform.OS === "web") {
    if (!("speechSynthesis" in window)) return;
  }
  if (!text.trim()) return;
  speechQueue.push(text);
  drainQueue();
}

export function stopSpeech() {
  speechQueue = [];
  isSpeaking = false;
  try {
    if (Platform.OS === "web") {
      window.speechSynthesis?.cancel();
    } else {
      Speech.stop();
    }
  } catch {}
}

export function generateSegmentId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export const LIVE_STREAM_PHRASES: Array<{ langCode: string; text: string }> = [
  { langCode: "en", text: "Welcome to the live stream! We're going live right now." },
  { langCode: "ar", text: "مرحباً بكم في البث المباشر! نحن نذهب مباشرة الآن." },
  { langCode: "fr", text: "Bienvenue sur le live ! On est en direct maintenant." },
  { langCode: "es", text: "¡Bienvenidos al en vivo! Estamos transmitiendo ahora." },
  { langCode: "de", text: "Willkommen beim Livestream! Wir sind jetzt live." },
  { langCode: "zh", text: "欢迎收看直播！我们现在开始直播了。" },
  { langCode: "tr", text: "Canlı yayına hoş geldiniz! Şu an canlıyız." },
  { langCode: "ru", text: "Добро пожаловать на прямой эфир! Мы сейчас в эфире." },
  { langCode: "ja", text: "ライブ配信へようこそ！今すぐライブ配信を開始します。" },
  { langCode: "ko", text: "라이브 스트리밍에 오신 것을 환영합니다! 지금 바로 생방송을 시작합니다." },
  { langCode: "hi", text: "लाइव स्ट्रीम में आपका स्वागत है! हम अभी सीधे जा रहे हैं।" },
  { langCode: "fa", text: "خوش آمدید به پخش زنده! الان شروع می‌کنیم." },
  { langCode: "en", text: "Thank you so much for joining today's broadcast." },
  { langCode: "ar", text: "شكراً جزيلاً على انضمامكم لبث اليوم." },
  { langCode: "fr", text: "Merci beaucoup de rejoindre l'émission d'aujourd'hui." },
  { langCode: "es", text: "Muchas gracias por unirse a la transmisión de hoy." },
  { langCode: "en", text: "We have a special guest joining us from across the world." },
  { langCode: "ar", text: "لدينا ضيف مميز ينضم إلينا من حول العالم." },
  { langCode: "zh", text: "我们有一位来自世界各地的特别嘉宾加入。" },
  { langCode: "de", text: "Wir haben einen besonderen Gast aus der ganzen Welt." },
  { langCode: "en", text: "The technology that makes this possible is incredible." },
  { langCode: "ja", text: "これを可能にするテクノロジーは素晴らしいです。" },
  { langCode: "ko", text: "이것을 가능하게 만드는 기술은 놀랍습니다." },
  { langCode: "ar", text: "التكنولوجيا التي تجعل هذا ممكناً مذهلة." },
];
