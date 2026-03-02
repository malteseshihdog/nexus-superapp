export interface Status {
  id: string;
  name: string;
  avatar: string;
  color: string;
  time: string;
  hasNew: boolean;
  isMyStatus?: boolean;
  viewCount?: number;
}

export interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageType?: "text" | "image" | "voice" | "file" | "location" | "contact";
  time: string;
  unread: number;
  online: boolean;
  isGroup?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  lastSeen?: string;
  disappearing?: "off" | "24h" | "7d" | "90d";
  isTyping?: boolean;
  lastMessageStatus?: "sent" | "delivered" | "read";
  members?: string[];
}

export interface MessageReaction {
  emoji: string;
  count: number;
  mine: boolean;
}

export interface ReplyInfo {
  id: string;
  text: string;
  sender: string;
  type?: string;
}

export interface Message {
  id: string;
  text: string;
  sender: "me" | "them";
  time: string;
  read: boolean;
  type?: "text" | "image" | "voice" | "file" | "location" | "contact" | "sticker" | "gif" | "money";
  duration?: number;
  fileName?: string;
  fileSize?: string;
  reactions?: MessageReaction[];
  replyTo?: ReplyInfo;
  isStarred?: boolean;
  isDeleted?: boolean;
  deliveryStatus?: "sent" | "delivered" | "read";
  forwardedFrom?: string;
  emoji?: string;
  lat?: number;
  lng?: number;
  locationName?: string;
  amount?: number;
  currency?: string;
  note?: string;
  transferStatus?: "pending" | "sent" | "completed";
}

export interface Post {
  id: string;
  user: string;
  handle: string;
  avatar: string;
  content: string;
  time: string;
  likes: number;
  retweets: number;
  comments: number;
  liked: boolean;
  retweeted: boolean;
  verified?: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  rating: number;
  reviews: number;
  badge?: string;
  color: string;
}

export interface CryptoAsset {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  holdings: number;
  color: string;
}

export const STATUS_LIST: Status[] = [
  { id: "my", name: "My Status", avatar: "ME", color: "#E67E22", time: "", hasNew: false, isMyStatus: true },
  { id: "s1", name: "Alexandra Chen", avatar: "AC", color: "#8E44AD", time: "2m ago", hasNew: true, viewCount: 12 },
  { id: "s2", name: "Marcus Webb", avatar: "MW", color: "#2980B9", time: "15m ago", hasNew: true, viewCount: 7 },
  { id: "s3", name: "Priya Sharma", avatar: "PS", color: "#27AE60", time: "1h ago", hasNew: true, viewCount: 34 },
  { id: "s4", name: "Luna Rodriguez", avatar: "LR", color: "#E74C3C", time: "2h ago", hasNew: false, viewCount: 21 },
  { id: "s5", name: "Kai Tanaka", avatar: "KT", color: "#16A085", time: "3h ago", hasNew: false },
  { id: "s6", name: "James Okonkwo", avatar: "JO", color: "#D35400", time: "5h ago", hasNew: false },
  { id: "s7", name: "Sofia Larsson", avatar: "SL", color: "#8E44AD", time: "8h ago", hasNew: false },
];

