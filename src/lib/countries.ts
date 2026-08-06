// Maps trip country names (Hebrew, as typed after the comma in a destination,
// or English) to ISO 3166-1 numeric codes that match the world-atlas topojson
// `id`, plus the ISO alpha-2 code used to render a flag emoji.

export interface CountryEntry {
  num: string; // ISO numeric, 3-digit padded — matches topojson feature id
  iso2: string; // ISO alpha-2 — for the flag emoji
  en: string;
  he: string[]; // Hebrew aliases
}

export const COUNTRIES: CountryEntry[] = [
  { num: "392", iso2: "JP", en: "Japan", he: ["יפן"] },
  { num: "840", iso2: "US", en: "United States", he: ["ארהב", "ארצות הברית", "ארה״ב", "אמריקה"] },
  { num: "250", iso2: "FR", en: "France", he: ["צרפת"] },
  { num: "380", iso2: "IT", en: "Italy", he: ["איטליה"] },
  { num: "724", iso2: "ES", en: "Spain", he: ["ספרד"] },
  { num: "826", iso2: "GB", en: "United Kingdom", he: ["אנגליה", "בריטניה", "אנגליה", "ממלכה מאוחדת"] },
  { num: "276", iso2: "DE", en: "Germany", he: ["גרמניה"] },
  { num: "376", iso2: "IL", en: "Israel", he: ["ישראל"] },
  { num: "300", iso2: "GR", en: "Greece", he: ["יוון"] },
  { num: "764", iso2: "TH", en: "Thailand", he: ["תאילנד", "תאילנד"] },
  { num: "528", iso2: "NL", en: "Netherlands", he: ["הולנד", "ארצות השפלה"] },
  { num: "620", iso2: "PT", en: "Portugal", he: ["פורטוגל"] },
  { num: "756", iso2: "CH", en: "Switzerland", he: ["שווייץ", "שוויץ"] },
  { num: "040", iso2: "AT", en: "Austria", he: ["אוסטריה"] },
  { num: "203", iso2: "CZ", en: "Czechia", he: ["צ׳כיה", "צכיה", "צ'כיה"] },
  { num: "348", iso2: "HU", en: "Hungary", he: ["הונגריה"] },
  { num: "616", iso2: "PL", en: "Poland", he: ["פולין"] },
  { num: "792", iso2: "TR", en: "Turkey", he: ["טורקיה", "תורכיה"] },
  { num: "818", iso2: "EG", en: "Egypt", he: ["מצרים"] },
  { num: "504", iso2: "MA", en: "Morocco", he: ["מרוקו"] },
  { num: "784", iso2: "AE", en: "United Arab Emirates", he: ["איחוד האמירויות", "אמירויות", "דובאי", "דובאי"] },
  { num: "356", iso2: "IN", en: "India", he: ["הודו"] },
  { num: "156", iso2: "CN", en: "China", he: ["סין"] },
  { num: "704", iso2: "VN", en: "Vietnam", he: ["וייטנאם", "ויאטנם"] },
  { num: "360", iso2: "ID", en: "Indonesia", he: ["אינדונזיה", "באלי"] },
  { num: "036", iso2: "AU", en: "Australia", he: ["אוסטרליה"] },
  { num: "554", iso2: "NZ", en: "New Zealand", he: ["ניו זילנד", "ניוזילנד"] },
  { num: "124", iso2: "CA", en: "Canada", he: ["קנדה"] },
  { num: "484", iso2: "MX", en: "Mexico", he: ["מקסיקו"] },
  { num: "076", iso2: "BR", en: "Brazil", he: ["ברזיל"] },
  { num: "032", iso2: "AR", en: "Argentina", he: ["ארגנטינה"] },
  { num: "604", iso2: "PE", en: "Peru", he: ["פרו"] },
  { num: "152", iso2: "CL", en: "Chile", he: ["צ׳ילה", "צילה", "צ'ילה"] },
  { num: "170", iso2: "CO", en: "Colombia", he: ["קולומביה"] },
  { num: "410", iso2: "KR", en: "South Korea", he: ["קוריאה", "דרום קוריאה"] },
  { num: "702", iso2: "SG", en: "Singapore", he: ["סינגפור"] },
  { num: "458", iso2: "MY", en: "Malaysia", he: ["מלזיה"] },
  { num: "608", iso2: "PH", en: "Philippines", he: ["פיליפינים"] },
  { num: "643", iso2: "RU", en: "Russia", he: ["רוסיה"] },
  { num: "752", iso2: "SE", en: "Sweden", he: ["שוודיה", "שבדיה"] },
  { num: "578", iso2: "NO", en: "Norway", he: ["נורווגיה", "נורבגיה"] },
  { num: "208", iso2: "DK", en: "Denmark", he: ["דנמרק"] },
  { num: "246", iso2: "FI", en: "Finland", he: ["פינלנד"] },
  { num: "352", iso2: "IS", en: "Iceland", he: ["איסלנד"] },
  { num: "372", iso2: "IE", en: "Ireland", he: ["אירלנד"] },
  { num: "056", iso2: "BE", en: "Belgium", he: ["בלגיה"] },
  { num: "191", iso2: "HR", en: "Croatia", he: ["קרואטיה"] },
  { num: "642", iso2: "RO", en: "Romania", he: ["רומניה"] },
  { num: "100", iso2: "BG", en: "Bulgaria", he: ["בולגריה"] },
  { num: "196", iso2: "CY", en: "Cyprus", he: ["קפריסין"] },
  { num: "268", iso2: "GE", en: "Georgia", he: ["גאורגיה", "גרוזיה"] },
  { num: "400", iso2: "JO", en: "Jordan", he: ["ירדן"] },
  { num: "710", iso2: "ZA", en: "South Africa", he: ["דרום אפריקה"] },
  { num: "404", iso2: "KE", en: "Kenya", he: ["קניה"] },
  { num: "834", iso2: "TZ", en: "Tanzania", he: ["טנזניה"] },
  { num: "144", iso2: "LK", en: "Sri Lanka", he: ["סרי לנקה"] },
  { num: "524", iso2: "NP", en: "Nepal", he: ["נפאל"] },
  { num: "116", iso2: "KH", en: "Cambodia", he: ["קמבודיה"] },
  { num: "418", iso2: "LA", en: "Laos", he: ["לאוס"] },
  { num: "634", iso2: "QA", en: "Qatar", he: ["קטאר", "קטר"] },
  { num: "682", iso2: "SA", en: "Saudi Arabia", he: ["ערב הסעודית", "סעודיה"] },
  { num: "192", iso2: "CU", en: "Cuba", he: ["קובה"] },
  { num: "188", iso2: "CR", en: "Costa Rica", he: ["קוסטה ריקה", "קוסטה ריקה"] },
  { num: "858", iso2: "UY", en: "Uruguay", he: ["אורוגוואי"] },
  { num: "705", iso2: "SI", en: "Slovenia", he: ["סלובניה"] },
  { num: "703", iso2: "SK", en: "Slovakia", he: ["סלובקיה"] },
  { num: "440", iso2: "LT", en: "Lithuania", he: ["ליטא"] },
  { num: "428", iso2: "LV", en: "Latvia", he: ["לטביה"] },
  { num: "233", iso2: "EE", en: "Estonia", he: ["אסטוניה"] },
  { num: "688", iso2: "RS", en: "Serbia", he: ["סרביה"] },
  { num: "008", iso2: "AL", en: "Albania", he: ["אלבניה"] },
  { num: "499", iso2: "ME", en: "Montenegro", he: ["מונטנגרו"] },
  { num: "807", iso2: "MK", en: "North Macedonia", he: ["מקדוניה"] },
];

