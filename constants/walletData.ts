export interface FiatAccount {
  id: string;
  currency: string;
  symbol: string;
  flag: string;
  balance: number;
  iban?: string;
  accountNumber?: string;
  color: string;
  region: string;
}

export interface FxRate {
  from: string;
  to: string;
  rate: number;
  change: number;
}

export interface RemittanceProvider {
  id: string;
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  fee: number;
  eta: string;
  logo: string;
}

export interface RemittanceCorridor {
  country: string;
  flag: string;
  currency: string;
  popular: boolean;
}

export interface VirtualCard {
  id: string;
  last4: string;
  network: "Visa" | "Mastercard";
  expiry: string;
  cardHolder: string;
  balance: number;
  isVirtual: boolean;
  isFrozen: boolean;
  color: [string, string];
}

export interface WalletTx {
  id: string;
  label: string;
  sub: string;
  amount: string;
  value: string;
  time: string;
  icon: string;
  positive: boolean;
  type: "send" | "receive" | "card" | "crypto" | "remit" | "fx";
}

export interface CryptoAsset {
  id: string;
  name: string;
  symbol: string;
  color: string;
  iconEmoji: string;
  address: string;
  balance: number;
  usdValue: number;
  usdPrice: number;
  change24h: number;
  marketCap: string;
  volume24h: string;
  isFavorite?: boolean;
}

export interface WorldCurrency {
  country: string;
  flag: string;
  currency: string;
  symbol: string;
  region: string;
  usdRate: number;
}