export const CONVERSATIONS: Conversation[] = [
  {
    id: "1",
    name: "Alexandra Chen",
    avatar: "AC",
    lastMessage: "See you at the conference! 🎉",
    lastMessageType: "text",
    time: "2m",
    unread: 3,
    online: true,
    lastSeen: "Active now",
    lastMessageStatus: "read",
    disappearing: "off",
  },
  {
    id: "2",
    name: "Dev Squad 🚀",
    avatar: "DS",
    lastMessage: "Build deployed successfully ✅",
    lastMessageType: "text",
    time: "14m",
    unread: 7,
    online: false,
    isGroup: true,
    members: ["You", "Alex", "Marcus", "Luna", "Priya"],
    isPinned: true,
    isMuted: false,
  },
  {
    id: "3",
    name: "Marcus Webb",
    avatar: "MW",
    lastMessage: "That idea is brilliant, let's do it",
    time: "1h",
    unread: 0,
    online: true,
    lastSeen: "1 hour ago",
    lastMessageStatus: "read",
    isPinned: true,
  },
  {
    id: "4",
    name: "Luna Rodriguez",
    avatar: "LR",
    lastMessage: "🎵 Voice message",
    lastMessageType: "voice",
    time: "2h",
    unread: 1,
    online: false,
    lastSeen: "2 hours ago",
    lastMessageStatus: "delivered",
  },
  {
    id: "5",
    name: "Crypto Alpha 🔥",
    avatar: "CA",
    lastMessage: "BTC breaking 100k tonight?",
    time: "3h",
    unread: 0,
    online: false,
    isGroup: true,
    members: ["You", "Satoshi V", "DeFi D", "Crypto W"],
    isMuted: true,
  },
  {
    id: "6",
    name: "Priya Sharma",
    avatar: "PS",
    lastMessage: "📎 Design_v3_final.pdf",
    lastMessageType: "file",
    time: "5h",
    unread: 0,
    online: true,
    lastSeen: "5 hours ago",
  },
  {
    id: "7",
    name: "James Okonkwo",
    avatar: "JO",
    lastMessage: "Meeting rescheduled to Friday",
    time: "1d",
    unread: 0,
    online: false,
    lastSeen: "Yesterday",
    disappearing: "7d",
  },
  {
    id: "8",
    name: "Sofia Larsson",
    avatar: "SL",
    lastMessage: "Can't wait for the launch 🚀",
    time: "1d",
    unread: 2,
    online: true,
    lastSeen: "Yesterday",
    lastMessageStatus: "read",
  },
  {
    id: "9",
    name: "Kai Tanaka",
    avatar: "KT",
    lastMessage: "📍 Shared a location",
    lastMessageType: "location",
    time: "2d",
    unread: 0,
    online: false,
    lastSeen: "2 days ago",
  },
  {
    id: "10",
    name: "NEXUS Family 👨‍👩‍👧‍👦",
    avatar: "NF",
    lastMessage: "Mom: Love you all! ❤️",
    time: "3d",
    unread: 0,
    online: false,
    isGroup: true,
    members: ["You", "Mom", "Dad", "Sis", "Bro"],
  },
];

export const MESSAGES: Record<string, Message[]> = {
  "1": [
    {
      id: "m1",
      text: "Hey! Are you coming to the tech conference this week?",
      sender: "them",
      time: "10:20 AM",
      read: true,
      deliveryStatus: "read",
      reactions: [{ emoji: "👍", count: 1, mine: true }],
    },
    {
      id: "m2",
      text: "Yes! I registered last week. Looking forward to the keynotes 🎯",
      sender: "me",
      time: "10:22 AM",
      read: true,
      deliveryStatus: "read",
    },
    {
      id: "m3",
      text: "Same! I heard the AI panel is going to be fire 🔥",
      sender: "them",
      time: "10:23 AM",
      read: true,
      deliveryStatus: "read",
      replyTo: { id: "m2", text: "Yes! I registered last week...", sender: "me" },
    },
    {
      id: "m4",
      text: "Definitely. Should we meet beforehand for coffee? ☕",
      sender: "me",
      time: "10:25 AM",
      read: true,
      deliveryStatus: "read",
      isStarred: true,
    },
    {
      id: "m5",
      text: "See you at the conference! 🎉",
      sender: "them",
      time: "10:26 AM",
      read: false,
      reactions: [{ emoji: "🎉", count: 2, mine: false }],
    },
  ],
  "2": [
    {
      id: "m1",
      text: "Running the deployment pipeline now",
      sender: "them",
      time: "9:00 AM",
      read: true,
      deliveryStatus: "read",
    },
    {
      id: "m2",
      text: "Any issues with the env vars?",
      sender: "me",
      time: "9:05 AM",
      read: true,
      deliveryStatus: "read",
    },
    {
      id: "m3",
      text: "Nope, all good. Tests passing green ✅",
      sender: "them",
      time: "9:10 AM",
      read: true,
      deliveryStatus: "read",
    },
    {
      id: "m4",
      text: "Build deployed successfully 🚀",
      sender: "them",
      time: "9:14 AM",
      read: false,
      reactions: [
        { emoji: "🚀", count: 3, mine: true },
        { emoji: "🎉", count: 2, mine: false },
      ],
    },
  ],
};