// Normalize a string for loose matching: strip Hebrew geresh/gershayim,
// quotes, punctuation and whitespace, lowercase.
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/["'`׳״.,\-־()]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

const LOOKUP = new Map<string, CountryEntry>();
for (const c of COUNTRIES) {
  LOOKUP.set(norm(c.en), c);
  for (const h of c.he) LOOKUP.set(norm(h), c);
}

// Resolve a free-text country name (Hebrew or English) to its entry, or null.
export function resolveCountry(input: string | null | undefined): CountryEntry | null {
  if (!input) return null;
  return LOOKUP.get(norm(input)) ?? null;
}

const NUM_TO_ISO2 = new Map(COUNTRIES.map((c) => [c.num, c.iso2]));
export function iso2ForNumeric(num: string): string | null {
  return NUM_TO_ISO2.get(num) ?? null;
}

// Build a flag emoji from an ISO alpha-2 code (regional indicator symbols).
export function flagEmoji(iso2: string): string {
  if (!iso2 || iso2.length !== 2) return "🏳️";
  const A = 0x1f1e6;
  const base = "A".charCodeAt(0);
  return String.fromCodePoint(
    A + (iso2.toUpperCase().charCodeAt(0) - base),
    A + (iso2.toUpperCase().charCodeAt(1) - base)
  );
}