export const WORLD_CURRENCIES: WorldCurrency[] = [
  { country: "United States", flag: "🇺🇸", currency: "USD", symbol: "$", region: "Americas", usdRate: 1 },
  { country: "Eurozone", flag: "🇪🇺", currency: "EUR", symbol: "€", region: "Europe", usdRate: 0.9218 },
  { country: "United Kingdom", flag: "🇬🇧", currency: "GBP", symbol: "£", region: "Europe", usdRate: 0.7892 },
  { country: "Iraq", flag: "🇮🇶", currency: "IQD", symbol: "ع.د", region: "Middle East", usdRate: 1310.5 },
  { country: "Syria", flag: "🇸🇾", currency: "SYP", symbol: "£S", region: "Middle East", usdRate: 12900 },
  { country: "Saudi Arabia", flag: "🇸🇦", currency: "SAR", symbol: "﷼", region: "Middle East", usdRate: 3.75 },
  { country: "UAE", flag: "🇦🇪", currency: "AED", symbol: "د.إ", region: "Middle East", usdRate: 3.6725 },
  { country: "Kuwait", flag: "🇰🇼", currency: "KWD", symbol: "د.ك", region: "Middle East", usdRate: 0.3067 },
  { country: "Qatar", flag: "🇶🇦", currency: "QAR", symbol: "﷼", region: "Middle East", usdRate: 3.64 },
  { country: "Bahrain", flag: "🇧🇭", currency: "BHD", symbol: ".د.ب", region: "Middle East", usdRate: 0.376 },
  { country: "Oman", flag: "🇴🇲", currency: "OMR", symbol: "﷼", region: "Middle East", usdRate: 0.385 },
  { country: "Jordan", flag: "🇯🇴", currency: "JOD", symbol: "د.ا", region: "Middle East", usdRate: 0.709 },
  { country: "Egypt", flag: "🇪🇬", currency: "EGP", symbol: "£", region: "Africa", usdRate: 49.5 },
  { country: "Turkey", flag: "🇹🇷", currency: "TRY", symbol: "₺", region: "Europe", usdRate: 32.1 },
  { country: "Iran", flag: "🇮🇷", currency: "IRR", symbol: "﷼", region: "Middle East", usdRate: 42000 },
  { country: "Lebanon", flag: "🇱🇧", currency: "LBP", symbol: "ل.ل", region: "Middle East", usdRate: 89600 },
  { country: "Morocco", flag: "🇲🇦", currency: "MAD", symbol: "د.م.", region: "Africa", usdRate: 10.07 },
  { country: "Tunisia", flag: "🇹🇳", currency: "TND", symbol: "د.ت", region: "Africa", usdRate: 3.11 },
  { country: "Algeria", flag: "🇩🇿", currency: "DZD", symbol: "د.ج", region: "Africa", usdRate: 134.8 },
  { country: "Japan", flag: "🇯🇵", currency: "JPY", symbol: "¥", region: "Asia", usdRate: 149.5 },
  { country: "China", flag: "🇨🇳", currency: "CNY", symbol: "¥", region: "Asia", usdRate: 7.24 },
  { country: "India", flag: "🇮🇳", currency: "INR", symbol: "₹", region: "Asia", usdRate: 83.12 },
  { country: "South Korea", flag: "🇰🇷", currency: "KRW", symbol: "₩", region: "Asia", usdRate: 1325 },
  { country: "Singapore", flag: "🇸🇬", currency: "SGD", symbol: "S$", region: "Asia", usdRate: 1.347 },
  { country: "Hong Kong", flag: "🇭🇰", currency: "HKD", symbol: "HK$", region: "Asia", usdRate: 7.824 },
  { country: "Thailand", flag: "🇹🇭", currency: "THB", symbol: "฿", region: "Asia", usdRate: 35.1 },
  { country: "Malaysia", flag: "🇲🇾", currency: "MYR", symbol: "RM", region: "Asia", usdRate: 4.67 },
  { country: "Indonesia", flag: "🇮🇩", currency: "IDR", symbol: "Rp", region: "Asia", usdRate: 15650 },
  { country: "Philippines", flag: "🇵🇭", currency: "PHP", symbol: "₱", region: "Asia", usdRate: 56.4 },
  { country: "Vietnam", flag: "🇻🇳", currency: "VND", symbol: "₫", region: "Asia", usdRate: 24800 },
  { country: "Pakistan", flag: "🇵🇰", currency: "PKR", symbol: "₨", region: "Asia", usdRate: 278.5 },
  { country: "Bangladesh", flag: "🇧🇩", currency: "BDT", symbol: "৳", region: "Asia", usdRate: 109.8 },
  { country: "Sri Lanka", flag: "🇱🇰", currency: "LKR", symbol: "Rs", region: "Asia", usdRate: 307 },
  { country: "Nepal", flag: "🇳🇵", currency: "NPR", symbol: "Rs", region: "Asia", usdRate: 133.2 },
  { country: "Canada", flag: "🇨🇦", currency: "CAD", symbol: "C$", region: "Americas", usdRate: 1.362 },
  { country: "Australia", flag: "🇦🇺", currency: "AUD", symbol: "A$", region: "Oceania", usdRate: 1.534 },
  { country: "New Zealand", flag: "🇳🇿", currency: "NZD", symbol: "NZ$", region: "Oceania", usdRate: 1.628 },
  { country: "Switzerland", flag: "🇨🇭", currency: "CHF", symbol: "Fr", region: "Europe", usdRate: 0.8964 },
  { country: "Sweden", flag: "🇸🇪", currency: "SEK", symbol: "kr", region: "Europe", usdRate: 10.42 },
  { country: "Norway", flag: "🇳🇴", currency: "NOK", symbol: "kr", region: "Europe", usdRate: 10.58 },
  { country: "Denmark", flag: "🇩🇰", currency: "DKK", symbol: "kr", region: "Europe", usdRate: 6.89 },
  { country: "Poland", flag: "🇵🇱", currency: "PLN", symbol: "zł", region: "Europe", usdRate: 3.98 },
  { country: "Czech Republic", flag: "🇨🇿", currency: "CZK", symbol: "Kč", region: "Europe", usdRate: 23.3 },
  { country: "Hungary", flag: "🇭🇺", currency: "HUF", symbol: "Ft", region: "Europe", usdRate: 362 },
  { country: "Romania", flag: "🇷🇴", currency: "RON", symbol: "lei", region: "Europe", usdRate: 4.59 },
  { country: "Russia", flag: "🇷🇺", currency: "RUB", symbol: "₽", region: "Europe", usdRate: 88.5 },
  { country: "Ukraine", flag: "🇺🇦", currency: "UAH", symbol: "₴", region: "Europe", usdRate: 38.9 },
  { country: "Brazil", flag: "🇧🇷", currency: "BRL", symbol: "R$", region: "Americas", usdRate: 4.97 },
  { country: "Mexico", flag: "🇲🇽", currency: "MXN", symbol: "$", region: "Americas", usdRate: 17.15 },
  { country: "Argentina", flag: "🇦🇷", currency: "ARS", symbol: "$", region: "Americas", usdRate: 826 },
  { country: "Colombia", flag: "🇨🇴", currency: "COP", symbol: "$", region: "Americas", usdRate: 3920 },
  { country: "Chile", flag: "🇨🇱", currency: "CLP", symbol: "$", region: "Americas", usdRate: 965 },
  { country: "Peru", flag: "🇵🇪", currency: "PEN", symbol: "S/.", region: "Americas", usdRate: 3.71 },
  { country: "Venezuela", flag: "🇻🇪", currency: "VES", symbol: "Bs.", region: "Americas", usdRate: 36.5 },
  { country: "Nigeria", flag: "🇳🇬", currency: "NGN", symbol: "₦", region: "Africa", usdRate: 1545 },
  { country: "South Africa", flag: "🇿🇦", currency: "ZAR", symbol: "R", region: "Africa", usdRate: 18.62 },
  { country: "Kenya", flag: "🇰🇪", currency: "KES", symbol: "KSh", region: "Africa", usdRate: 129.5 },
  { country: "Ethiopia", flag: "🇪🇹", currency: "ETB", symbol: "Br", region: "Africa", usdRate: 56.8 },
  { country: "Ghana", flag: "🇬🇭", currency: "GHS", symbol: "₵", region: "Africa", usdRate: 12.4 },
  { country: "Tanzania", flag: "🇹🇿", currency: "TZS", symbol: "TSh", region: "Africa", usdRate: 2540 },
  { country: "Libya", flag: "🇱🇾", currency: "LYD", symbol: "ل.د", region: "Africa", usdRate: 4.84 },
  { country: "Sudan", flag: "🇸🇩", currency: "SDG", symbol: "ج.س.", region: "Africa", usdRate: 601 },
  { country: "Azerbaijan", flag: "🇦🇿", currency: "AZN", symbol: "₼", region: "Asia", usdRate: 1.7 },
  { country: "Kazakhstan", flag: "🇰🇿", currency: "KZT", symbol: "₸", region: "Asia", usdRate: 450 },
  { country: "Uzbekistan", flag: "🇺🇿", currency: "UZS", symbol: "сўм", region: "Asia", usdRate: 12400 },
  { country: "Georgia", flag: "🇬🇪", currency: "GEL", symbol: "₾", region: "Asia", usdRate: 2.68 },
  { country: "Armenia", flag: "🇦🇲", currency: "AMD", symbol: "֏", region: "Asia", usdRate: 405 },
  { country: "Israel", flag: "🇮🇱", currency: "ILS", symbol: "₪", region: "Middle East", usdRate: 3.67 },
  { country: "Yemen", flag: "🇾🇪", currency: "YER", symbol: "﷼", region: "Middle East", usdRate: 570 },
  { country: "Afghanistan", flag: "🇦🇫", currency: "AFN", symbol: "؋", region: "Asia", usdRate: 71.5 },
  { country: "Myanmar", flag: "🇲🇲", currency: "MMK", symbol: "K", region: "Asia", usdRate: 2098 },
  { country: "Cambodia", flag: "🇰🇭", currency: "KHR", symbol: "៛", region: "Asia", usdRate: 4100 },
  { country: "Laos", flag: "🇱🇦", currency: "LAK", symbol: "₭", region: "Asia", usdRate: 20800 },
  { country: "Mongolia", flag: "🇲🇳", currency: "MNT", symbol: "₮", region: "Asia", usdRate: 3430 },
];

