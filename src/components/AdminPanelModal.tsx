import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Edit3,
  Trash2,
  Power,
  Settings,
  Link as LinkIcon,
  Shield,
  Key,
  BarChart2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Save,
  Globe,
  Sparkles,
  Search,
  Lock,
  Unlock,
  Upload,
  Palette,
  Tag,
  FolderPlus,
  Check,
  Database,
  HardDrive,
  Server,
  RefreshCw,
  AlertTriangle,
  Zap,
  Layers,
  Type,
  Megaphone,
  Bell,
  Calendar,
  Clock,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { NavLinkItem, SiteSettings, THEME_PALETTES, ThemePaletteId, DEFAULT_CATEGORIES, FONT_OPTIONS, FontOptionId, AnnouncementType } from '../types';
import { DynamicIcon } from './DynamicIcon';
import { getScheduleStatus } from '../lib/scheduleUtils';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminLogout?: () => void;
  links: NavLinkItem[];
  settings: SiteSettings;
  onAddLink: () => void;
  onEditLink: (link: NavLinkItem) => void;
  onDeleteLink: (linkId: string) => void;
  onToggleActive: (link: NavLinkItem) => void;
  onToggleLock?: (link: NavLinkItem) => void;
  onToggleStealth?: (link: NavLinkItem) => void;
  onMoveOrder: (link: NavLinkItem, direction: 'up' | 'down') => void;
  onUpdateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
  onResetSeedData?: () => Promise<void>;
  onResetClickStats: () => Promise<void>;
  onResetSingleLinkClicks?: (linkId: string) => Promise<void>;
  onBatchUpdateLinkCategories?: (categoryUpdates: { linkId: string; newCategory: string }[]) => Promise<void>;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  onAdminLogout,
  links,
  settings,
  onAddLink,
  onEditLink,
  onDeleteLink,
  onToggleActive,
  onToggleLock,
  onToggleStealth,
  onMoveOrder,
  onUpdateSettings,
  onResetClickStats,
  onResetSingleLinkClicks,
  onBatchUpdateLinkCategories,
}) => {
  const [activeTab, setActiveTab] = useState<'crud' | 'categories' | 'settings' | 'stats' | 'database'>('crud');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Category Management State
  const [categoryList, setCategoryList] = useState<string[]>(
    settings.categories && settings.categories.length > 0
      ? settings.categories
      : DEFAULT_CATEGORIES
  );
  const [categoryRenames, setCategoryRenames] = useState<Record<string, string>>({});
  const [newCatInput, setNewCatInput] = useState('');
  const [editingCatIdx, setEditingCatIdx] = useState<number | null>(null);
  const [editingCatVal, setEditingCatVal] = useState('');
  const [catMsg, setCatMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Settings Form State
  const [newTitle, setNewTitle] = useState(settings.siteTitle);
  const [newSubtitle, setNewSubtitle] = useState(settings.siteSubtitle);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Announcement Bar Form State
  const [announcementEnabled, setAnnouncementEnabled] = useState(settings.announcementEnabled ?? false);
  const [announcementText, setAnnouncementText] = useState(settings.announcementText || '');
  const [announcementType, setAnnouncementType] = useState<AnnouncementType>(settings.announcementType || 'urgent');
  const [announcementLink, setAnnouncementLink] = useState(settings.announcementLink || '');
  const [announcementLinkText, setAnnouncementLinkText] = useState(settings.announcementLinkText || '');
  const [announcementIsDismissible, setAnnouncementIsDismissible] = useState(settings.announcementIsDismissible ?? true);
  const [enableUrlMasking, setEnableUrlMasking] = useState<boolean>(settings.enableUrlMasking ?? true);
  
  // Feedback & Reset Modal states
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dbMsg, setDbMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [confirmResetClickTarget, setConfirmResetClickTarget] = useState<{
    link: NavLinkItem | null;
    type: 'single' | 'all';
  } | null>(null);

  useEffect(() => {
    setNewTitle(settings.siteTitle);
    setNewSubtitle(settings.siteSubtitle);
    if (settings.categories && settings.categories.length > 0) {
      setCategoryList(settings.categories);
    }
    setAnnouncementEnabled(settings.announcementEnabled ?? false);
    setAnnouncementText(settings.announcementText || '');
    setAnnouncementType(settings.announcementType || 'urgent');
    setAnnouncementLink(settings.announcementLink || '');
    setAnnouncementLinkText(settings.announcementLinkText || '');
    setAnnouncementIsDismissible(settings.announcementIsDismissible ?? true);
    setEnableUrlMasking(settings.enableUrlMasking ?? true);
  }, [settings]);

  // Category Handlers
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatInput.trim();
    if (!trimmed) {
      setCatMsg({ type: 'error', text: 'Nama kategori tidak boleh kosong.' });
      return;
    }
    if (categoryList.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setCatMsg({ type: 'error', text: 'Kategori dengan nama tersebut sudah ada.' });
      return;
    }
    setCategoryList([...categoryList, trimmed]);
    setNewCatInput('');
    setCatMsg({ type: 'success', text: `Kategori "${trimmed}" ditambahkan. Klik "Simpan Perubahan Kategori" untuk memperbarui database.` });
  };

  const handleStartEditCategory = (index: number) => {
    setEditingCatIdx(index);
    setEditingCatVal(categoryList[index]);
  };

  const handleSaveEditCategory = (index: number) => {
    const trimmed = editingCatVal.trim();
    if (!trimmed) {
      setCatMsg({ type: 'error', text: 'Nama kategori tidak boleh kosong.' });
      return;
    }
    const oldName = categoryList[index];
    if (oldName !== trimmed && categoryList.some((c, i) => i !== index && c.toLowerCase() === trimmed.toLowerCase())) {
      setCatMsg({ type: 'error', text: 'Nama kategori tersebut sudah digunakan.' });
      return;
    }
    if (oldName !== trimmed) {
      setCategoryRenames((prev) => ({ ...prev, [oldName]: trimmed }));
    }
    const updated = [...categoryList];
    updated[index] = trimmed;
    setCategoryList(updated);
    setEditingCatIdx(null);
    setEditingCatVal('');
    setCatMsg({ type: 'success', text: `Kategori diubah menjadi "${trimmed}". Klik "Simpan Perubahan Kategori" untuk memperbarui database.` });
  };

  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= categoryList.length) return;
    const updated = [...categoryList];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    setCategoryList(updated);
  };

  const handleDeleteCategory = (index: number) => {
    const catToDelete = categoryList[index];
    const updated = categoryList.filter((_, i) => i !== index);
    setCategoryList(updated);
    setCatMsg({ type: 'success', text: `Kategori "${catToDelete}" dihapus. Klik "Simpan Perubahan Kategori" di bawah untuk memperbarui database.` });
  };

  const handleResetCategoriesToDefault = () => {
    setCategoryList(DEFAULT_CATEGORIES);
    setCatMsg({ type: 'success', text: 'Daftar kategori dikembalikan ke standar awal. Klik "Simpan Perubahan Kategori" di bawah untuk memperbarui database.' });
  };

  const handleSaveCategoriesToDatabase = async () => {
    if (categoryList.length === 0) {
      setCatMsg({ type: 'error', text: 'Daftar kategori minimal harus memiliki 1 item.' });
      return;
    }
    setIsSubmitting(true);
    setCatMsg(null);
    try {
      await onUpdateSettings({ categories: categoryList });

      // Automatically migrate links with renamed or deleted categories
      const linkUpdates: { linkId: string; newCategory: string }[] = [];
      const fallbackCat = categoryList[0] || 'Utama';

      links.forEach((link) => {
        let targetCat = link.category;
        if (categoryRenames[link.category]) {
          targetCat = categoryRenames[link.category];
        } else if (!categoryList.includes(link.category)) {
          targetCat = fallbackCat;
        }

        if (targetCat !== link.category) {
          linkUpdates.push({ linkId: link.id, newCategory: targetCat });
        }
      });

      if (linkUpdates.length > 0 && onBatchUpdateLinkCategories) {
        await onBatchUpdateLinkCategories(linkUpdates);
      }

      setCategoryRenames({});
      setCatMsg({
        type: 'success',
        text: `Daftar kategori berhasil disimpan ke database Firebase${
          linkUpdates.length > 0 ? ` (${linkUpdates.length} tautan disesuaikan)` : ''
        }!`,
      });
    } catch (err) {
      console.error(err);
      setCatMsg({ type: 'error', text: 'Gagal menyimpan kategori ke database.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSettingsMsg({ type: 'error', text: 'File harus berupa gambar (PNG, JPG, WEBP, dll).' });
      return;
    }

    setIsUploadingLogo(true);
    setSettingsMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        // Create canvas to resize image (max 250x250)
        const canvas = document.createElement('canvas');
        const maxDim = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/png', 0.9);
          try {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('pending_logo_preview', compressedBase64);
            }
            await onUpdateSettings({ logoUrl: compressedBase64 });
            setSettingsMsg({ type: 'success', text: 'Logo berhasil diunggah & disimpan di database!' });
          } catch (err) {
            console.error(err);
            setSettingsMsg({ type: 'error', text: 'Gagal menyimpan logo ke database.' });
          } finally {
            setIsUploadingLogo(false);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus logo dan kembali ke ikon bawaan?')) return;
    setIsSubmitting(true);
    setSettingsMsg(null);
    try {
      await onUpdateSettings({ logoUrl: '' });
      setSettingsMsg({ type: 'success', text: 'Logo berhasil dihapus. Menggunakan ikon bawaan.' });
    } catch (err) {
      console.error(err);
      setSettingsMsg({ type: 'error', text: 'Gagal menghapus logo.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLinks = links.filter(
    (l) =>
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);
  const activeCount = links.filter((l) => l.isActive).length;

  const handleSaveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSettingsMsg(null);
    try {
      await onUpdateSettings({
        siteTitle: newTitle,
        siteSubtitle: newSubtitle,
      });
      setSettingsMsg({ type: 'success', text: 'Pengaturan judul & subtitle berhasil diperbarui!' });
    } catch (err) {
      setSettingsMsg({ type: 'error', text: 'Gagal memperbarui pengaturan.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleUrlMasking = async (enabled: boolean) => {
    setEnableUrlMasking(enabled);
    setIsSubmitting(true);
    setSettingsMsg(null);
    try {
      await onUpdateSettings({ enableUrlMasking: enabled });
      setSettingsMsg({
        type: 'success',
        text: enabled
          ? 'Fitur Penyamaran URL & Proteksi Copy Link (Stealth Mode) Aktif!'
          : 'Penyamaran URL dinonaktifkan.',
      });
    } catch (err) {
      console.error(err);
      setSettingsMsg({ type: 'error', text: 'Gagal memperbarui pengaturan penyamaran URL.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAnnouncementSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSettingsMsg(null);
    try {
      // Clear dismissal memory so the banner displays immediately
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('announcement_dismissed_key');
      }

      await onUpdateSettings({
        announcementEnabled,
        announcementText: announcementText.trim(),
        announcementType,
        announcementLink: announcementLink.trim(),
        announcementLinkText: announcementLinkText.trim(),
        announcementIsDismissible,
      });
      setSettingsMsg({
        type: 'success',
        text: 'Banner pengumuman penting berhasil disimpan & ditampilkan di header!',
      });
    } catch (err) {
      console.error(err);
      setSettingsMsg({ type: 'error', text: 'Gagal memperbarui banner pengumuman.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPalette = async (paletteId: ThemePaletteId) => {
    setIsSubmitting(true);
    setSettingsMsg(null);
    try {
      // Instantly save to localStorage for persistence across refreshes
      localStorage.setItem('app_theme_palette', paletteId);
      
      // Update DOM CSS variables & data-theme attribute immediately
      const palette = THEME_PALETTES.find((p) => p.id === paletteId) || THEME_PALETTES[0];
      document.documentElement.style.setProperty('--theme-bg', palette.bgHex);
      document.documentElement.style.setProperty('--theme-primary', palette.primaryHex);
      document.documentElement.style.setProperty('--theme-secondary', palette.secondaryHex);
      document.documentElement.style.setProperty('--theme-accent', palette.accentHex || palette.primaryHex);
      document.documentElement.setAttribute('data-theme', palette.id);
      document.body.setAttribute('data-theme', palette.id);

      await onUpdateSettings({ themePalette: paletteId });
      setSettingsMsg({
        type: 'success',
        text: `Palet warna berhasil diubah ke "${palette.name}" dan tersimpan di database!`,
      });
    } catch (err) {
      console.error(err);
      setSettingsMsg({ type: 'error', text: 'Gagal memperbarui palet warna.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectFont = async (fontId: FontOptionId) => {
    setIsSubmitting(true);
    setSettingsMsg(null);
    try {
      const fontObj = FONT_OPTIONS.find((f) => f.id === fontId) || FONT_OPTIONS[0];
      
      // Inject Google Font link tag dynamically
      const linkId = 'dynamic-google-font-stylesheet';
      let linkElem = document.getElementById(linkId) as HTMLLinkElement | null;
      if (!linkElem) {
        linkElem = document.createElement('link');
        linkElem.id = linkId;
        linkElem.rel = 'stylesheet';
        document.head.appendChild(linkElem);
      }
      linkElem.href = `https://fonts.googleapis.com/css2?family=${fontObj.googleFontQuery}&display=swap`;

      document.body.style.fontFamily = fontObj.family;
      document.documentElement.style.fontFamily = fontObj.family;

      await onUpdateSettings({ fontFamily: fontId });
      setSettingsMsg({
        type: 'success',
        text: `Tipografi font berhasil diubah ke "${fontObj.name}" dan diterapkan ke seluruh UI!`,
      });
    } catch (err) {
      console.error(err);
      setSettingsMsg({ type: 'error', text: 'Gagal memperbarui font tipografi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMsg(null);

    if (currentPass !== settings.adminPassword) {
      setSettingsMsg({ type: 'error', text: 'Password lama tidak cocok!' });
      return;
    }
    if (!newPass || newPass.length < 4) {
      setSettingsMsg({ type: 'error', text: 'Password baru minimal 4 karakter.' });
      return;
    }
    if (newPass !== confirmPass) {
      setSettingsMsg({ type: 'error', text: 'Konfirmasi password baru tidak cocok.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdateSettings({ adminPassword: newPass });
      setSettingsMsg({ type: 'success', text: 'Password admin berhasil diubah!' });
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err) {
      setSettingsMsg({ type: 'error', text: 'Gagal mengubah password admin.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetClicks = async () => {
    if (totalClicks === 0) return;
    if (!window.confirm('Apakah Anda yakin ingin mereset seluruh hitungan interaksi klik tautan ke 0?')) {
      return;
    }
    setIsSubmitting(true);
    setSettingsMsg(null);
    try {
      await onResetClickStats();
      setSettingsMsg({ type: 'success', text: 'Semua hitungan interaksi klik berhasil di-reset ke 0!' });
    } catch (err) {
      setSettingsMsg({ type: 'error', text: 'Gagal mereset statistik klik.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSingleLink = async (link: NavLinkItem) => {
    if (!link.clicks || link.clicks === 0) return;
    if (!window.confirm(`Reset hitungan klik untuk link "${link.title}" ke 0?`)) return;
    setIsSubmitting(true);
    setSettingsMsg(null);
    try {
      if (onResetSingleLinkClicks) {
        await onResetSingleLinkClicks(link.id);
      }
      setSettingsMsg({ type: 'success', text: `Klik untuk "${link.title}" berhasil di-reset ke 0!` });
    } catch (err) {
      setSettingsMsg({ type: 'error', text: 'Gagal mereset statistik klik.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            className="relative w-full max-w-6xl 2xl:max-w-7xl h-[90vh] max-h-[920px] min-h-[500px] bg-white rounded-3xl shadow-2xl border border-emerald-100/90 my-auto overflow-hidden flex flex-col transition-all duration-300"
          >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-emerald-100 bg-emerald-50/60">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-800 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 border border-amber-400/30">
                <Shield className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Panel Kontrol Admin</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold border border-emerald-300">
                    Firebase Connected
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Kelola tautan navigasi, otentikasi, dan konfigurasi situs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onAdminLogout && (
                <button
                  type="button"
                  onClick={() => {
                    onAdminLogout();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl text-xs font-extrabold border border-rose-200 transition-colors shadow-2xs active:scale-95"
                  title="Keluar dari Mode Admin"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden xs:inline">Keluar Admin</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-emerald-100 bg-emerald-50/30 px-5 gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('crud')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'crud'
                  ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl shadow-xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <LinkIcon className="w-4 h-4 text-emerald-600" />
              <span>Kelola Link ({links.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'categories'
                  ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl shadow-xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tag className="w-4 h-4 text-emerald-700" />
              <span>Kelola Kategori ({categoryList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl shadow-xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-4 h-4 text-amber-600" />
              <span>Pengaturan & Keamanan</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'stats'
                  ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl shadow-xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-4 h-4 text-emerald-600" />
              <span>Analitik Klik</span>
            </button>

            <button
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'database'
                  ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl shadow-xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-4 h-4 text-emerald-700" />
              <span>Database & Pemeliharaan</span>
            </button>
          </div>

          {/* Tab Contents */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
            {/* TAB 1: CRUD LINKS */}
            {activeTab === 'crud' && (
              <div className="space-y-4">
                {/* Search & Add Header */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-emerald-700/70" />
                    <input
                      type="text"
                      placeholder="Cari link berdasarkan judul, URL, atau kategori..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetClicks}
                      disabled={isSubmitting || totalClicks === 0}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300/80 disabled:opacity-40 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95"
                      title="Reset statistik klik seluruh link ke 0"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                      <span>Reset Klik ({totalClicks})</span>
                    </button>

                    <button
                      onClick={onAddLink}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-sm border border-amber-400/40 transition-all shrink-0 active:scale-95"
                    >
                      <Plus className="w-4 h-4 text-amber-300" />
                      <span>Tambah Link Baru</span>
                    </button>
                  </div>
                </div>

                {/* Link Table / List */}
                {filteredLinks.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200">
                    <LinkIcon className="w-8 h-8 mx-auto text-emerald-700/60 mb-2" />
                    <p className="text-sm font-bold text-slate-800">
                      Belum Ada Link
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Klik tombol "Tambah Link Baru" di atas untuk memublikasikan tautan navigasi.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/90 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3 px-3 w-16 text-center">Urutan</th>
                          <th className="py-3 px-4">Info Link</th>
                          <th className="py-3 px-3">Kategori</th>
                          <th className="py-3 px-3 text-center">Klik</th>
                          <th className="py-3 px-3 text-center">Status</th>
                          <th className="py-3 px-3 text-center">Keamanan</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredLinks.map((link, index) => (
                          <tr
                            key={link.id}
                            className={`hover:bg-emerald-50/40 transition-colors ${
                              !link.isActive ? 'bg-slate-50/60 opacity-80' : 'bg-white'
                            }`}
                          >
                            {/* Order */}
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <span className="w-6 h-6 rounded-lg bg-slate-100 text-[11px] font-bold text-slate-700 flex items-center justify-center border border-slate-200">
                                  {link.order}
                                </span>
                                <div className="flex flex-col gap-0.5">
                                  <button
                                    onClick={() => onMoveOrder(link, 'up')}
                                    disabled={index === 0}
                                    className="p-0.5 text-slate-500 hover:text-emerald-800 disabled:opacity-20 rounded transition-colors"
                                    title="Naikkan Urutan"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => onMoveOrder(link, 'down')}
                                    disabled={index === filteredLinks.length - 1}
                                    className="p-0.5 text-slate-500 hover:text-emerald-800 disabled:opacity-20 rounded transition-colors"
                                    title="Turunkan Urutan"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Title & URL */}
                            <td className="py-3 px-4">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 shrink-0 mt-0.5 border border-emerald-100 shadow-2xs">
                                  <DynamicIcon name={link.icon} className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 max-w-xs sm:max-w-md">
                                  <div className="font-bold text-slate-900 truncate flex items-center gap-1.5 text-sm">
                                    <span>{link.title}</span>
                                    {link.isStealthMode && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-300" title="Penyamaran Tautan (Stealth Mode) Aktif">
                                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                                        Disamarkan
                                      </span>
                                    )}
                                    {link.isFeatured && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold border border-amber-300">
                                        <Sparkles className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                                        Unggulan
                                      </span>
                                    )}
                                    {link.isLocked && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-800 text-[10px] font-extrabold border border-rose-300">
                                        <Lock className="w-2.5 h-2.5 text-rose-600" />
                                        Locked
                                      </span>
                                    )}
                                    {(() => {
                                      const scheduleStatus = getScheduleStatus(link);
                                      if (!scheduleStatus.isScheduled) return null;
                                      return (
                                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md text-[10px] font-extrabold border ${scheduleStatus.badgeBg} ${scheduleStatus.badgeText} ${scheduleStatus.badgeBorder}`}>
                                          <Clock className="w-2.5 h-2.5" />
                                          {scheduleStatus.badgeLabel}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-slate-500 hover:text-emerald-800 truncate block mt-0.5 hover:underline"
                                  >
                                    {link.url}
                                  </a>
                                  {link.isScheduled && (
                                    <div className="text-[10px] font-semibold text-sky-800 mt-1 flex items-center gap-1 bg-sky-50 px-2 py-0.5 rounded border border-sky-200/60 w-fit">
                                      <Calendar className="w-3 h-3 text-sky-600" />
                                      <span>
                                        Jadwal: {link.startDate ? new Date(link.startDate).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : 'Langsung'}
                                        {' - '}
                                        {link.endDate ? new Date(link.endDate).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : 'Tanpa batas'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="py-3 px-3">
                              <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                {link.category}
                              </span>
                            </td>

                            {/* Clicks */}
                            <td className="py-3 px-3 text-center">
                              <div className="inline-flex items-center gap-1 justify-center">
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                                  {link.clicks || 0}
                                </span>
                                {(link.clicks || 0) > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmResetClickTarget({ link, type: 'single' })}
                                    disabled={isSubmitting}
                                    className="p-1 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200"
                                    title={`Reset hitungan klik untuk "${link.title}" ke 0`}
                                  >
                                    <RotateCcw className="w-3 h-3 text-amber-600" />
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => onToggleActive(link)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                  link.isActive
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                }`}
                              >
                                <Power className={`w-3 h-3 ${link.isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span>{link.isActive ? 'Aktif' : 'Off'}</span>
                              </button>
                            </td>

                            {/* Kunci Link Status */}
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => onToggleLock && onToggleLock(link)}
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                    link.isLocked
                                      ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                  }`}
                                  title={
                                    link.isLocked
                                      ? `LINK TERKUNCI! ${link.pinCode ? `(PIN: ${link.pinCode})` : '(Tanpa PIN)'}. Klik untuk Membuka.`
                                      : 'LINK TERBUKA untuk publik. Klik untuk Mengunci.'
                                  }
                                >
                                  {link.isLocked ? (
                                    <>
                                      <Lock className="w-3 h-3 text-rose-600 shrink-0" />
                                      <span>{link.pinCode ? `PIN` : 'Locked'}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Unlock className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span>Publik</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onToggleStealth && onToggleStealth(link)}
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                    link.isStealthMode
                                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                  }`}
                                  title={
                                    link.isStealthMode
                                      ? 'TAUTAN DISAMARKAN (Stealth Mode Aktif). Klik untuk menonaktifkan penyamaran.'
                                      : 'TAUTAN TANPA PENYAMARAN (Buka langsung). Klik untuk mengaktifkan penyamaran URL.'
                                  }
                                >
                                  <ShieldCheck className={`w-3 h-3 ${link.isStealthMode ? 'text-emerald-700' : 'text-slate-400'}`} />
                                  <span>{link.isStealthMode ? 'Stealth' : 'Direct'}</span>
                                </button>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => onEditLink(link)}
                                  className="p-1.5 text-slate-600 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 border border-slate-200 rounded-lg transition-colors"
                                  title="Edit Link"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteLink(link.id)}
                                  className="p-1.5 text-slate-600 bg-slate-100 hover:bg-rose-100 hover:text-rose-800 border border-slate-200 rounded-lg transition-colors"
                                  title="Hapus Link"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: KELOLA KATEGORI */}
            {activeTab === 'categories' && (
              <div className="space-y-5 max-w-4xl mx-auto">
                {/* Header Banner */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white rounded-2xl shadow-sm border border-amber-400/30">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 bg-white/10 rounded-xl border border-white/15 shrink-0">
                      <FolderPlus className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-white">
                        Pengaturan Kategori Navigasi
                      </h3>
                      <p className="text-xs text-emerald-100/90 mt-1 leading-relaxed">
                        Kategori ini akan digunakan sebagai filter pada beranda utama serta pilihan kategori saat membuat/mengedit tautan link.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feedback Message */}
                {catMsg && (
                  <div
                    className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-semibold border transition-all ${
                      catMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        : 'bg-rose-50 text-rose-900 border-rose-300'
                    }`}
                  >
                    {catMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{catMsg.text}</span>
                  </div>
                )}

                {/* Form Tambah Kategori Baru */}
                <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row items-stretch gap-2.5 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 absolute left-3.5 top-3 text-emerald-700" />
                    <input
                      type="text"
                      placeholder="Masukkan nama kategori baru (misal: Portal Alumni, Dokumen Resmi)..."
                      value={newCatInput}
                      onChange={(e) => setNewCatInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-2xs shrink-0 border border-amber-400/30 active:scale-95"
                  >
                    <Plus className="w-4 h-4 text-amber-300" />
                    <span>Tambah Kategori</span>
                  </button>
                </form>

                {/* List Kategori Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Daftar Kategori ({categoryList.length} Kategori)
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                      Urutan Atas = Tampil Pertama
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {categoryList.map((cat, idx) => {
                      const linkCount = links.filter((l) => l.category && l.category.trim().toLowerCase() === cat.trim().toLowerCase()).length;
                      const isEditing = editingCatIdx === idx;

                      return (
                        <div
                          key={`${cat}-${idx}`}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 hover:bg-slate-50/70 transition-colors gap-3"
                        >
                          {/* Reorder Buttons & Category Info */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleMoveCategory(idx, 'up')}
                                disabled={idx === 0}
                                className="p-1 text-slate-400 hover:text-emerald-800 hover:bg-emerald-50 disabled:opacity-20 rounded-lg transition-all"
                                title="Geser Ke Atas"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveCategory(idx, 'down')}
                                disabled={idx === categoryList.length - 1}
                                className="p-1 text-slate-400 hover:text-emerald-800 hover:bg-emerald-50 disabled:opacity-20 rounded-lg transition-all"
                                title="Geser Ke Bawah"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-6 h-6 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-600 flex items-center justify-center border border-slate-200">
                                {idx + 1}
                              </span>
                            </div>

                            {isEditing ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  value={editingCatVal}
                                  onChange={(e) => setEditingCatVal(e.target.value)}
                                  className="px-3 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 flex-1"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditCategory(idx)}
                                  className="p-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 px-2.5 shadow-2xs"
                                >
                                  <Check className="w-3.5 h-3.5 text-amber-300" />
                                  <span>Simpan</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCatIdx(null)}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold px-2.5"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-bold text-xs text-slate-900 truncate">
                                  {cat}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                                  {linkCount} Link
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          {!isEditing && (
                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStartEditCategory(idx)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg border border-slate-200 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit Nama</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(idx)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>Hapus</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Save & Reset Action Footer */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleResetCategoriesToDefault}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Reset ke Kategori Standar</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveCategoriesToDatabase}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-sm border border-amber-400/40 transition-all disabled:opacity-50 active:scale-95"
                  >
                    <Save className="w-4 h-4 text-amber-300" />
                    <span>Simpan Perubahan Kategori</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: SETTINGS & SECURITY */}
            {activeTab === 'settings' && (
              <div className="space-y-5 max-w-4xl mx-auto">
                {settingsMsg && (
                  <div
                    className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-semibold border transition-all ${
                      settingsMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        : 'bg-rose-50 text-rose-900 border-rose-300'
                    }`}
                  >
                    {settingsMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{settingsMsg.text}</span>
                  </div>
                )}

                {/* Grid 2 Columns for Forms */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Widget Banner Pengumuman Penting Card */}
                  <form
                    onSubmit={handleSaveAnnouncementSettings}
                    className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 col-span-1 lg:col-span-2"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-amber-50 rounded-xl text-amber-800 border border-amber-200">
                          <Megaphone className="w-4 h-4 text-amber-700" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            <span>Widget Banner Pengumuman Penting</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              announcementEnabled
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-slate-100 text-slate-600 border-slate-300'
                            }`}>
                              {announcementEnabled ? 'Aktif di Header' : 'Non-aktif'}
                            </span>
                          </h3>
                          <p className="text-[11px] text-slate-500">Tampilkan banner pesan darurat / pengumuman penting di bagian paling atas situs</p>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={announcementEnabled}
                          onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        <span className="ml-2 text-xs font-extrabold text-slate-700">
                          {announcementEnabled ? 'Banner Aktif' : 'Banner Matikan'}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {/* Text Pesan */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Isi Pesan Pengumuman <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          value={announcementText}
                          onChange={(e) => setAnnouncementText(e.target.value)}
                          placeholder="Contoh: Pengumuman: Pelayanan Tatap Muka Tutup Selama Hari Libur Nasional. Layanan online tetap berjalan..."
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                        />
                      </div>

                      {/* Tipe / Style Pengumuman */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tipe & Warna Banner
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {(
                            [
                              { id: 'urgent', label: 'Darurat (Merah)', bg: 'bg-rose-700 text-white' },
                              { id: 'warning', label: 'Peringatan (Oranye)', bg: 'bg-amber-700 text-white' },
                              { id: 'info', label: 'Informasi (Gelap)', bg: 'bg-slate-800 text-white' },
                              { id: 'success', label: 'Update (Hijau)', bg: 'bg-emerald-800 text-white' },
                            ] as const
                          ).map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setAnnouncementType(item.id)}
                              className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                                announcementType === item.id
                                  ? `${item.bg} border-slate-900 ring-2 ring-slate-900/20 shadow-xs`
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span>{item.label}</span>
                              {announcementType === item.id && <Check className="w-3.5 h-3.5" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Allow Dismissible Toggle */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Opsi Tutup Banner
                        </label>
                        <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/80 transition-all h-[78px]">
                          <input
                            type="checkbox"
                            checked={announcementIsDismissible}
                            onChange={(e) => setAnnouncementIsDismissible(e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                          />
                          <div>
                            <span className="text-xs font-extrabold text-slate-800 block">Dapat Ditutup Pengunjung</span>
                            <span className="text-[10px] text-slate-500 block leading-tight">Pengunjung dapat menekan tombol X untuk menutup banner secara sementara</span>
                          </div>
                        </label>
                      </div>

                      {/* Link CTA URL */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tautan Luar / URL Terkait (Opsional)
                        </label>
                        <input
                          type="url"
                          value={announcementLink}
                          onChange={(e) => setAnnouncementLink(e.target.value)}
                          placeholder="https://..."
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                        />
                      </div>

                      {/* Link CTA Label */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Teks Tombol Tautan (Opsional)
                        </label>
                        <input
                          type="text"
                          value={announcementLinkText}
                          onChange={(e) => setAnnouncementLinkText(e.target.value)}
                          placeholder="Contoh: Lihat Detail / Baca Surat Edaran"
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 border border-amber-400/40 active:scale-95 cursor-pointer"
                      >
                        <Save className="w-4 h-4 text-amber-300" />
                        <span>Simpan Pengaturan Banner Pengumuman</span>
                      </button>
                    </div>
                  </form>

                  {/* Site Title & Subtitle Form */}
                  <form
                    onSubmit={handleSaveGeneralSettings}
                    className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-800 border border-emerald-100">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Identitas Situs Utama
                          </h3>
                          <p className="text-[11px] text-slate-500">Judul & deskripsi portal di header</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Judul Situs Utama
                        </label>
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Subtitle / Deskripsi Halaman
                        </label>
                        <textarea
                          rows={2}
                          value={newSubtitle}
                          onChange={(e) => setNewSubtitle(e.target.value)}
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 border border-amber-400/30 active:scale-95 mt-2"
                    >
                      <Save className="w-4 h-4 text-amber-300" />
                      <span>Simpan Identitas Situs</span>
                    </button>
                  </form>

                  {/* Kelola Logo Header / Portal */}
                  <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-800 border border-emerald-100">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Logo Header Portal
                          </h3>
                          <p className="text-[11px] text-slate-500">Unggah logo custom untuk situs</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                        <div className="shrink-0 flex flex-col items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preview</span>
                          {settings.logoUrl ? (
                            <img
                              src={settings.logoUrl}
                              alt="Preview Logo"
                              className="h-14 w-14 object-contain rounded-xl bg-white p-1 border border-slate-200 shadow-2xs"
                            />
                          ) : (
                            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-800 to-amber-600 flex items-center justify-center text-white shadow-2xs">
                              <Sparkles className="w-6 h-6 text-amber-200" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-all shadow-2xs border border-amber-400/30">
                            <Upload className="w-3.5 h-3.5 text-amber-300" />
                            <span>{isUploadingLogo ? 'Mengunggah...' : 'Upload Logo Baru'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoFileUpload}
                              disabled={isUploadingLogo || isSubmitting}
                              className="hidden"
                            />
                          </label>

                          {settings.logoUrl && (
                            <button
                              type="button"
                              onClick={handleRemoveLogo}
                              disabled={isSubmitting || isUploadingLogo}
                              className="block text-[11px] font-semibold text-rose-700 hover:underline"
                            >
                              Hapus logo dan pakai ikon standar
                            </button>
                          )}

                          <p className="text-[10px] text-slate-400 leading-tight">
                            PNG, JPG, WEBP, atau SVG.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Theme Color Palette Selector */}
                <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                    <div className="p-2 bg-emerald-50 rounded-xl text-emerald-800 border border-emerald-100">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Palet Warna Tema Portal
                      </h3>
                      <p className="text-[11px] text-slate-500">Pilih tema warna dominan untuk tampilan aplikasi</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {THEME_PALETTES.map((pal) => {
                      const isSelected = (settings.themePalette || 'emerald') === pal.id;
                      return (
                        <button
                          key={pal.id}
                          type="button"
                          onClick={() => handleSelectPalette(pal.id)}
                          disabled={isSubmitting}
                          className={`flex flex-col items-start text-left p-3.5 rounded-xl border transition-all relative overflow-hidden cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900/5 border-2 border-slate-900 ring-2 ring-slate-900/10 shadow-xs'
                              : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                          }`}
                        >
                          <div className={`w-full h-7 rounded-lg bg-gradient-to-r ${pal.previewGradient} mb-2 flex items-center justify-end px-2 shadow-2xs`}>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-white fill-slate-900" />
                            )}
                          </div>

                          <span className="font-bold text-xs text-slate-900 flex items-center justify-between w-full">
                            <span>{pal.name}</span>
                          </span>

                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {pal.description}
                          </p>

                          <div className="flex items-center gap-1.5 mt-2">
                            <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: pal.primaryHex }} title="Utama" />
                            <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: pal.secondaryHex }} title="Sekunder" />
                            <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: pal.bgHex }} title="Latar" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Google Fonts Typography Selector */}
                <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                    <div className="p-2 bg-emerald-50 rounded-xl text-emerald-800 border border-emerald-100">
                      <Type className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Tipografi & Font Google
                      </h3>
                      <p className="text-[11px] text-slate-500">Pilih jenis font profesional yang dimuat secara dinamis ke seluruh UI</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {FONT_OPTIONS.map((font) => {
                      const isSelected = (settings.fontFamily || 'plus-jakarta') === font.id;
                      return (
                        <button
                          key={font.id}
                          type="button"
                          onClick={() => handleSelectFont(font.id)}
                          disabled={isSubmitting}
                          className={`flex flex-col items-start text-left p-3.5 rounded-xl border transition-all relative overflow-hidden cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50/50 border-2 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                              : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="font-extrabold text-xs text-slate-900 truncate pr-1">
                              {font.name}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100 shrink-0" />
                            )}
                          </div>

                          <div
                            className="w-full py-1.5 px-2.5 bg-white rounded-lg border border-slate-200/80 text-xs text-slate-800 font-semibold truncate my-1 shadow-2xs"
                            style={{ fontFamily: font.family }}
                          >
                            Aa Bb Cc 123
                          </div>

                          <span className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                            {font.sampleText}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Stealth URL Obfuscation & Copy Protection Card */}
                <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-rose-50 rounded-xl text-rose-800 border border-rose-200">
                        <Shield className="w-4 h-4 text-rose-700" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <span>Proteksi URL Global (Stealth Mode)</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            enableUrlMasking
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-slate-100 text-slate-600 border-slate-300'
                          }`}>
                            {enableUrlMasking ? 'Aktif Global' : 'Non-aktif'}
                          </span>
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Sakelar global penyamaran URL dan proteksi penyalinan tautan publik.
                        </p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableUrlMasking}
                        onChange={(e) => handleToggleUrlMasking(e.target.checked)}
                        disabled={isSubmitting}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      <span className="ml-2 text-xs font-extrabold text-slate-700">
                        {enableUrlMasking ? 'Proteksi Global' : 'Non-aktifkan'}
                      </span>
                    </label>
                  </div>

                  {/* Section Khusus: Pengaturan Penyamaran Link Individual */}
                  <div className="pt-2 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-800">
                          <EyeOff className="w-4 h-4 text-emerald-700" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                            Pengaturan Penyamaran Link Individual
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Atur penyamaran tautan satu per satu secara independen
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {links.filter((l) => l.isStealthMode).length} dari {links.length} Tautan Disamarkan
                      </span>
                    </div>

                    {/* Table Ringkas Penyamaran Link */}
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 shadow-2xs">
                      <div className="max-h-72 overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3.5">Judul Tautan</th>
                              <th className="py-2.5 px-3">Kategori</th>
                              <th className="py-2.5 px-3 text-center">Indikator Penyamaran</th>
                              <th className="py-2.5 px-3 text-right">Sakelar On/Off</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/80 bg-white">
                            {links.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="text-center py-6 text-slate-400 text-xs font-medium">
                                  Belum ada tautan dalam daftar.
                                </td>
                              </tr>
                            ) : (
                              links.map((link) => {
                                const isStealth = Boolean(link.isStealthMode);
                                return (
                                  <tr
                                    key={link.id}
                                    className={`transition-colors ${
                                      isStealth ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-slate-50'
                                    }`}
                                  >
                                    <td className="py-2.5 px-3.5 font-bold text-slate-900">
                                      <div className="flex items-center gap-2">
                                        {isStealth ? (
                                          <EyeOff className="w-4 h-4 text-emerald-600 shrink-0" title="Penyamaran Aktif" />
                                        ) : (
                                          <Eye className="w-4 h-4 text-slate-400 shrink-0" title="Link Biasa" />
                                        )}
                                        <div className="min-w-0">
                                          <p className="truncate max-w-xs font-bold text-slate-900">{link.title}</p>
                                          <p className="text-[10px] font-mono text-slate-400 truncate max-w-xs">{link.url}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-600 font-medium">
                                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                                        {link.category || 'Umum'}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-center">
                                      {isStealth ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-extrabold border border-emerald-300">
                                          <EyeOff className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                          <span>DISAMARKAN</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold border border-slate-200">
                                          <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                          <span>Biasa (Direct)</span>
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3 text-right">
                                      <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={isStealth}
                                          onChange={() => onToggleStealth && onToggleStealth(link)}
                                          className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                      </label>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-100 text-xs text-rose-900 space-y-1">
                    <p className="font-extrabold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-rose-700" />
                      <span>Informasi Penyamaran Link</span>
                    </p>
                    <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-1 pt-1 font-medium">
                      <li>Hanya link yang mengaktifkan opsi <strong>DISAMARKAN</strong> (atau dikunci PIN) yang akan dibuka melalui penampil terenkripsi internal.</li>
                      <li>Tautan tanpa penyamaran akan langsung membuka URL target tanpa menyamarkan domain.</li>
                    </ul>
                  </div>
                </div>

                {/* Password Admin Change Form */}
                <form
                  onSubmit={handleChangePassword}
                  className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4"
                >
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                    <div className="p-2 bg-amber-50 rounded-xl text-amber-800 border border-amber-200">
                      <Key className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Keamanan & Password Admin
                      </h3>
                      <p className="text-[11px] text-slate-500">Perbarui kata sandi untuk masuk ke panel admin</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Password Saat Ini
                    </label>
                    <input
                      type="password"
                      value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)}
                      placeholder="Masukkan password admin lama..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Password Baru
                      </label>
                      <input
                        type="password"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        placeholder="Minimal 4 karakter..."
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Konfirmasi Password Baru
                      </label>
                      <input
                        type="password"
                        value={confirmPass}
                        onChange={(e) => setConfirmPass(e.target.value)}
                        placeholder="Ulangi password baru..."
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1.5 active:scale-95"
                  >
                    <Key className="w-4 h-4 text-amber-300" />
                    <span>Perbarui Password Admin</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: STATS */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                {/* Stats Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
                    <span className="text-xs font-bold text-emerald-800">
                      Total Link
                    </span>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1">
                      {links.length} Tautan
                    </p>
                  </div>

                  <div className="p-4 bg-emerald-100/70 border border-emerald-300 rounded-2xl">
                    <span className="text-xs font-bold text-emerald-900">
                      Link Aktif Publik
                    </span>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1">
                      {activeCount} Tautan
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-amber-900">
                        Total Interaksi Klik
                      </span>
                      <p className="text-2xl font-extrabold text-slate-900 mt-1">
                        {totalClicks} Klik
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfirmResetClickTarget({ link: null, type: 'all' })}
                      disabled={isSubmitting || totalClicks === 0}
                      className="mt-3 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs border border-amber-400/30"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-200" />
                      <span>Reset Klik Data</span>
                    </button>
                  </div>
                </div>

                {/* Popularity ranking */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-emerald-700" />
                      <span>Peringkat Link Terpopuler</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setConfirmResetClickTarget({ link: null, type: 'all' })}
                      disabled={isSubmitting || totalClicks === 0}
                      className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Semua Statistik Klik</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {[...links]
                      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
                      .map((link, idx) => (
                        <div
                          key={link.id}
                          className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-extrabold text-emerald-800 border border-emerald-200">
                              #{idx + 1}
                            </span>
                            <div>
                              <p className="font-bold text-xs text-slate-900">
                                {link.title}
                              </p>
                              <span className="text-[11px] font-semibold text-slate-600">
                                {link.category}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{link.clicks || 0} Klik</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: DATABASE MAINTENANCE & CACHE CLEANING */}
            {activeTab === 'database' && (
              <div className="space-y-6 max-w-5xl mx-auto">
                {/* Header Banner */}
                <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl shadow-md border border-emerald-500/30">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-400/30 shrink-0 mt-0.5">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                        <span>Pemeliharaan & Pembersihan Database</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-md border border-emerald-400/30">
                          Firestore Cloud Engine
                        </span>
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        Kelola kebersihan data, bersihkan cache browser, serta hapus kategori/logo custom yang sudah tidak digunakan untuk menjaga performa sistem tautan tetap cepat dan efisien.
                      </p>
                    </div>
                  </div>
                </div>

                {dbMsg && (
                  <div
                    className={`flex items-center gap-2 p-3.5 rounded-xl text-xs font-bold ${
                      dbMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                        : 'bg-red-50 text-red-900 border border-red-300'
                    }`}
                  >
                    {dbMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{dbMsg.text}</span>
                  </div>
                )}

                {/* Database Health Metrik Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-[11px] font-bold">Total Tautan</span>
                      <HardDrive className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                    <p className="text-xl font-extrabold text-slate-900">{links.length} Link</p>
                    <span className="text-[10px] text-emerald-700 font-semibold">{activeCount} Aktif | {links.length - activeCount} Off</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-[11px] font-bold">Total Kategori</span>
                      <Tag className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                    <p className="text-xl font-extrabold text-slate-900">{categoryList.length} Item</p>
                    <span className="text-[10px] text-amber-700 font-semibold">
                      {categoryList.filter(cat => !links.some(l => l.category === cat)).length} Kategori Sampah
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-[11px] font-bold">Logo Custom</span>
                      <Upload className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                    <p className="text-xl font-extrabold text-slate-900">{(settings.customIcons || []).length} Saved</p>
                    <span className="text-[10px] text-rose-700 font-semibold">
                      {(settings.customIcons || []).filter(iconUrl => !links.some(l => l.icon === iconUrl) && settings.logoUrl !== iconUrl).length} Logo Usang
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-[11px] font-bold">Statistik Klik</span>
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                    <p className="text-xl font-extrabold text-slate-900">{totalClicks} Klik</p>
                    <span className="text-[10px] text-indigo-700 font-semibold">Real-time Firebase</span>
                  </div>
                </div>

                {/* Maintenance Tools Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* TOOL 1: Clear Cache & Reload Browser Session */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs mb-1">
                        <RefreshCw className="w-4 h-4 text-emerald-700" />
                        <span>Clear Cache Browser & Reload Session</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Membersihkan cache lokal browser (localStorage & sessionStorage) dan memuat ulang data snapshot terbaru langsung dari Firestore.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        setIsSubmitting(true);
                        try {
                          localStorage.clear();
                          sessionStorage.clear();
                          setDbMsg({ type: 'success', text: 'Cache browser lokal berhasil dibersihkan! Memperbarui data Firestore...' });
                          setTimeout(() => {
                            window.location.reload();
                          }, 800);
                        } catch (err) {
                          setDbMsg({ type: 'error', text: 'Gagal membersihkan cache.' });
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
                      <span>Clear Cache & Refresh Sekarang</span>
                    </button>
                  </div>

                  {/* TOOL 2: Clean Unused Categories */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs mb-1">
                        <Tag className="w-4 h-4 text-amber-700" />
                        <span>Bersihkan Kategori Sampah (Unused)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Menghapus kategori dalam daftar yang saat ini tidak digunakan oleh link mana pun ({categoryList.filter(cat => !links.some(l => l.category && l.category.trim().toLowerCase() === cat.trim().toLowerCase())).length} kategori kosong).
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isSubmitting || categoryList.filter(cat => !links.some(l => l.category && l.category.trim().toLowerCase() === cat.trim().toLowerCase())).length === 0}
                      onClick={async () => {
                        const unused = categoryList.filter(cat => !links.some(l => l.category && l.category.trim().toLowerCase() === cat.trim().toLowerCase()));
                        if (unused.length === 0) return;
                        setIsSubmitting(true);
                        setDbMsg(null);
                        try {
                          const activeOnly = categoryList.filter(cat => links.some(l => l.category && l.category.trim().toLowerCase() === cat.trim().toLowerCase()) || cat === 'Lainnya');
                          await onUpdateSettings({ categories: activeOnly });
                          setCategoryList(activeOnly);
                          setDbMsg({ type: 'success', text: `Berhasil membersihkan ${unused.length} kategori sampah (${unused.join(', ')}) dari database!` });
                        } catch (err) {
                          console.error(err);
                          setDbMsg({ type: 'error', text: 'Gagal membersihkan kategori sampah.' });
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Bersihkan {categoryList.filter(cat => !links.some(l => l.category && l.category.trim().toLowerCase() === cat.trim().toLowerCase())).length} Kategori Kosong</span>
                    </button>
                  </div>




                </div>
              </div>
            )}
          </div>

          {/* CONFIRM RESET CLICK MODAL OVERLAY */}
          {confirmResetClickTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 12 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-amber-300 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl shrink-0">
                    <RotateCcw className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      Konfirmasi Reset Klik
                    </h3>
                    <p className="text-xs text-slate-500">
                      Apakah Anda benar-benar mau mereset data klik ini?
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 leading-relaxed font-medium">
                  {confirmResetClickTarget.type === 'single' && confirmResetClickTarget.link ? (
                    <>
                      Anda akan mereset statistik klik untuk tautan{' '}
                      <strong className="text-slate-900 font-extrabold">"{confirmResetClickTarget.link.title}"</strong>{' '}
                      dari <span className="font-extrabold text-amber-800">{confirmResetClickTarget.link.clicks || 0} klik</span> menjadi <span className="font-extrabold text-emerald-700">0 klik</span>.
                    </>
                  ) : (
                    <>
                      Anda akan mereset SELURUH akumulasi klik untuk <strong className="text-slate-900 font-extrabold">{links.length} tautan</strong> ({totalClicks} total klik) menjadi <span className="font-extrabold text-emerald-700">0 klik</span>.
                    </>
                  )}
                  <p className="mt-2 font-bold text-rose-700">
                    • Tindakan ini tidak dapat dibatalkan setelah dikonfirmasi.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setConfirmResetClickTarget(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={async () => {
                      setIsSubmitting(true);
                      try {
                        if (confirmResetClickTarget.type === 'single' && confirmResetClickTarget.link) {
                          if (onResetSingleLinkClicks) {
                            await onResetSingleLinkClicks(confirmResetClickTarget.link.id);
                          }
                          setSettingsMsg({ type: 'success', text: `Klik untuk "${confirmResetClickTarget.link.title}" berhasil di-reset ke 0!` });
                        } else {
                          await onResetClickStats();
                          setSettingsMsg({ type: 'success', text: 'Semua statistik klik tautan berhasil di-reset ke 0!' });
                        }
                      } catch (err) {
                        setSettingsMsg({ type: 'error', text: 'Gagal mereset statistik klik.' });
                      } finally {
                        setIsSubmitting(false);
                        setConfirmResetClickTarget(null);
                      }
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-rose-600/20"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Ya, Reset Klik Sekarang</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
