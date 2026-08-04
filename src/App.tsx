/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Link as LinkIcon,
  Plus,
  Compass,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  SlidersHorizontal,
  Lock,
  Trees,
} from 'lucide-react';
import { NavLinkItem, SiteSettings, THEME_PALETTES, FONT_OPTIONS } from './types';
import {
  subscribeToLinks,
  subscribeToSettings,
  addLink,
  updateLink,
  deleteLink,
  incrementLinkClick,
  updateSettings,
  seedInitialDataIfEmpty,
  resetAllClicks,
  resetSingleLinkClick,
} from './lib/firebase';
import { Navbar } from './components/Navbar';
import { AnnouncementBar } from './components/AnnouncementBar';
import { LinkCard } from './components/LinkCard';
import { SkeletonGrid } from './components/SkeletonCard';
import { CategoryFilter } from './components/CategoryFilter';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { LinkModal } from './components/LinkModal';
import { getScheduleStatus } from './lib/scheduleUtils';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { PinUnlockModal } from './components/PinUnlockModal';
import { StealthViewerModal } from './components/StealthViewerModal';
import { Footer } from './components/Footer';
import { PalmLeafOrnamentRight, PalmLeafOrnamentLeft, TropicalHeaderAccent } from './components/NyiurOrnaments';
import { DEFAULT_SETTINGS } from './data/initialData';
import { encodeStealthToken, decodeStealthToken } from './lib/urlObfuscator';