export const FIAT_ACCOUNTS: FiatAccount[] = [
  { id: "usd", currency: "USD", symbol: "$", flag: "🇺🇸", balance: 12_480.50, iban: "US29 NEXU 0000 1234 5678 9012", color: "#27AE60", region: "Americas" },
  { id: "eur", currency: "EUR", symbol: "€", flag: "🇪🇺", balance: 4_200.00, iban: "DE89 3704 0044 0532 0130 00", color: "#2980B9", region: "Europe" },
  { id: "gbp", currency: "GBP", symbol: "£", flag: "🇬🇧", balance: 1_800.00, iban: "GB82 WEST 1234 5698 7654 32", color: "#8E44AD", region: "Europe" },
  { id: "aed", currency: "AED", symbol: "د.إ", flag: "🇦🇪", balance: 9_200.00, accountNumber: "AE07 0331 2345 6789 0123 456", color: "#E67E22", region: "Middle East" },
  { id: "iqd", currency: "IQD", symbol: "ع.د", flag: "🇮🇶", balance: 1_250_000, accountNumber: "IQ98 NBIQ 0850 1234 5678 9012", color: "#E74C3C", region: "Middle East" },
  { id: "sar", currency: "SAR", symbol: "﷼", flag: "🇸🇦", balance: 3_750.00, accountNumber: "SA03 8000 0000 6080 1016 7519", color: "#F39C12", region: "Middle East" },
  { id: "syp", currency: "SYP", symbol: "£S", flag: "🇸🇾", balance: 3_500_000, accountNumber: "SY24 0014 0000 2400 7001 1234 5", color: "#9B59B6", region: "Middle East" },
  { id: "try", currency: "TRY", symbol: "₺", flag: "🇹🇷", balance: 32_100.00, iban: "TR33 0006 1005 1978 6457 8413 26", color: "#E74C3C", region: "Europe" },
  { id: "inr", currency: "INR", symbol: "₹", flag: "🇮🇳", balance: 83_120.00, accountNumber: "IN30 0002 0003 0004 0005 0006 7", color: "#F39C12", region: "Asia" },
  { id: "egp", currency: "EGP", symbol: "£", flag: "🇪🇬", balance: 49_500.00, accountNumber: "EG380019000500000020000107", color: "#27AE60", region: "Africa" },
];

