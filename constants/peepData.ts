export interface PeepPost {
  id: string;
  peep_username: string;
  display_name: string;
  avatar_initials: string;
  avatar_color: string;
  content: string;
  media_emoji?: string;
  media_type?: "image" | "video" | "4k";
  created_at: string;
  likes_count: number;
  retweets_count: number;
  replies_count: number;
  views_count: number;
  is_liked: boolean;
  is_retweeted: boolean;
  is_bookmarked: boolean;
  is_live?: boolean;
  is_verified?: boolean;
  lang_origin?: string;
  reposted_by?: { display_name: string; peep_username: string };
  quoted_post?: Omit<PeepPost, "quoted_post" | "reposted_by">;
  poll?: {
    options: { text: string; votes: number }[];
    ends_at: string;
    voted_index?: number;
  };
  is_thread_start?: boolean;
  thread_count?: number;
  has_thread_line?: boolean;
}

export type Language = {
  code: string;
  name: string;
  flag: string;
  nativeName: string;
};

export interface PeepSpace {
  id: string;
  title: string;
  host: string;
  host_initials: string;
  host_avatar_color: string;
  listeners: number;
  is_live: boolean;
}

export interface TrendingTopic {
  id: string;
  category: string;
  hashtag: string;
  posts_count: number;
  promoted?: boolean;
}

export interface PeepProfile {
  peep_username: string;
  display_name: string;
  avatar_initials: string;
  avatar_color: string;
  bio: string;
  following_count: number;
  followers_count: number;
  posts_count: number;
  is_verified: boolean;
  joined: string;
  is_following: boolean;
  location?: string;
}

