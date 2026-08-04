export type LinkColor = 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'cyan' | 'blue' | 'slate';

export interface NavLinkItem {
  id: string;
  title: string;
  url: string;
  description?: string;
  category: string;
  icon: string;
  color: LinkColor;
  order: number;
  isActive: boolean;
  isFeatured?: boolean;
  isLocked?: boolean;
  pinCode?: string;
  isStealthMode?: boolean; // Tautan Disamarkan (Stealth Mode) khusus link ini
  
  // Penjadwalan Otomatis Tautan (Scheduled Links)
  isScheduled?: boolean;
  startDate?: string; // e.g. "2026-08-01T08:00"
  endDate?: string;   // e.g. "2026-08-31T23:59"
  expiredAction?: 'hide' | 'lock'; // 'hide' = Sembunyikan otomatis, 'lock' = Tampilkan tapi kunci akses

  clicks: number;
  createdAt?: string;
  updatedAt?: string;
}

export type ThemePaletteId = 'emerald' | 'blue' | 'amber' | 'purple' | 'rose' | 'slate';

export interface ThemePalette {
  id: ThemePaletteId;
  name: string;
  description: string;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  bgHex: string;
  previewGradient: string;
}

export const THEME_PALETTES: ThemePalette[] = [
  {
    id: 'emerald',
    name: 'Tropical Emerald',
    description: 'Nuansa hijau tropis & emas, segar & profesional (Default)',
    primaryHex: '#047857',
    secondaryHex: '#D97706',
    accentHex: '#059669',
    bgHex: '#F4F8F5',
    previewGradient: 'from-emerald-700 via-emerald-600 to-amber-500',
  },
  {
    id: 'blue',
    name: 'Ocean Sapphire',
    description: 'Nuansa biru samudra & cyan, modern & terpercaya',
    primaryHex: '#1D4ED8',
    secondaryHex: '#0284C7',
    accentHex: '#2563EB',
    bgHex: '#F0F6FE',
    previewGradient: 'from-blue-700 via-sky-600 to-indigo-500',
  },
  {
    id: 'amber',
    name: 'Sunset Amber',
    description: 'Nuansa terakota & emas hangat, mewah & elegan',
    primaryHex: '#B45309',
    secondaryHex: '#C2410C',
    accentHex: '#D97706',
    bgHex: '#FAF6EE',
    previewGradient: 'from-amber-700 via-orange-600 to-yellow-500',
  },
  {
    id: 'purple',
    name: 'Royal Violet',
    description: 'Nuansa ungu bangsawan & fuchsia, eksklusif & kreatif',
    primaryHex: '#7E22CE',
    secondaryHex: '#C026D3',
    accentHex: '#9333EA',
    bgHex: '#F7F4FA',
    previewGradient: 'from-purple-800 via-fuchsia-600 to-violet-500',
  },
  {
    id: 'rose',
    name: 'Crimson Rose',
    description: 'Nuansa merah crimson & karang, berani & dinamis',
    primaryHex: '#BE123C',
    secondaryHex: '#E11D48',
    accentHex: '#E11D48',
    bgHex: '#FAF4F5',
    previewGradient: 'from-rose-800 via-red-600 to-pink-500',
  },
  {
    id: 'slate',
    name: 'Monochrome Slate',
    description: 'Nuansa arang & perak, minimalis, bersih & futuristik',
    primaryHex: '#334155',
    secondaryHex: '#0F172A',
    accentHex: '#475569',
    bgHex: '#F3F4F6',
    previewGradient: 'from-slate-800 via-slate-700 to-zinc-600',
  },
];

export const DEFAULT_CATEGORIES: string[] = [
  'Utama',
  'Layanan',
  'Sosial Media',
  'Dokumen & File',
  'Sistem IT',
  'Lainnya',
];

export type AnnouncementType = 'info' | 'warning' | 'urgent' | 'success';

export interface SiteSettings {
  adminPassword: string;
  siteTitle: string;
  siteSubtitle: string;
  logoUrl?: string;
  themePalette?: ThemePaletteId;
  fontFamily?: FontOptionId;
  categories?: string[];
  customIcons?: string[];
  isLocked?: boolean;
  lockMessage?: string;
  
  // Widget Banner Pengumuman Penting (Announcement Bar)
  announcementEnabled?: boolean;
  announcementText?: string;
  announcementType?: AnnouncementType;
  announcementLink?: string;
  announcementLinkText?: string;
  announcementIsDismissible?: boolean;

  // Feature Penyamaran & Proteksi URL (Stealth URL Masking)
  enableUrlMasking?: boolean;

  updatedAt?: string;
}

export type FontOptionId = 'plus-jakarta' | 'inter' | 'montserrat' | 'poppins' | 'outfit' | 'roboto' | 'lato' | 'playfair';