export const CRYPTO_ASSETS: CryptoAsset[] = [
  { id: "btc", name: "Bitcoin", symbol: "BTC", color: "#F7931A", iconEmoji: "₿", address: "bc1q...4f8k", balance: 0.482, usdValue: 45_444, usdPrice: 94_280, change24h: 3.42, marketCap: "$1.85T", volume24h: "$42.1B", isFavorite: true },
  { id: "eth", name: "Ethereum", symbol: "ETH", color: "#627EEA", iconEmoji: "Ξ", address: "0x1a2...b3c4", balance: 4.25, usdValue: 16_320, usdPrice: 3_840, change24h: 5.17, marketCap: "$461B", volume24h: "$21.3B", isFavorite: true },
  { id: "sol", name: "Solana", symbol: "SOL", color: "#9945FF", iconEmoji: "◎", address: "7xKX...9pQ2", balance: 24.5, usdValue: 4_557, usdPrice: 186, change24h: -2.14, marketCap: "$86B", volume24h: "$4.2B" },
  { id: "bnb", name: "BNB", symbol: "BNB", color: "#F3BA2F", iconEmoji: "B", address: "0xAB1...C2D3", balance: 8.1, usdValue: 3_337, usdPrice: 412, change24h: 1.88, marketCap: "$62B", volume24h: "$1.8B" },
  { id: "xrp", name: "XRP", symbol: "XRP", color: "#00AAE4", iconEmoji: "✕", address: "rXRP...4k92", balance: 2_400, usdValue: 5_040, usdPrice: 2.10, change24h: 8.31, marketCap: "$120B", volume24h: "$8.4B", isFavorite: true },
  { id: "doge", name: "Dogecoin", symbol: "DOGE", color: "#C2A633", iconEmoji: "Ð", address: "D5jn...k2Ps", balance: 14_500, usdValue: 1_827, usdPrice: 0.126, change24h: -1.45, marketCap: "$18B", volume24h: "$1.1B" },
  { id: "ada", name: "Cardano", symbol: "ADA", color: "#0D1E2D", iconEmoji: "₳", address: "addr1...xy8z", balance: 5_200, usdValue: 2_340, usdPrice: 0.45, change24h: 2.67, marketCap: "$16B", volume24h: "$520M" },
  { id: "avax", name: "Avalanche", symbol: "AVAX", color: "#E84142", iconEmoji: "A", address: "0xC98...D3F4", balance: 42, usdValue: 1_596, usdPrice: 38, change24h: -3.21, marketCap: "$16B", volume24h: "$480M" },
  { id: "link", name: "Chainlink", symbol: "LINK", color: "#2A5ADA", iconEmoji: "⬡", address: "0x4F5...A2B1", balance: 180, usdValue: 2_700, usdPrice: 15, change24h: 4.56, marketCap: "$9B", volume24h: "$380M" },
  { id: "matic", name: "Polygon", symbol: "POL", color: "#8247E5", iconEmoji: "⬟", address: "0x1bC...7E4F", balance: 3_800, usdValue: 2_090, usdPrice: 0.55, change24h: -0.88, marketCap: "$5B", volume24h: "$210M" },
  { id: "usdt", name: "Tether", symbol: "USDT", color: "#26A17B", iconEmoji: "₮", address: "0xTHR...T5T6", balance: 3_200, usdValue: 3_200, usdPrice: 1.00, change24h: 0.01, marketCap: "$138B", volume24h: "$62B", isFavorite: true },
  { id: "usdc", name: "USD Coin", symbol: "USDC", color: "#2775CA", iconEmoji: "$", address: "0xUSD...C4C5", balance: 1_500, usdValue: 1_500, usdPrice: 1.00, change24h: 0.00, marketCap: "$43B", volume24h: "$8.1B" },
  { id: "dot", name: "Polkadot", symbol: "DOT", color: "#E6007A", iconEmoji: "●", address: "1DOT...ZxWY", balance: 290, usdValue: 1_943, usdPrice: 6.70, change24h: 1.23, marketCap: "$10B", volume24h: "$290M" },
];