export interface PeepNotification {
  id: string;
  type: "like" | "repost" | "follow" | "mention" | "reply" | "quote";
  actor_display_name: string;
  actor_username: string;
  actor_initials: string;
  actor_color: string;
  preview_text?: string;
  time: string;
  is_read: boolean;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "en", name: "English", flag: "🇺🇸", nativeName: "English" },
  { code: "ar", name: "Arabic", flag: "🇸🇦", nativeName: "العربية" },
  { code: "fa", name: "Farsi / Persian", flag: "🇮🇷", nativeName: "فارسی" },
  { code: "ur", name: "Urdu", flag: "🇵🇰", nativeName: "اردو" },
  { code: "ku-kmr", name: "Kurdish · Kurmanji", flag: "🟡", nativeName: "Kurdî (Kurmancî)" },
  { code: "ku-ckb", name: "Kurdish · Sorani", flag: "🟢", nativeName: "کوردی (سۆرانی)" },
  { code: "zh", name: "Chinese", flag: "🇨🇳", nativeName: "中文" },
  { code: "fr", name: "French", flag: "🇫🇷", nativeName: "Français" },
  { code: "de", name: "German", flag: "🇩🇪", nativeName: "Deutsch" },
  { code: "es", name: "Spanish", flag: "🇪🇸", nativeName: "Español" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷", nativeName: "Português" },
  { code: "ru", name: "Russian", flag: "🇷🇺", nativeName: "Русский" },
  { code: "ja", name: "Japanese", flag: "🇯🇵", nativeName: "日本語" },
  { code: "ko", name: "Korean", flag: "🇰🇷", nativeName: "한국어" },
  { code: "hi", name: "Hindi", flag: "🇮🇳", nativeName: "हिन्दी" },
  { code: "tr", name: "Turkish", flag: "🇹🇷", nativeName: "Türkçe" },
  { code: "it", name: "Italian", flag: "🇮🇹", nativeName: "Italiano" },
  { code: "nl", name: "Dutch", flag: "🇳🇱", nativeName: "Nederlands" },
  { code: "pl", name: "Polish", flag: "🇵🇱", nativeName: "Polski" },
  { code: "sv", name: "Swedish", flag: "🇸🇪", nativeName: "Svenska" },
  { code: "id", name: "Indonesian", flag: "🇮🇩", nativeName: "Bahasa Indonesia" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳", nativeName: "Tiếng Việt" },
  { code: "th", name: "Thai", flag: "🇹🇭", nativeName: "ภาษาไทย" },
  { code: "ms", name: "Malay", flag: "🇲🇾", nativeName: "Bahasa Melayu" },
  { code: "tl", name: "Filipino", flag: "🇵🇭", nativeName: "Filipino" },
  { code: "bn", name: "Bengali", flag: "🇧🇩", nativeName: "বাংলা" },
  { code: "ta", name: "Tamil", flag: "🇱🇰", nativeName: "தமிழ்" },
  { code: "uk", name: "Ukrainian", flag: "🇺🇦", nativeName: "Українська" },
  { code: "ro", name: "Romanian", flag: "🇷🇴", nativeName: "Română" },
  { code: "cs", name: "Czech", flag: "🇨🇿", nativeName: "Čeština" },
  { code: "hu", name: "Hungarian", flag: "🇭🇺", nativeName: "Magyar" },
  { code: "el", name: "Greek", flag: "🇬🇷", nativeName: "Ελληνικά" },
  { code: "he", name: "Hebrew", flag: "🇮🇱", nativeName: "עברית" },
  { code: "no", name: "Norwegian", flag: "🇳🇴", nativeName: "Norsk" },
  { code: "fi", name: "Finnish", flag: "🇫🇮", nativeName: "Suomi" },
  { code: "da", name: "Danish", flag: "🇩🇰", nativeName: "Dansk" },
  { code: "sw", name: "Swahili", flag: "🇰🇪", nativeName: "Kiswahili" },
  { code: "am", name: "Amharic", flag: "🇪🇹", nativeName: "አማርኛ" },
  { code: "ha", name: "Hausa", flag: "🇳🇬", nativeName: "Hausa" },
  { code: "az", name: "Azerbaijani", flag: "🇦🇿", nativeName: "Azərbaycanca" },
  { code: "uz", name: "Uzbek", flag: "🇺🇿", nativeName: "O'zbek" },
  { code: "kk", name: "Kazakh", flag: "🇰🇿", nativeName: "Қазақ" },
  { code: "ka", name: "Georgian", flag: "🇬🇪", nativeName: "ქართული" },
  { code: "hy", name: "Armenian", flag: "🇦🇲", nativeName: "Հայերեն" },
  { code: "hr", name: "Croatian", flag: "🇭🇷", nativeName: "Hrvatski" },
  { code: "sr", name: "Serbian", flag: "🇷🇸", nativeName: "Srpski" },
  { code: "bg", name: "Bulgarian", flag: "🇧🇬", nativeName: "Български" },
  { code: "sk", name: "Slovak", flag: "🇸🇰", nativeName: "Slovenčina" },
  { code: "ca", name: "Catalan", flag: "🏴󠁥󠁳󠁣󠁴󠁿", nativeName: "Català" },
  { code: "so", name: "Somali", flag: "🇸🇴", nativeName: "Soomaali" },
  { code: "ps", name: "Pashto", flag: "🇦🇫", nativeName: "پښتو" },

  { code: "pa", name: "Punjabi", flag: "🇮🇳", nativeName: "ਪੰਜਾਬੀ" },
  { code: "gu", name: "Gujarati", flag: "🇮🇳", nativeName: "ગુજરાતી" },
  { code: "mr", name: "Marathi", flag: "🇮🇳", nativeName: "मराठी" },
  { code: "te", name: "Telugu", flag: "🇮🇳", nativeName: "తెలుగు" },
  { code: "kn", name: "Kannada", flag: "🇮🇳", nativeName: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", flag: "🇮🇳", nativeName: "മലയാളം" },
  { code: "si", name: "Sinhala", flag: "🇱🇰", nativeName: "සිංහල" },
  { code: "ne", name: "Nepali", flag: "🇳🇵", nativeName: "नेपाली" },
  { code: "my", name: "Burmese", flag: "🇲🇲", nativeName: "မြန်မာဘာသာ" },
  { code: "km", name: "Khmer", flag: "🇰🇭", nativeName: "ភាសាខ្មែរ" },
  { code: "lo", name: "Lao", flag: "🇱🇦", nativeName: "ພາສາລາວ" },
  { code: "mn", name: "Mongolian", flag: "🇲🇳", nativeName: "Монгол" },

  { code: "cy", name: "Welsh", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", nativeName: "Cymraeg" },
  { code: "ga", name: "Irish", flag: "🇮🇪", nativeName: "Gaeilge" },
  { code: "eu", name: "Basque", flag: "🏴", nativeName: "Euskara" },
  { code: "gl", name: "Galician", flag: "🇪🇸", nativeName: "Galego" },
  { code: "is", name: "Icelandic", flag: "🇮🇸", nativeName: "Íslenska" },
  { code: "lv", name: "Latvian", flag: "🇱🇻", nativeName: "Latviešu" },
  { code: "lt", name: "Lithuanian", flag: "🇱🇹", nativeName: "Lietuvių" },
  { code: "et", name: "Estonian", flag: "🇪🇪", nativeName: "Eesti" },
  { code: "sq", name: "Albanian", flag: "🇦🇱", nativeName: "Shqip" },
  { code: "mk", name: "Macedonian", flag: "🇲🇰", nativeName: "Македонски" },
  { code: "bs", name: "Bosnian", flag: "🇧🇦", nativeName: "Bosanski" },
  { code: "sl", name: "Slovenian", flag: "🇸🇮", nativeName: "Slovenščina" },
  { code: "mt", name: "Maltese", flag: "🇲🇹", nativeName: "Malti" },
  { code: "af", name: "Afrikaans", flag: "🇿🇦", nativeName: "Afrikaans" },

  { code: "yo", name: "Yoruba", flag: "🇳🇬", nativeName: "Yorùbá" },
  { code: "ig", name: "Igbo", flag: "🇳🇬", nativeName: "Igbo" },
  { code: "zu", name: "Zulu", flag: "🇿🇦", nativeName: "isiZulu" },
  { code: "xh", name: "Xhosa", flag: "🇿🇦", nativeName: "isiXhosa" },
  { code: "rw", name: "Kinyarwanda", flag: "🇷🇼", nativeName: "Kinyarwanda" },
  { code: "ln", name: "Lingala", flag: "🇨🇩", nativeName: "Lingála" },
  { code: "ny", name: "Chichewa", flag: "🇲🇼", nativeName: "Chichewa" },
  { code: "sn", name: "Shona", flag: "🇿🇼", nativeName: "chiShona" },
  { code: "om", name: "Oromo", flag: "🇪🇹", nativeName: "Afaan Oromoo" },
  { code: "ti", name: "Tigrinya", flag: "🇪🇷", nativeName: "ትግርኛ" },
  { code: "wo", name: "Wolof", flag: "🇸🇳", nativeName: "Wolof" },
  { code: "ff", name: "Fulani", flag: "🌍", nativeName: "Fulfulde" },
  { code: "tw", name: "Twi / Akan", flag: "🇬🇭", nativeName: "Twi" },
  { code: "lg", name: "Luganda", flag: "🇺🇬", nativeName: "Luganda" },
  { code: "tn", name: "Tswana", flag: "🇧🇼", nativeName: "Setswana" },

  { code: "ht", name: "Haitian Creole", flag: "🇭🇹", nativeName: "Kreyòl ayisyen" },
  { code: "ceb", name: "Cebuano", flag: "🇵🇭", nativeName: "Cebuano" },
  { code: "jv", name: "Javanese", flag: "🇮🇩", nativeName: "Basa Jawa" },
  { code: "su", name: "Sundanese", flag: "🇮🇩", nativeName: "Basa Sunda" },
  { code: "mg", name: "Malagasy", flag: "🇲🇬", nativeName: "Malagasy" },
  { code: "mi", name: "Maori", flag: "🇳🇿", nativeName: "Te Reo Māori" },
  { code: "sm", name: "Samoan", flag: "🇼🇸", nativeName: "Gagana Samoa" },
  { code: "to", name: "Tongan", flag: "🇹🇴", nativeName: "Lea Fakatonga" },
  { code: "fy", name: "Frisian", flag: "🇳🇱", nativeName: "Frysk" },
  { code: "lb", name: "Luxembourgish", flag: "🇱🇺", nativeName: "Lëtzebuergesch" },
  { code: "eo", name: "Esperanto", flag: "🌍", nativeName: "Esperanto" },
  { code: "la", name: "Latin", flag: "🏛️", nativeName: "Latina" },
];

const MOCK_TRANSLATIONS: Record<string, Record<string, string>> = {
  ar: {
    "The future of AI is not about replacing humans — it's about amplifying what we can achieve together. Building tools that make people 10x more capable. 🚀": "مستقبل الذكاء الاصطناعي لا يتعلق باستبدال البشر، بل بتضخيم ما يمكننا تحقيقه معًا. بناء أدوات تجعل الناس أكثر قدرة بعشرة أضعاف. 🚀",
  },
  zh: {
    "The future of AI is not about replacing humans — it's about amplifying what we can achieve together. Building tools that make people 10x more capable. 🚀": "AI的未来不是替代人类，而是放大我们共同能实现的成就。构建让人们能力提升十倍的工具。🚀",
  },
  fr: {
    "The future of AI is not about replacing humans — it's about amplifying what we can achieve together. Building tools that make people 10x more capable. 🚀": "L'avenir de l'IA ne consiste pas à remplacer les humains, mais à amplifier ce que nous pouvons accomplir ensemble. Créer des outils qui rendent les gens 10x plus capables. 🚀",
  },
  es: {
    "Bitcoin at $100k is just the beginning. The separation of money and state is the most important financial revolution of our lifetime. Stack accordingly. #BTC #Peep": "Bitcoin en $100k es solo el comienzo. La separación del dinero y el estado es la revolución financiera más importante de nuestra vida. Acumula en consecuencia. #BTC #Peep",
  },
};

export function mockTranslate(text: string, langCode: string): string {
  if (langCode === "en") return text;
  const langTranslations = MOCK_TRANSLATIONS[langCode];
  if (langTranslations && langTranslations[text]) {
    return langTranslations[text];
  }
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
  const label = lang ? `${lang.flag} ${lang.nativeName}` : langCode;
  return `[${label}] ${text}`;
}

export const PEEP_SPACES: PeepSpace[] = [
  { id: "s1", title: "AI & Future of Work", host: "Nexus AI", host_initials: "NA", host_avatar_color: "#E67E22", listeners: 4820, is_live: true },
  { id: "s2", title: "BTC to $250K?", host: "Satoshi Vision", host_initials: "SV", host_avatar_color: "#F7931A", listeners: 12400, is_live: true },
  { id: "s3", title: "DeFi Deep Dive", host: "DeFi Depths", host_initials: "DD", host_avatar_color: "#16A085", listeners: 2300, is_live: true },
  { id: "s4", title: "Privacy Tech Talk", host: "Privacy First", host_initials: "PF", host_avatar_color: "#27AE60", listeners: 890, is_live: true },
  { id: "s5", title: "Live DJ Set 🎧", host: "Nexus DJ", host_initials: "DJ", host_avatar_color: "#C0392B", listeners: 18900, is_live: true },
  { id: "s6", title: "AGI Timeline", host: "AGI Horizon", host_initials: "AH", host_avatar_color: "#2980B9", listeners: 7200, is_live: false },
];

export const TRENDING_TOPICS: TrendingTopic[] = [
  { id: "t1", category: "Technology · Trending", hashtag: "#NexusAI", posts_count: 284000 },
  { id: "t2", category: "Crypto · Trending", hashtag: "#Bitcoin", posts_count: 1420000 },
  { id: "t3", category: "Technology", hashtag: "#AGI2026", posts_count: 98700 },
  { id: "t4", category: "Promoted", hashtag: "#Web3Privacy", posts_count: 45200, promoted: true },
  { id: "t5", category: "Finance · Trending", hashtag: "#DeFi", posts_count: 234000 },
  { id: "t6", category: "Entertainment", hashtag: "#NexusDJ", posts_count: 87300 },
  { id: "t7", category: "Science · Trending", hashtag: "#QuantumComputing", posts_count: 56100 },
  { id: "t8", category: "World", hashtag: "#DigitalPrivacy", posts_count: 321000 },
  { id: "t9", category: "Technology", hashtag: "#EdgeComputing", posts_count: 41200 },
  { id: "t10", category: "Finance", hashtag: "#Remittance2026", posts_count: 28900 },
];

export const PEEP_PROFILES: Record<string, PeepProfile> = {
  "@nexus_ai": { peep_username: "@nexus_ai", display_name: "Nexus AI", avatar_initials: "NA", avatar_color: "#E67E22", bio: "Building the future of connected intelligence. AI · Privacy · Communication 🔐🚀", following_count: 1240, followers_count: 284000, posts_count: 4820, is_verified: true, joined: "January 2024", is_following: false, location: "San Francisco, CA" },
  "@satoshi_vision": { peep_username: "@satoshi_vision", display_name: "Satoshi Vision", avatar_initials: "SV", avatar_color: "#F7931A", bio: "Bitcoin maximalist. The separation of money and state is inevitable. #BTC", following_count: 890, followers_count: 142000, posts_count: 12400, is_verified: true, joined: "March 2021", is_following: true, location: "El Salvador" },
  "@dev_alchemy": { peep_username: "@dev_alchemy", display_name: "Dev Alchemy", avatar_initials: "DA", avatar_color: "#9B59B6", bio: "Full-stack engineer. 10x performance, 0x bullshit. Open source contributor.", following_count: 420, followers_count: 48200, posts_count: 3210, is_verified: false, joined: "June 2022", is_following: false },
  "@stream4k_studio": { peep_username: "@stream4k_studio", display_name: "Stream4K Studio", avatar_initials: "4K", avatar_color: "#E74C3C", bio: "Ultra-low latency 4K streaming. Zero lag. Adaptive bitrate. The future of live.", following_count: 210, followers_count: 74000, posts_count: 1890, is_verified: true, joined: "November 2023", is_following: false },
  "@agi_horizon": { peep_username: "@agi_horizon", display_name: "AGI Horizon", avatar_initials: "AH", avatar_color: "#2980B9", bio: "Tracking the AGI transition. We are building minds, not software. Researcher + builder.", following_count: 680, followers_count: 523000, posts_count: 7840, is_verified: true, joined: "April 2020", is_following: true, location: "London, UK" },
  "@privacy_first": { peep_username: "@privacy_first", display_name: "Privacy First", avatar_initials: "PF", avatar_color: "#27AE60", bio: "Zero-knowledge proofs + decentralized identity. No data breaches, ever. 🔒", following_count: 320, followers_count: 68000, posts_count: 2140, is_verified: false, joined: "September 2022", is_following: false },
  "@defi_depths": { peep_username: "@defi_depths", display_name: "DeFi Depths", avatar_initials: "DD", avatar_color: "#16A085", bio: "On-chain since 2017. DeFi analyst. DYOR always. Not financial advice.", following_count: 1100, followers_count: 142000, posts_count: 9820, is_verified: false, joined: "January 2018", is_following: true },
  "@quantum_arts": { peep_username: "@quantum_arts", display_name: "Quantum Arts", avatar_initials: "QA", avatar_color: "#8E44AD", bio: "Digital art on-chain. Creating the metaverse economy, one piece at a time. 🎨", following_count: 540, followers_count: 91000, posts_count: 4320, is_verified: false, joined: "August 2022", is_following: false },
  "@nexus_live_dj": { peep_username: "@nexus_live_dj", display_name: "Nexus Live DJ", avatar_initials: "DJ", avatar_color: "#C0392B", bio: "4K DJ sets in 16 languages. Music has no borders. Powered by Nexus 🎧", following_count: 830, followers_count: 189000, posts_count: 2840, is_verified: true, joined: "May 2023", is_following: false },
};

export const PEEP_NOTIFICATIONS: PeepNotification[] = [
  { id: "n1", type: "like", actor_display_name: "Satoshi Vision", actor_username: "@satoshi_vision", actor_initials: "SV", actor_color: "#F7931A", preview_text: "The future of AI is not about replacing humans...", time: "2m", is_read: false },
  { id: "n2", type: "follow", actor_display_name: "AGI Horizon", actor_username: "@agi_horizon", actor_initials: "AH", actor_color: "#2980B9", time: "8m", is_read: false },
  { id: "n3", type: "repost", actor_display_name: "Dev Alchemy", actor_username: "@dev_alchemy", actor_initials: "DA", actor_color: "#9B59B6", preview_text: "Building tools that make people 10x more capable 🚀", time: "15m", is_read: false },
  { id: "n4", type: "mention", actor_display_name: "Privacy First", actor_username: "@privacy_first", actor_initials: "PF", actor_color: "#27AE60", preview_text: "@nexus_ai is changing the game with encrypted comms 🔒", time: "1h", is_read: false },
  { id: "n5", type: "reply", actor_display_name: "DeFi Depths", actor_username: "@defi_depths", actor_initials: "DD", actor_color: "#16A085", preview_text: "Agreed — the AGI transition has already begun.", time: "2h", is_read: true },
  { id: "n6", type: "quote", actor_display_name: "Quantum Arts", actor_username: "@quantum_arts", actor_initials: "QA", actor_color: "#8E44AD", preview_text: "This is why on-chain ownership matters so much right now", time: "3h", is_read: true },
  { id: "n7", type: "like", actor_display_name: "Stream4K Studio", actor_username: "@stream4k_studio", actor_initials: "4K", actor_color: "#E74C3C", preview_text: "The future of AI is not about replacing humans...", time: "4h", is_read: true },
  { id: "n8", type: "follow", actor_display_name: "Nexus Live DJ", actor_username: "@nexus_live_dj", actor_initials: "DJ", actor_color: "#C0392B", time: "6h", is_read: true },
  { id: "n9", type: "repost", actor_display_name: "AGI Horizon", actor_username: "@agi_horizon", actor_initials: "AH", actor_color: "#2980B9", preview_text: "Building tools that make people 10x more capable 🚀", time: "8h", is_read: true },
  { id: "n10", type: "mention", actor_display_name: "Satoshi Vision", actor_username: "@satoshi_vision", actor_initials: "SV", actor_color: "#F7931A", preview_text: ".@nexus_ai is setting the standard for privacy-first AI", time: "12h", is_read: true },
];

export const PEEP_POSTS: PeepPost[] = [
  {
    id: "p1",
    peep_username: "@nexus_ai",
    display_name: "Nexus AI",
    avatar_initials: "NA",
    avatar_color: "#E67E22",
    content: "The future of AI is not about replacing humans — it's about amplifying what we can achieve together. Building tools that make people 10x more capable. 🚀",
    media_emoji: "🤖",
    media_type: "image",
    created_at: "2m",
    likes_count: 84200,
    retweets_count: 12400,
    replies_count: 4300,
    views_count: 2100000,
    is_liked: false,
    is_retweeted: false,
    is_bookmarked: false,
    is_verified: true,
    is_live: true,
    lang_origin: "en",
    is_thread_start: true,
    thread_count: 7,
    has_thread_line: false,
  },
  {
    id: "p1b",
    peep_username: "@privacy_first",
    display_name: "Privacy First",
    avatar_initials: "PF",
    avatar_color: "#27AE60",
    content: "This 👆 + zero-knowledge proofs = the future nobody can stop. Decentralized identity has no data breach surface. 🔒",
    created_at: "5m",
    likes_count: 3200,
    retweets_count: 890,
    replies_count: 124,
    views_count: 84000,
    is_liked: false,
    is_retweeted: false,
    is_bookmarked: false,
    is_verified: false,
    lang_origin: "en",
    reposted_by: { display_name: "Nexus AI", peep_username: "@nexus_ai" },
  },
  {
    id: "p2",
    peep_username: "@satoshi_vision",
    display_name: "Satoshi Vision",
    avatar_initials: "SV",
    avatar_color: "#F7931A",
    content: "Bitcoin at $100k is just the beginning. The separation of money and state is the most important financial revolution of our lifetime. Stack accordingly. #BTC #Peep",
    media_emoji: "₿",
    media_type: "image",
    created_at: "15m",
    likes_count: 31500,
    retweets_count: 8900,
    replies_count: 2100,
    views_count: 890000,
    is_liked: true,
    is_retweeted: false,
    is_bookmarked: true,
    is_verified: true,
    lang_origin: "en",
  },
  {
    id: "p_poll1",
    peep_username: "@agi_horizon",
    display_name: "AGI Horizon",
    avatar_initials: "AH",
    avatar_color: "#2980B9",
    content: "When do you think we'll achieve AGI? (Assuming human-level reasoning across all domains)",
    created_at: "30m",
    likes_count: 14200,
    retweets_count: 3800,
    replies_count: 9200,
    views_count: 420000,
    is_liked: false,
    is_retweeted: false,
    is_bookmarked: false,
    is_verified: true,
    lang_origin: "en",
    poll: {
      options: [
        { text: "Before 2027", votes: 18420 },
        { text: "2027–2030", votes: 31840 },
        { text: "2030–2035", votes: 24200 },
        { text: "After 2035 or never", votes: 12100 },
      ],
      ends_at: "2 days left",
    },
  },
  {
    id: "p3",
    peep_username: "@dev_alchemy",
    display_name: "Dev Alchemy",
    avatar_initials: "DA",
    avatar_color: "#9B59B6",
    content: "Just shipped a feature that cut API latency by 73% using edge caching + intelligent prefetch. Clean architecture > over-engineering. Full thread below 🧵",
    created_at: "1h",
    likes_count: 4820,
    retweets_count: 1230,
    replies_count: 340,
    views_count: 148000,
    is_liked: false,
    is_retweeted: true,
    is_bookmarked: false,
    is_verified: false,
    lang_origin: "en",
    is_thread_start: true,
    thread_count: 12,
  },
  {
    id: "p_quote1",
    peep_username: "@defi_depths",
    display_name: "DeFi Depths",
    avatar_initials: "DD",
    avatar_color: "#16A085",
    content: "This is exactly the pattern we use for on-chain settlement. Sub-100ms finality changes everything for DeFi UX.",
    created_at: "2h",
    likes_count: 2140,
    retweets_count: 480,
    replies_count: 87,
    views_count: 62000,
    is_liked: true,
    is_retweeted: false,
    is_bookmarked: false,
    is_verified: false,
    lang_origin: "en",
    quoted_post: {
      id: "p3",
      peep_username: "@dev_alchemy",
      display_name: "Dev Alchemy",
      avatar_initials: "DA",
      avatar_color: "#9B59B6",
      content: "Just shipped a feature that cut API latency by 73% using edge caching + intelligent prefetch. Clean architecture > over-engineering.",
      created_at: "1h",
      likes_count: 4820,
      retweets_count: 1230,
      replies_count: 340,
      views_count: 148000,
      is_liked: false,
      is_retweeted: true,
      is_bookmarked: false,
      is_verified: false,
      lang_origin: "en",
    },
  },
  {
    id: "p4",
    peep_username: "@stream4k_studio",
    display_name: "Stream4K Studio",
    avatar_initials: "4K",
    avatar_color: "#E74C3C",
    content: "🔴 LIVE: Testing our new 4K ultra-low latency streaming pipeline. Zero-lag adaptive bitrate switching between 4K/1080p/720p in real time. Watch now 👇",
    media_emoji: "📡",
    media_type: "4k",
    created_at: "LIVE",
    likes_count: 7400,
    retweets_count: 2100,
    replies_count: 890,
    views_count: 342000,
    is_liked: false,
    is_retweeted: false,
    is_bookmarked: false,
    is_live: true,
    is_verified: true,
    lang_origin: "en",
  },
  {
    id: "p_poll2",
    peep_username: "@privacy_first",
    display_name: "Privacy First",
    avatar_initials: "PF",
    avatar_color: "#27AE60",
    content: "Which privacy technology will dominate by 2027?",
    created_at: "3h",
    likes_count: 3400,
    retweets_count: 1100,
    replies_count: 540,
    views_count: 98000,
    is_liked: false,
    is_retweeted: false,
    is_bookmarked: true,
    is_verified: false,
    lang_origin: "en",
    poll: {
      options: [
        { text: "Zero-Knowledge Proofs", votes: 24800 },
        { text: "Homomorphic Encryption", votes: 8200 },
        { text: "Decentralized Identity", votes: 18400 },
        { text: "Secure Enclaves (TEE)", votes: 6100 },
      ],
      ends_at: "Final results",
      voted_index: 0,
    },
  },
  {
    id: "p5",
    peep_username: "@agi_horizon",
    display_name: "AGI Horizon",
    avatar_initials: "AH",
    avatar_color: "#2980B9",
    content: "The models training today will reshape every industry within this decade. We are not building software — we are building minds. The AGI transition has already begun.",
    created_at: "4h",
    likes_count: 52300,
    retweets_count: 18700,
    replies_count: 9200,
    views_count: 1840000,
    is_liked: true,
    is_retweeted: false,
    is_bookmarked: false,
    is_verified: true,
    lang_origin: "en",
  },
  {
    id: "p6",
    peep_username: "@privacy_first",
    display_name: "Privacy First",
    avatar_initials: "PF",
    avatar_color: "#27AE60",
    content: "Hot take: The best security system is one users actually trust. Zero-knowledge proofs + decentralized identity = the future of online privacy. No more data breaches. 🔒",
    created_at: "6h",
    likes_count: 6800,
    retweets_count: 1900,
    replies_count: 470,
    views_count: 220000,
    is_liked: false,
    is_retweeted: false,
    is_bookmarked: false,
    lang_origin: "en",
  },
  {
    id: "p7",
    peep_username: "@defi_depths",
    display_name: "DeFi Depths",
    avatar_initials: "DD",
    avatar_color: "#16A085",
    content: "Accumulated another 500 BTC position at $94,200. The volatility is the feature, not the bug. Long-term holders have always won. My 2026 target: $250k. DYOR. Not financial advice.",
    created_at: "8h",
    likes_count: 14200,
    retweets_count: 4800,
    replies_count: 3300,
    views_count: 480000,
    is_liked: false,
    is_retweeted: false,
    is_bookmarked: false,
    lang_origin: "en",
  },
  {
    id: "p8",
    peep_username: "@quantum_arts",
    display_name: "Quantum Arts",
    avatar_initials: "QA",
    avatar_color: "#8E44AD",
    content: "Digital art crossed $3.5B in Q1 2026. The metaverse economy isn't coming — it's already here. Every creator deserves on-chain ownership of their work. 🎨",
    media_emoji: "🖼️",
    media_type: "image",
    created_at: "12h",
    likes_count: 9100,
    retweets_count: 3200,
    replies_count: 740,
    views_count: 290000,
    is_liked: false,
    is_retweeted: false,
    is_bookmarked: false,
    lang_origin: "en",
  },
  {
    id: "p9",
    peep_username: "@nexus_live_dj",
    display_name: "Nexus Live DJ",
    avatar_initials: "DJ",
    avatar_color: "#C0392B",
    content: "🎵 Going live in 5 mins — full 4K DJ set with AI-translated commentary in 16 languages. Tune in wherever you are in the world. The future of live music is NOW. #NexusDJ",
    media_emoji: "🎧",
    media_type: "4k",
    created_at: "22m",
    likes_count: 18900,
    retweets_count: 6700,
    replies_count: 1200,
    views_count: 630000,
    is_liked: false,
    is_retweeted: false,
    is_bookmarked: false,
    is_live: true,
    is_verified: true,
    lang_origin: "en",
  },
];

export const FOLLOWING_POSTS: PeepPost[] = [
  PEEP_POSTS[0],
  PEEP_POSTS[2],
  PEEP_POSTS[4],
  PEEP_POSTS[6],
  PEEP_POSTS[9],
  PEEP_POSTS[11],
];

export const LIVE_COMMENTS = [
  { id: "lc1", peep_username: "@crypto_phoenix", text: "This is incredible! 🔥", time: "0:12" },
  { id: "lc2", peep_username: "@ai_builder", text: "4K quality is flawless 🤩", time: "0:18" },
  { id: "lc3", peep_username: "@web3_native", text: "Let's goooo 🚀", time: "0:24" },
  { id: "lc4", peep_username: "@stream_watcher", text: "Way better than YouTube Live", time: "0:31" },
  { id: "lc5", peep_username: "@global_viewer", text: "Watching from Tokyo! 🇯🇵", time: "0:38" },
  { id: "lc6", peep_username: "@peep_fan99", text: "The AI translation is 🤯", time: "0:45" },
  { id: "lc7", peep_username: "@night_owl", text: "Zero lag, insane!", time: "0:52" },
  { id: "lc8", peep_username: "@curious_mind", text: "How's the bitrate so stable?", time: "1:01" },
  { id: "lc9", peep_username: "@dev_watcher", text: "WebRTC + RTMP hybrid 💪", time: "1:09" },
  { id: "lc10", peep_username: "@nexus_fan", text: "First time watching, not the last!", time: "1:17" },
];