export interface FontOption {
  id: FontOptionId;
  name: string;
  family: string;
  googleFontQuery: string;
  sampleText: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { id: 'plus-jakarta', name: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif", googleFontQuery: 'Plus+Jakarta+Sans:wght@400;500;600;700;800', sampleText: 'Modern, Bersih & Profesional (Default)' },
  { id: 'inter', name: 'Inter', family: "'Inter', sans-serif", googleFontQuery: 'Inter:wght@400;500;600;700;800', sampleText: 'Presisi Tinggi & Sangat Jelas' },
  { id: 'montserrat', name: 'Montserrat', family: "'Montserrat', sans-serif", googleFontQuery: 'Montserrat:wght@400;500;600;700;800', sampleText: 'Geometris & Elegan Minimalis' },
  { id: 'poppins', name: 'Poppins', family: "'Poppins', sans-serif", googleFontQuery: 'Poppins:wght@400;500;600;700;800', sampleText: 'Ramah, Bulat & Kontemporer' },
  { id: 'outfit', name: 'Outfit', family: "'Outfit', sans-serif", googleFontQuery: 'Outfit:wght@400;500;600;700;800', sampleText: 'Futuristik & Sangat Rapi' },
  { id: 'roboto', name: 'Roboto', family: "'Roboto', sans-serif", googleFontQuery: 'Roboto:wght@400;500;700', sampleText: 'Netral & Mudah Dibaca' },
  { id: 'lato', name: 'Lato', family: "'Lato', sans-serif", googleFontQuery: 'Lato:wght@400;700;900', sampleText: 'Hangat & Terstruktur' },
  { id: 'playfair', name: 'Playfair Display', family: "'Playfair Display', serif", googleFontQuery: 'Playfair+Display:wght@500;600;700;800', sampleText: 'Klasik, Mewah & Premium' },
];

export const CATEGORIES = [
  'Semua',
  ...DEFAULT_CATEGORIES,
] as const;

export const ICON_OPTIONS = [
  { id: 'Globe', label: 'Website / Web' },
  { id: 'ExternalLink', label: 'Tautan Luar' },
  { id: 'MessageCircle', label: 'WhatsApp / Chat' },
  { id: 'Instagram', label: 'Instagram' },
  { id: 'Youtube', label: 'YouTube' },
  { id: 'Facebook', label: 'Facebook' },
  { id: 'FileText', label: 'Dokumen / PDF' },
  { id: 'Folder', label: 'Folder / Drive' },
  { id: 'Shield', label: 'Portal Keamanan' },
  { id: 'Database', label: 'Database / Sistem' },
  { id: 'Mail', label: 'Email / Kontak' },
  { id: 'Phone', label: 'Telepon' },
  { id: 'ShoppingBag', label: 'Toko / Marketplace' },
  { id: 'Calendar', label: 'Jadwal / Agensi' },
  { id: 'HelpCircle', label: 'Pusat Bantuan' },
  { id: 'Star', label: 'Bintang / Utama' },
] as const;

export const COLOR_PRESETS: { id: LinkColor; name: string; bg: string; text: string; border: string; hoverBg: string }[] = [
  { id: 'emerald', name: 'Emerald Hijau', bg: 'bg-emerald-50/80', text: 'text-emerald-800', border: 'border-emerald-200', hoverBg: 'hover:bg-emerald-100' },
  { id: 'amber', name: 'Emas / Gold', bg: 'bg-amber-50/80', text: 'text-amber-800', border: 'border-amber-200', hoverBg: 'hover:bg-amber-100' },
  { id: 'indigo', name: 'Hijau Zamrud', bg: 'bg-teal-50/80', text: 'text-teal-800', border: 'border-teal-200', hoverBg: 'hover:bg-teal-100' },
  { id: 'blue', name: 'Biru Soft', bg: 'bg-sky-50/80', text: 'text-sky-800', border: 'border-sky-200', hoverBg: 'hover:bg-sky-100' },
  { id: 'rose', name: 'Rose Merah', bg: 'bg-rose-50/80', text: 'text-rose-800', border: 'border-rose-200', hoverBg: 'hover:bg-rose-100' },
  { id: 'purple', name: 'Purple Elegant', bg: 'bg-purple-50/80', text: 'text-purple-800', border: 'border-purple-200', hoverBg: 'hover:bg-purple-100' },
  { id: 'cyan', name: 'Cyan Toska', bg: 'bg-cyan-50/80', text: 'text-cyan-800', border: 'border-cyan-200', hoverBg: 'hover:bg-cyan-100' },
  { id: 'slate', name: 'Cream Netral', bg: 'bg-[#FAF6EE]', text: 'text-slate-800', border: 'border-amber-200/80', hoverBg: 'hover:bg-[#F5EFE2]' },
];