export const QUICK_REPLY_SUGGESTIONS: Record<string, string[]> = {
  default: ["👍 Got it!", "On my way!", "I'll check", "Sounds good!", "Let me know"],
  greeting: ["Hey! 👋", "Hi there!", "Good to hear from you!", "How are you?"],
  meeting: ["Sure, works for me!", "Can we reschedule?", "I'll be there ✅", "Send me the details"],
  question: ["Yes, absolutely!", "Not sure, let me check", "Let me get back to you", "Can you clarify?"],
};

export const POSTS: Post[] = [
  { id: "1", user: "Elon Musk", handle: "@elonmusk", avatar: "EM", content: "The future of transportation is electric and autonomous. 🚀", time: "2m", likes: 84200, retweets: 12400, comments: 4300, liked: false, retweeted: false, verified: true },
  { id: "2", user: "Satoshi", handle: "@satoshi_v", avatar: "SV", content: "Bitcoin is not just a currency. It is a paradigm shift. #Bitcoin", time: "15m", likes: 31500, retweets: 8900, comments: 2100, liked: true, retweeted: false },
];

export const PRODUCTS: Product[] = [
  { id: "1", name: "AirPods Pro Max", price: 549, originalPrice: 649, category: "Electronics", rating: 4.8, reviews: 12400, badge: "SALE", color: "#2C3E50" },
  { id: "2", name: "iPhone 16 Ultra", price: 1299, category: "Electronics", rating: 4.9, reviews: 8700, badge: "NEW", color: "#1A1A2E" },
  { id: "3", name: "Nike Air Jordan 1", price: 180, originalPrice: 220, category: "Fashion", rating: 4.7, reviews: 5600, badge: "HOT", color: "#2D1515" },
  { id: "4", name: "Organic Matcha Set", price: 48, category: "Food", rating: 4.6, reviews: 2300, color: "#0D2018" },
  { id: "5", name: "MacBook Pro M4", price: 2499, category: "Electronics", rating: 4.9, reviews: 3200, badge: "NEW", color: "#1C1C2E" },
  { id: "6", name: "Levi's 501 Original", price: 89, originalPrice: 120, category: "Fashion", rating: 4.5, reviews: 9800, badge: "SALE", color: "#0A1628" },
  { id: "7", name: "Sony WH-1000XM6", price: 349, category: "Electronics", rating: 4.8, reviews: 6700, color: "#1A0A2E" },
  { id: "8", name: "Artisan Coffee Blend", price: 32, category: "Food", rating: 4.7, reviews: 1400, color: "#1A0D00" },
];

export const CRYPTO_ASSETS: CryptoAsset[] = [
  { id: "btc", name: "Bitcoin", symbol: "BTC", price: 94200, change24h: 3.42, holdings: 0.482, color: "#F7931A" },
  { id: "eth", name: "Ethereum", symbol: "ETH", price: 3840, change24h: 5.17, holdings: 4.25, color: "#627EEA" },
  { id: "sol", name: "Solana", symbol: "SOL", price: 186, change24h: -1.83, holdings: 24.5, color: "#9945FF" },
  { id: "bnb", name: "BNB", symbol: "BNB", price: 412, change24h: 2.11, holdings: 8.1, color: "#F3BA2F" },
];

export const MARKET_CATEGORIES = ["All", "Electronics", "Fashion", "Food", "Beauty", "Sports"];