export const CHAIN_CONFIGS = CRYPTO_ASSETS.filter(a => ["btc","eth","sol","bnb"].includes(a.id)).map(a => ({
  id: a.id,
  name: a.name,
  symbol: a.symbol,
  color: a.color,
  address: a.address,
  balance: a.balance,
  usdValue: a.usdValue,
}));

export const FX_RATES: FxRate[] = [
  { from: "USD", to: "EUR", rate: 0.9218, change: -0.12 },
  { from: "USD", to: "GBP", rate: 0.7892, change: 0.05 },
  { from: "USD", to: "IQD", rate: 1310.5, change: 0.08 },
  { from: "USD", to: "AED", rate: 3.6725, change: 0.00 },
  { from: "USD", to: "SAR", rate: 3.75, change: 0.00 },
  { from: "USD", to: "SYP", rate: 12_900, change: 1.45 },
  { from: "USD", to: "TRY", rate: 32.1, change: -0.35 },
  { from: "USD", to: "INR", rate: 83.12, change: 0.11 },
  { from: "USD", to: "EGP", rate: 49.5, change: -0.08 },
  { from: "EUR", to: "USD", rate: 1.0848, change: 0.12 },
  { from: "EUR", to: "IQD", rate: 1421.8, change: 0.21 },
  { from: "BTC", to: "USD", rate: 94_280, change: 3.42 },
  { from: "ETH", to: "USD", rate: 3_840, change: 5.17 },
  { from: "XRP", to: "USD", rate: 2.10, change: 8.31 },
];

export const REMITTANCE_PROVIDERS: RemittanceProvider[] = [
  { id: "wu", name: "Western Union", shortName: "WU", color: "#F7B731", bgColor: "rgba(247,183,49,0.12)", fee: 4.99, eta: "Minutes", logo: "🟡" },
  { id: "mg", name: "MoneyGram", shortName: "MG", color: "#E74C3C", bgColor: "rgba(231,76,60,0.12)", fee: 3.99, eta: "Minutes", logo: "🔴" },
  { id: "ria", name: "Ria", shortName: "Ria", color: "#27AE60", bgColor: "rgba(39,174,96,0.12)", fee: 2.99, eta: "1–3 hrs", logo: "🟢" },
  { id: "wise", name: "Wise", shortName: "Wise", color: "#9CFADF", bgColor: "rgba(156,250,223,0.10)", fee: 1.50, eta: "1–2 days", logo: "🔵" },
];