export default function App() {
  const [links, setLinks] = useState<NavLinkItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('app_links_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Cache read notice:', e);
      }
    }
    return [];
  });

  const [settings, setSettings] = useState<SiteSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSettings = localStorage.getItem('app_settings_cache');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (parsed && typeof parsed === 'object') {
            return { ...DEFAULT_SETTINGS, ...parsed };
          }
        }
        const savedTheme = localStorage.getItem('app_theme_palette') as any;
        if (savedTheme && ['emerald', 'blue', 'amber'].includes(savedTheme)) {
          return { ...DEFAULT_SETTINGS, themePalette: savedTheme };
        }
      } catch (e) {
        console.warn('Theme cache read notice:', e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('app_links_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return false; // Instant load from local cache with zero skeleton delay
          }
        }
      } catch (e) {}
    }
    return true;
  });

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Admin Auth State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);

  // Link CRUD Modal State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState<boolean>(false);
  const [editingLink, setEditingLink] = useState<NavLinkItem | null>(null);

  // Delete Confirmation State
  const [linkToDelete, setLinkToDelete] = useState<NavLinkItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // PIN Unlock Modal State
  const [pinModalLink, setPinModalLink] = useState<NavLinkItem | null>(null);

  // Stealth Protected Viewer Modal State
  const [stealthViewerLink, setStealthViewerLink] = useState<NavLinkItem | null>(null);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Stealth URL Token Redirect & Verification Listener
  useEffect(() => {
    if (typeof window !== 'undefined' && links.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const stealthToken = params.get('v') || params.get('redirect_token');
      if (stealthToken) {
        const decoded = decodeStealthToken(stealthToken);
        if (decoded && decoded.url) {
          const matchedLink = links.find((l) => l.id === decoded.linkId || l.url === decoded.url);

          if (matchedLink) {
            if (matchedLink.isLocked && !isAdminLoggedIn) {
              // PIN protection check for copied / shared obfuscated token
              setPinModalLink(matchedLink);
              showToast('🔒 Tautan dikunci PIN. Masukkan kode PIN untuk membuka.', 'info');
            } else {
              setStealthViewerLink(matchedLink);
            }
          } else {
            // Ad-hoc token link
            setStealthViewerLink({
              id: 'stealth_adhoc',
              title: 'Tautan Disamarkan',
              url: decoded.url,
              category: 'Umum',
              icon: 'Globe',
              isActive: true,
              isFeatured: false,
              isLocked: false,
              order: 0,
              clicks: 0,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    }
  }, [links, isAdminLoggedIn]);

  // 1. Initialize Firebase Data with Instant Cache & Background Sync
  useEffect(() => {
    let isMounted = true;

    // Run seed check in background without blocking initial rendering
    seedInitialDataIfEmpty().catch((err) => console.warn('Seed initialization notice:', err));

    // Fallback safety timeout so skeleton loading never hangs
    const safetyTimer = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 1500);

    const unsubscribeLinks = subscribeToLinks(
      (updatedLinks) => {
        if (isMounted) {
          setLinks(updatedLinks);
          setIsLoading(false);
          try {
            localStorage.setItem('app_links_cache', JSON.stringify(updatedLinks));
          } catch (e) {}
        }
      },
      (err) => {
        console.warn('Realtime links listener reconnect notice:', err);
        if (isMounted) setIsLoading(false);
      }
    );

    const unsubscribeSettings = subscribeToSettings(
      (updatedSettings) => {
        if (isMounted) {
          setSettings((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(updatedSettings)) return prev;
            return updatedSettings;
          });
          try {
            localStorage.setItem('app_settings_cache', JSON.stringify(updatedSettings));
          } catch (e) {}
          if (updatedSettings.themePalette) {
            localStorage.setItem('app_theme_palette', updatedSettings.themePalette);
          }
        }
      },
      (err) => {
        console.warn('Realtime settings listener reconnect notice:', err);
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      unsubscribeLinks();
      unsubscribeSettings();
    };
  }, []);

  // Apply dynamic theme palette CSS variables
  useEffect(() => {
    const paletteId = settings.themePalette || (localStorage.getItem('app_theme_palette') as any) || 'emerald';
    const palette = THEME_PALETTES.find((p) => p.id === paletteId) || THEME_PALETTES[0];
    document.documentElement.style.setProperty('--theme-bg', palette.bgHex);
    document.documentElement.style.setProperty('--theme-primary', palette.primaryHex);
    document.documentElement.style.setProperty('--theme-secondary', palette.secondaryHex);
    document.documentElement.style.setProperty('--theme-accent', palette.accentHex || palette.primaryHex);
    document.documentElement.setAttribute('data-theme', palette.id);
    document.body.setAttribute('data-theme', palette.id);
    localStorage.setItem('app_theme_palette', palette.id);
  }, [settings.themePalette]);

  // Apply dynamic typography Google Font
  useEffect(() => {
    const selectedFontId = settings.fontFamily || 'plus-jakarta';
    const fontObj = FONT_OPTIONS.find((f) => f.id === selectedFontId) || FONT_OPTIONS[0];

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
  }, [settings.fontFamily]);

  // --- MOBILE & TABLET BACK GESTURE / HISTORY NAVIGATION MANAGEMENT ---
  const isPopStateRef = useRef<boolean>(false);
  const ignoreNextPopStateRef = useRef<boolean>(false);
  const prevOverlayStateRef = useRef({
    pinModal: false,
    deleteModal: false,
    linkModal: false,
    adminPanel: false,
    loginModal: false,
    filterActive: false,
  });

  const isPinOpen = Boolean(pinModalLink);
  const isDeleteOpen = Boolean(linkToDelete);
  const isFilterActive = selectedCategory !== 'Semua' || searchQuery.trim() !== '';

  // Synchronize browser history stack when modals open or close
  useEffect(() => {
    const prev = prevOverlayStateRef.current;
    const isPop = isPopStateRef.current;

    const pinOpened = isPinOpen && !prev.pinModal;
    const pinClosed = !isPinOpen && prev.pinModal;

    const deleteOpened = isDeleteOpen && !prev.deleteModal;
    const deleteClosed = !isDeleteOpen && prev.deleteModal;

    const linkOpened = isLinkModalOpen && !prev.linkModal;
    const linkClosed = !isLinkModalOpen && prev.linkModal;

    const adminPanelOpened = isAdminPanelOpen && !prev.adminPanel;
    const adminPanelClosed = !isAdminPanelOpen && prev.adminPanel;

    const loginOpened = isLoginModalOpen && !prev.loginModal;
    const loginClosed = !isLoginModalOpen && prev.loginModal;

    const filterOpened = isFilterActive && !prev.filterActive;
    const filterClosed = !isFilterActive && prev.filterActive;

    if (!isPop) {
      if (pinOpened || deleteOpened || linkOpened || adminPanelOpened || loginOpened || filterOpened) {
        window.history.pushState({ appOverlay: true }, '');
      } else if (pinClosed || deleteClosed || linkClosed || adminPanelClosed || loginClosed || filterClosed) {
        // If closed manually via UI button (not back gesture), pop the pushed history entry
        if (window.history.state?.appOverlay) {
          ignoreNextPopStateRef.current = true;
          window.history.back();
        }
      }
    }

    // Reset flag
    isPopStateRef.current = false;

    // Update reference for next render
    prevOverlayStateRef.current = {
      pinModal: isPinOpen,
      deleteModal: isDeleteOpen,
      linkModal: isLinkModalOpen,
      adminPanel: isAdminPanelOpen,
      loginModal: isLoginModalOpen,
      filterActive: isFilterActive,
    };
  }, [isPinOpen, isDeleteOpen, isLinkModalOpen, isAdminPanelOpen, isLoginModalOpen, isFilterActive]);

  // Handle hardware / gesture 'popstate' back button on mobile & tablet
  useEffect(() => {
    const handlePopState = () => {
      if (ignoreNextPopStateRef.current) {
        ignoreNextPopStateRef.current = false;
        return;
      }

      isPopStateRef.current = true;

      // Priority order to close active overlays/modals or reset filters
      if (pinModalLink) {
        setPinModalLink(null);
      } else if (linkToDelete) {
        setLinkToDelete(null);
      } else if (isLinkModalOpen) {
        setIsLinkModalOpen(false);
      } else if (isAdminPanelOpen) {
        setIsAdminPanelOpen(false);
      } else if (isLoginModalOpen) {
        setIsLoginModalOpen(false);
      } else if (selectedCategory !== 'Semua' || searchQuery !== '') {
        setSelectedCategory('Semua');
        setSearchQuery('');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pinModalLink, linkToDelete, isLinkModalOpen, isAdminPanelOpen, isLoginModalOpen, selectedCategory, searchQuery]);

  // 2. Open Admin Settings handler (Checks if already logged in)
  const handleOpenSettings = () => {
    if (isAdminLoggedIn) {
      setIsAdminPanelOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setIsLoginModalOpen(false);
    setIsAdminPanelOpen(true);
    showToast('Berhasil masuk sebagai Admin!', 'success');
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setIsAdminPanelOpen(false);
    showToast('Telah keluar dari mode Admin.', 'info');
  };

  // 3. Navigation Click Handler
  const handleNavigateLink = async (link: NavLinkItem) => {
    if (link.isLocked && !isAdminLoggedIn) {
      if (link.pinCode && link.pinCode.trim() !== '') {
        setPinModalLink(link);
        return;
      } else {
        showToast(
          `Tautan "${link.title}" dikunci oleh admin dan tidak dapat diakses oleh publik.`,
          'error'
        );
        return;
      }
    }
    // Increment click counter asynchronously in Firebase
    incrementLinkClick(link.id);

    const isMaskingActive = Boolean(link.isStealthMode) || Boolean(link.isLocked) || (settings.enableUrlMasking === true);

    if (isMaskingActive) {
      setStealthViewerLink(link);
      const token = encodeStealthToken(link.url, link.id);
      if (typeof window !== 'undefined') {
        window.history.pushState({}, document.title, `/?v=${token}`);
      }
    } else {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePinUnlockSuccess = (link: NavLinkItem) => {
    incrementLinkClick(link.id);
    setPinModalLink(null);
    showToast(`PIN Benar! Membuka tautan "${link.title}"...`, 'success');

    setStealthViewerLink(link);
    const token = encodeStealthToken(link.url, link.id);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, document.title, `/?v=${token}`);
    }
  };

  const handleCloseStealthViewer = () => {
    setStealthViewerLink(null);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, document.title, window.location.pathname);
    }
  };

  // 4. Link CRUD Handlers
  const handleSaveLink = async (
    linkData: Omit<NavLinkItem, 'id' | 'clicks'>,
    editId?: string
  ) => {
    try {
      if (editId) {
        await updateLink(editId, linkData);
        showToast('Tautan berhasil diperbarui!', 'success');
      } else {
        await addLink(linkData);
        showToast('Tautan baru berhasil ditambahkan!', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan tautan ke Firebase.', 'error');
    }
  };

  const handleDeleteLink = (linkId: string) => {
    const target = links.find((l) => l.id === linkId);
    if (target) {
      setLinkToDelete(target);
    }
  };

  const handleConfirmDelete = async () => {
    if (!linkToDelete) return;
    setIsDeleting(true);
    try {
      await deleteLink(linkToDelete.id);
      showToast(`Tautan "${linkToDelete.title}" telah dihapus.`, 'info');
      setLinkToDelete(null);
    } catch (err) {
      console.error(err);
      showToast('Gagal menghapus tautan dari Firebase.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (link: NavLinkItem) => {
    try {
      await updateLink(link.id, { isActive: !link.isActive });
      showToast(
        `Link "${link.title}" kini ${!link.isActive ? 'Aktif' : 'Non-aktif'}.`,
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast('Gagal mengubah status link.', 'error');
    }
  };

  const handleToggleLock = async (link: NavLinkItem) => {
    try {
      await updateLink(link.id, { isLocked: !link.isLocked });
      showToast(
        `Link "${link.title}" kini ${!link.isLocked ? 'TERKUNCI (Tidak dapat diakses publik)' : 'TERBUKA (Dapat diakses publik)'}.`,
        !link.isLocked ? 'info' : 'success'
      );
    } catch (err) {
      console.error(err);
      showToast('Gagal mengubah status kunci link.', 'error');
    }
  };

  const handleToggleStealth = async (link: NavLinkItem) => {
    try {
      const nextState = !link.isStealthMode;
      await updateLink(link.id, { isStealthMode: nextState });
      showToast(
        `Penyamaran tautan "${link.title}" kini ${nextState ? 'AKTIF (Disamarkan)' : 'NON-AKTIF (Biasa)'}.`,
        nextState ? 'success' : 'info'
      );
    } catch (err) {
      console.error(err);
      showToast('Gagal mengubah status penyamaran link.', 'error');
    }
  };

  const handleMoveOrder = async (link: NavLinkItem, direction: 'up' | 'down') => {
    const sorted = [...links].sort((a, b) => a.order - b.order);
    const currentIndex = sorted.findIndex((l) => l.id === link.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const targetLink = sorted[targetIndex];

    // Swap order values
    try {
      await updateLink(link.id, { order: targetLink.order });
      await updateLink(targetLink.id, { order: link.order });
      showToast('Urutan tautan diperbarui.', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Filter links for display
  const displayLinks = links.filter((link) => {
    // Show inactive links only if admin is logged in
    if (!link.isActive && !isAdminLoggedIn) return false;

    // Scheduled link filter for public visitors
    if (link.isScheduled && !isAdminLoggedIn) {
      const scheduleStatus = getScheduleStatus(link);
      if (!scheduleStatus.isAvailable) {
        if (!link.expiredAction || link.expiredAction === 'hide') {
          return false;
        }
      }
    }

    // Filter by Category
    if (selectedCategory !== 'Semua' && link.category !== selectedCategory) {
      return false;
    }

    // Filter by Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        link.title.toLowerCase().includes(query) ||
        (link.description && link.description.toLowerCase().includes(query)) ||
        link.category.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const featuredLinks = displayLinks.filter((l) => l.isFeatured);
  const regularLinks = displayLinks.filter((l) => !l.isFeatured);

  const isAnyModalOpen =
    isLoginModalOpen ||
    isAdminPanelOpen ||
    isLinkModalOpen ||
    Boolean(linkToDelete) ||
    Boolean(pinModalLink);

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAnyModalOpen]);

  return (
    <div
      className="min-h-screen text-slate-900 flex flex-col font-sans transition-colors duration-300 selection:bg-emerald-700 selection:text-white relative overflow-x-hidden"
      style={{ backgroundColor: 'var(--theme-bg, #F4F8F5)' }}
    >
      {/* Background Tropical Gradient & Palm Watermarks */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Full-width Top Radial Ambient Orange/Amber & Emerald Gradient */}
        <div className="absolute top-0 left-0 right-0 w-full h-[600px] bg-[radial-gradient(ellipse_100%_60%_at_50%_0%,rgba(245,158,11,0.22),rgba(5,150,105,0.14),transparent)]" />
        {/* Full-width Bottom Radial Ambient Orange/Amber & Emerald Gradient */}
        <div className="absolute bottom-0 left-0 right-0 w-full h-[500px] bg-[radial-gradient(ellipse_100%_70%_at_50%_100%,rgba(245,158,11,0.18),rgba(5,150,105,0.10),transparent)]" />
        
        <PalmLeafOrnamentRight className="absolute -top-10 -right-10 w-80 h-80 text-emerald-800 opacity-[0.22] animate-float-leaf" />
        <PalmLeafOrnamentLeft className="absolute top-1/3 -left-12 w-80 h-80 text-emerald-700 opacity-[0.18] animate-float-leaf-reverse" />
        <PalmLeafOrnamentRight className="absolute bottom-10 -right-16 w-96 h-96 text-emerald-900 opacity-[0.15] animate-float-leaf" />
      </div>

      {/* Page Content Wrapper (Freezes and Blurs when any modal popup is open) */}
      <div
        className={`relative z-10 flex-1 flex flex-col transition-all duration-300 ${
          isAnyModalOpen
            ? 'filter blur-[3px] brightness-90 pointer-events-none select-none scale-[0.995] origin-top'
            : ''
        }`}
        aria-hidden={isAnyModalOpen}
      >
        {/* Announcement Bar Widget */}
        <AnnouncementBar settings={settings} />

        {/* Top Navbar */}
        <Navbar
          settings={settings}
          isAdminLoggedIn={isAdminLoggedIn}
          onOpenSettings={handleOpenSettings}
          onAdminLogout={handleAdminLogout}
        />

        {/* Main Container */}
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12">
          {/* Hero Header with Tropical Nyiur Indah styling */}
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12 relative">
            {/* Logo Admin (Ukuran Lebih Besar Tanpa Bingkai Persegi) */}
            {settings.logoUrl ? (
              <div className="mb-6 flex justify-center">
                <img
                  src={settings.logoUrl}
                  alt={settings.siteTitle || 'Logo Portal'}
                  className="h-28 sm:h-40 lg:h-48 max-w-[340px] sm:max-w-[520px] w-auto object-contain mx-auto drop-shadow-lg transition-transform hover:scale-105 duration-300"
                />
              </div>
            ) : (
              <div className="mb-6 flex justify-center">
                <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-3xl theme-icon-box flex items-center justify-center text-white shadow-xl ring-4 ring-amber-300/40 transition-transform hover:scale-105 duration-300">
                  <Trees className="w-10 h-10 sm:w-12 sm:h-12 text-amber-200" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 ring-2 ring-white animate-pulse flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-emerald-950" />
                  </div>
                </div>
              </div>
            )}

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full theme-badge border text-xs font-extrabold mb-4 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>Portal Navigasi & Integrasi Terpadu</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 bg-clip-text text-transparent">
                {settings.siteTitle || 'Portal Tautan Navigasi'}
              </span>
            </h1>

            <TropicalHeaderAccent />



            {/* Quick Admin Add Button if Logged In */}
            {isAdminLoggedIn && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => {
                    setEditingLink(null);
                    setIsLinkModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl theme-btn-primary text-white font-extrabold text-xs sm:text-sm shadow-lg border border-amber-400/50 transition-all hover:scale-105 active:scale-95"
                >
                  <Plus className="w-4 h-4 text-amber-300" />
                  <span>Tambah Tombol Tautan Baru</span>
                </button>
              </div>
            )}
          </div>

          {/* Category & Search Filter */}
          <CategoryFilter
            categories={settings.categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            totalActiveCount={links.filter((l) => l.isActive).length}
          />

          {/* Content Loading / Animated Transition Container */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading-skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-4"
              >
                <SkeletonGrid />
              </motion.div>
            ) : displayLinks.length === 0 ? (
              /* Empty State */
              <motion.div
                key={`empty_${selectedCategory}_${searchQuery}`}
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -10 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="text-center py-16 px-6 bg-white/90 backdrop-blur-md rounded-3xl border border-emerald-200/80 shadow-md max-w-lg mx-auto"
              >
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-amber-100 text-emerald-800 flex items-center justify-center mx-auto mb-4 border border-amber-300/60 shadow-xs">
                  <Compass className="w-7 h-7 text-emerald-700" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-lg">
                  Tidak Ada Tautan Ditemukan
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                  {searchQuery
                    ? `Tidak ada tautan yang cocok dengan kata kunci "${searchQuery}".`
                    : 'Belum ada tautan yang tersedia pada kategori ini.'}
                </p>
                {isAdminLoggedIn && (
                  <button
                    onClick={() => {
                      setEditingLink(null);
                      setIsLinkModalOpen(true);
                    }}
                    className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-800 text-white rounded-2xl text-xs font-extrabold hover:bg-emerald-900 transition-colors border border-amber-400/50 shadow-md"
                  >
                    <Plus className="w-4 h-4 text-amber-300" />
                    <span>Buat Tautan Baru</span>
                  </button>
                )}
              </motion.div>
            ) : (
              /* Links Grid */
              <motion.div
                key={`grid_${selectedCategory}_${searchQuery}`}
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-10"
              >
                {/* Featured Links Section */}
                {featuredLinks.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-5 border-l-4 border-amber-500 pl-3.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-600 fill-amber-500" />
                        <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900">
                          Tautan Unggulan Utama
                        </h2>
                      </div>
                      <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300/80">
                        {featuredLinks.length} Tautan
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7 items-stretch">
                      <AnimatePresence mode="popLayout">
                        {featuredLinks.map((link, idx) => (
                          <LinkCard
                            key={link.id}
                            link={link}
                            index={idx}
                            isAdmin={isAdminLoggedIn}
                            onNavigate={handleNavigateLink}
                            onEdit={(l) => {
                              setEditingLink(l);
                              setIsLinkModalOpen(true);
                            }}
                            onDelete={(l) => handleDeleteLink(l.id)}
                            onToggleActive={handleToggleActive}
                            onToggleLock={handleToggleLock}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* Regular Links Section */}
                {regularLinks.length > 0 && (
                  <div>
                    {featuredLinks.length > 0 && (
                      <div className="flex items-center justify-between gap-2 mb-5 border-l-4 theme-border-primary pl-3.5">
                        <div className="flex items-center gap-2">
                          <SlidersHorizontal className="w-4 h-4 theme-text-primary" />
                          <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900">
                            Semua Tautan Navigasi
                          </h2>
                        </div>
                        <span className="text-[11px] font-bold theme-badge px-2.5 py-0.5 rounded-full border">
                          {regularLinks.length} Tautan
                        </span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7 items-stretch">
                      <AnimatePresence mode="popLayout">
                        {regularLinks.map((link, idx) => (
                          <LinkCard
                            key={link.id}
                            link={link}
                            index={featuredLinks.length + idx}
                            isAdmin={isAdminLoggedIn}
                            onNavigate={handleNavigateLink}
                            onEdit={(l) => {
                              setEditingLink(l);
                              setIsLinkModalOpen(true);
                            }}
                            onDelete={(l) => handleDeleteLink(l.id)}
                            onToggleActive={handleToggleActive}
                            onToggleLock={handleToggleLock}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer Component */}
        <Footer
          settings={settings}
          totalLinksCount={links.filter((l) => l.isActive).length}
          totalClicksCount={links.reduce((acc, curr) => acc + (curr.clicks || 0), 0)}
          isAdminLoggedIn={isAdminLoggedIn}
          onOpenSettings={handleOpenSettings}
          onAdminLogout={handleAdminLogout}
        />
      </div>

      {/* Modals */}
      {/* 1. Admin Password Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
        correctPassword={settings.adminPassword}
      />

      {/* 2. Admin Control Panel Modal */}
      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        onAdminLogout={handleAdminLogout}
        links={links}
        settings={settings}
        onAddLink={() => {
          setEditingLink(null);
          setIsLinkModalOpen(true);
        }}
        onEditLink={(link) => {
          setEditingLink(link);
          setIsLinkModalOpen(true);
        }}
        onDeleteLink={handleDeleteLink}
        onToggleActive={handleToggleActive}
        onToggleLock={handleToggleLock}
        onToggleStealth={handleToggleStealth}
        onMoveOrder={handleMoveOrder}
        onUpdateSettings={async (newSet) => {
          await updateSettings(newSet);
          showToast('Pengaturan berhasil disimpan!', 'success');
        }}
        onResetSeedData={async () => {
          await seedInitialDataIfEmpty();
          showToast('Data sampel berhasil dimuat!', 'success');
        }}
        onResetClickStats={async () => {
          await resetAllClicks();
          showToast('Statistik klik berhasil di-reset ke 0!', 'success');
        }}
        onResetSingleLinkClicks={async (linkId) => {
          await resetSingleLinkClick(linkId);
          showToast('Statistik klik link berhasil di-reset ke 0!', 'success');
        }}
        onBatchUpdateLinkCategories={async (categoryUpdates) => {
          for (const update of categoryUpdates) {
            await updateLink(update.linkId, { category: update.newCategory });
          }
        }}
      />

      {/* 3. Add/Edit Link Modal (CRUD Form) */}
      <LinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSave={handleSaveLink}
        editingLink={editingLink}
        defaultOrder={links.length + 1}
        categories={settings.categories}
        customIcons={settings.customIcons}
        onAddCustomIcon={(newIcon) => {
          const current = settings.customIcons || [];
          if (!current.includes(newIcon)) {
            updateSettings({ customIcons: [newIcon, ...current].slice(0, 24) });
          }
        }}
      />

      {/* 4. Custom Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!linkToDelete}
        link={linkToDelete}
        isDeleting={isDeleting}
        onClose={() => setLinkToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* 5. PIN Unlock Modal */}
      <PinUnlockModal
        isOpen={!!pinModalLink}
        link={pinModalLink}
        onClose={() => setPinModalLink(null)}
        onSuccess={handlePinUnlockSuccess}
      />

      {/* 6. Stealth Protected Viewer Modal */}
      <StealthViewerModal
        isOpen={!!stealthViewerLink}
        link={stealthViewerLink}
        isAdmin={isAdminLoggedIn}
        onClose={handleCloseStealthViewer}
        onShowToast={showToast}
      />

      {/* Toast Notification Floating Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl shadow-xl text-xs font-semibold border border-slate-800 dark:border-slate-200"
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'info' && <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
