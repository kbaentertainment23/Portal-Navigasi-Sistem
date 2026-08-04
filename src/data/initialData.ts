import { NavLinkItem, DEFAULT_CATEGORIES, FontOptionId } from '../types';

export const INITIAL_LINKS: Omit<NavLinkItem, 'id'>[] = [];

export const DEFAULT_SETTINGS = {
  adminPassword: 'budiardika25', // Default admin password
  siteTitle: 'Portal Tautan Navigasi Utama',
  siteSubtitle: 'Akses cepat ke seluruh tautan resmi dan informasi penting dalam satu halaman.',
  logoUrl: '',
  fontFamily: 'plus-jakarta' as FontOptionId,
  categories: DEFAULT_CATEGORIES,
  announcementEnabled: false,
  announcementText: 'Pengumuman: Portal Navigasi Resmi Terpadu kini aktif dengan tampilan lebih modern & cepat.',
  announcementType: 'urgent' as const,
  announcementLink: '',
  announcementLinkText: 'Lihat Detail',
  announcementIsDismissible: true,
  enableUrlMasking: false,
};