export const REMITTANCE_CORRIDORS: RemittanceCorridor[] = [
  { country: "Iraq", flag: "🇮🇶", currency: "IQD", popular: true },
  { country: "Syria", flag: "🇸🇾", currency: "SYP", popular: true },
  { country: "Egypt", flag: "🇪🇬", currency: "EGP", popular: true },
  { country: "India", flag: "🇮🇳", currency: "INR", popular: true },
  { country: "Philippines", flag: "🇵🇭", currency: "PHP", popular: false },
  { country: "Mexico", flag: "🇲🇽", currency: "MXN", popular: false },
  { country: "Nigeria", flag: "🇳🇬", currency: "NGN", popular: false },
  { country: "Pakistan", flag: "🇵🇰", currency: "PKR", popular: false },
  { country: "Bangladesh", flag: "🇧🇩", currency: "BDT", popular: false },
  { country: "Morocco", flag: "🇲🇦", currency: "MAD", popular: false },
  { country: "Turkey", flag: "🇹🇷", currency: "TRY", popular: false },
  { country: "Jordan", flag: "🇯🇴", currency: "JOD", popular: false },
];

export const VIRTUAL_CARDS: VirtualCard[] = [
  { id: "vc1", last4: "4821", network: "Visa", expiry: "03/28", cardHolder: "NEXUS USER", balance: 2_400, isVirtual: true, isFrozen: false, color: ["#E67E22", "#B7460C"] },
  { id: "vc2", last4: "7734", network: "Mastercard", expiry: "11/27", cardHolder: "NEXUS USER", balance: 800, isVirtual: false, isFrozen: false, color: ["#1A1A2E", "#16213E"] },
];

export const WALLET_TRANSACTIONS: WalletTx[] = [
  { id: "t1", label: "MoneyGram Transfer", sub: "To Iraq · IQD", amount: "-$500", value: "-$500.00", time: "Today, 3:41 PM", icon: "send-outline", positive: false, type: "remit" },
  { id: "t2", label: "BTC Purchase", sub: "0.021 BTC @ $94,280", amount: "+0.021 BTC", value: "+$1,980", time: "Today, 2:14 PM", icon: "trending-up-outline", positive: true, type: "crypto" },
  { id: "t3", label: "Card Top-up", sub: "Visa *4821", amount: "+$300", value: "+$300.00", time: "Today, 11:00 AM", icon: "card-outline", positive: true, type: "card" },
  { id: "t4", label: "SEPA Received", sub: "From Marcus Webb", amount: "+€420", value: "+$455.62", time: "Yesterday", icon: "arrow-down-outline", positive: true, type: "receive" },
  { id: "t5", label: "FX Conversion", sub: "USD → EUR @ 0.9218", amount: "1,000 USD", value: "€921.80", time: "Feb 28", icon: "swap-horizontal-outline", positive: true, type: "fx" },
  { id: "t6", label: "Western Union", sub: "To Syria · SYP", amount: "-$200", value: "-$200.00", time: "Feb 27", icon: "send-outline", positive: false, type: "remit" },
  { id: "t7", label: "SOL Staking Reward", sub: "+2.4 SOL", amount: "+$446", value: "+$446.40", time: "Feb 26", icon: "gift-outline", positive: true, type: "crypto" },
  { id: "t8", label: "XRP Received", sub: "From Ahmed Al-Rashid", amount: "+420 XRP", value: "+$882.00", time: "Feb 25", icon: "arrow-down-outline", positive: true, type: "crypto" },
  { id: "t9", label: "AED Transfer", sub: "To Dubai Account", amount: "-د.إ1,200", value: "-$326.78", time: "Feb 24", icon: "send-outline", positive: false, type: "send" },
];

export const CRYPTO_SEED_WORDS = [
  "abandon", "ability", "able", "about", "above", "absent",
  "absorb", "abstract", "absurd", "abuse", "access", "accident",
  "account", "accuse", "achieve", "acid", "acoustic", "acquire",
  "across", "act", "action", "actor", "actual", "adapt",
];

export function generateCandleData(basePrice: number, count: number = 60) {
  const candles = [];
  let price = basePrice;
  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.48) * price * 0.025;
    const open = price;
    price = Math.max(price + change, price * 0.8);
    const high = Math.max(open, price) * (1 + Math.random() * 0.008);
    const low = Math.min(open, price) * (1 - Math.random() * 0.008);
    const vol = 1_000_000 + Math.random() * 5_000_000;
    candles.push({ open, close: price, high, low, vol, time: i });
  }
  return candles;
}
