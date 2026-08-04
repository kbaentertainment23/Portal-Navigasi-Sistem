import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight,
  Sparkles,
  Eye,
  Edit3,
  Trash2,
  Power,
  Lock,
  Unlock,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Send,
  Facebook,
  Twitter,
  X as CloseIcon,
  Globe,
  Calendar,
  Clock,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { NavLinkItem, COLOR_PRESETS } from '../types';
import { DynamicIcon } from './DynamicIcon';
import { getScheduleStatus } from '../lib/scheduleUtils';
import { getStealthRedirectUrl } from '../lib/urlObfuscator';

interface LinkCardProps {
  link: NavLinkItem;
  isAdmin: boolean;
  index?: number;
  onNavigate: (link: NavLinkItem) => void;
  onEdit?: (link: NavLinkItem) => void;
  onDelete?: (link: NavLinkItem) => void;
  onToggleActive?: (link: NavLinkItem) => void;
  onToggleLock?: (link: NavLinkItem) => void;
}

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 28,
    scale: 0.95,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: Math.min(i * 0.07, 0.45),
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.94,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

export const LinkCard: React.FC<LinkCardProps> = ({
  link,
  isAdmin,
  index = 0,
  onNavigate,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleLock,
}) => {
  const colorPreset = COLOR_PRESETS.find((c) => c.id === link.color) || COLOR_PRESETS[0];
  const scheduleStatus = getScheduleStatus(link);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleCopyUrl = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (link.isLocked && !isAdmin) {
      showToast('🔒 Tautan dikunci oleh PIN — URL disamarkan & tidak dapat disalin!');
      return;
    }

    // Gunakan URL terenkripsi hanya jika link disamarkan / dikunci
    const isStealthActive = Boolean(link.isStealthMode) || Boolean(link.isLocked);
    const targetToCopy = isStealthActive && !isAdmin ? getStealthRedirectUrl(link.url, link.id) : link.url;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(targetToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = targetToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      showToast(isStealthActive ? 'Tautan Terproteksi Disamarkan disalin!' : 'URL Tautan disalin!');
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('Failed to copy URL:', err);
      showToast('Gagal menyalin URL');
    }
  };

  const shareTargetUrl = link.isLocked && !isAdmin
    ? ''
    : (link.isStealthMode ? getStealthRedirectUrl(link.url, link.id) : link.url);

  const handleNativeShare = async () => {
    if (link.isLocked && !isAdmin) {
      showToast('Tautan ini dikunci oleh PIN dan tidak dapat dibagikan.');
      return;
    }

    const shareData = {
      title: link.title,
      text: link.description || `Kunjungi tautan ${link.title}`,
      url: shareTargetUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        setIsShareModalOpen(false);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          handleCopyUrl();
        }
      }
    } else {
      handleCopyUrl();
    }
  };

  const shareText = encodeURIComponent(`${link.title}\n${link.description ? link.description + '\n' : ''}`);
  const encodedUrl = encodeURIComponent(shareTargetUrl);

  const socialShareOptions = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      bgColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      url: `https://api.whatsapp.com/send?text=${shareText}${encodedUrl}`,
    },
    {
      name: 'Telegram',
      icon: Send,
      bgColor: 'bg-sky-500 hover:bg-sky-600 text-white',
      url: `https://t.me/share/url?url=${encodedUrl}&text=${shareText}`,
    },
    {
      name: 'Facebook',
      icon: Facebook,
      bgColor: 'bg-blue-600 hover:bg-blue-700 text-white',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: 'X (Twitter)',
      icon: Twitter,
      bgColor: 'bg-slate-900 hover:bg-black text-white',
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${shareText}`,
    },
  ];

  return (
    <motion.div
      layout
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      custom={index}
      whileHover={{ y: -6, scale: 1.018, transition: { duration: 0.22, ease: 'easeOut' } }}
      whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
      className={`group relative flex flex-col justify-between h-full rounded-3xl border p-5 sm:p-6 transition-all duration-300 shadow-xs hover:shadow-2xl bg-white/95 backdrop-blur-md theme-card overflow-hidden ${
        colorPreset.border
      } ${!link.isActive ? 'opacity-60 grayscale-[40%]' : ''} ${
        link.isLocked
          ? 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-200'
          : 'hover:border-emerald-300/80 hover:ring-2 hover:ring-emerald-500/10'
      }`}
    >
      {/* Top subtle inner border glow line */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full theme-btn-primary text-white text-xs font-bold shadow-lg border border-amber-300/60 flex items-center gap-1.5 whitespace-nowrap"
          >
            <Check className="w-3.5 h-3.5 text-amber-300" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative subtle leaf watermark overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none overflow-hidden rounded-tr-3xl">
        <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full theme-text-primary transform translate-x-6 -translate-y-6 rotate-45">
          <path d="M50 0C50 0 55 35 70 45C85 55 100 50 100 50C100 50 75 65 65 80C55 95 50 100 50 100C50 100 45 65 30 55C15 45 0 50 0 50C0 50 25 35 35 20C45 5 50 0 50 0Z" />
        </svg>
      </div>

      {/* Top badges */}
      <div className="flex items-center justify-between gap-2 mb-3 z-10">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold theme-badge border shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full theme-badge-dot"></span>
            {link.category}
          </span>
          {link.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold bg-gradient-to-r from-amber-100 to-amber-50 text-amber-950 border border-amber-300 shadow-2xs">
              <Sparkles className="w-3 h-3 text-amber-600 fill-amber-500" />
              Unggulan
            </span>
          )}
          {link.isStealthMode && (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold bg-emerald-100/90 text-emerald-950 border border-emerald-300 shadow-2xs" title="Tautan Disamarkan (Stealth Mode)">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Disamarkan
            </span>
          )}
          {link.isLocked && (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold bg-rose-600 text-white border border-rose-700 shadow-2xs">
              <Lock className="w-3 h-3 text-amber-300" />
              {link.pinCode ? 'Akses PIN' : 'Terkunci'}
            </span>
          )}
          {scheduleStatus.isScheduled && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold border shadow-2xs ${scheduleStatus.badgeBg} ${scheduleStatus.badgeText} ${scheduleStatus.badgeBorder}`}>
              <Clock className="w-3 h-3" />
              {scheduleStatus.badgeLabel}
            </span>
          )}
          {!link.isActive && (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-50 text-red-600 border border-red-200">
              Non-aktif
            </span>
          )}
        </div>

        {/* Clicks count badge */}
        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-700 bg-slate-100/80 px-2.5 py-1 rounded-full border border-slate-200/80 shadow-2xs">
          <Eye className="w-3.5 h-3.5 theme-text-primary" />
          {link.clicks || 0}
        </span>
      </div>

      {/* Content Section */}
      <div className="flex items-start gap-4 mb-3 z-10">
        <div
          className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl shadow-sm border transform group-hover:scale-105 transition-transform ${
            link.isLocked
              ? 'bg-rose-100/90 border-rose-200 text-rose-700'
              : `theme-bg-subtle border-slate-200/80 ${colorPreset.text}`
          }`}
        >
          <DynamicIcon name={link.icon} className="h-6 w-6" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-snug group-hover:theme-text-primary transition-colors line-clamp-1 flex items-center gap-1.5">
            <span>{link.title}</span>
            {link.isLocked && <Lock className="w-4 h-4 text-rose-600 shrink-0 inline-block" />}
          </h3>
          {link.description && (
            <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
              {link.description}
            </p>
          )}
        </div>
      </div>

      {/* Schedule Notice Box when not available */}
      {scheduleStatus.isScheduled && !scheduleStatus.isAvailable && (
        <p className={`w-full mb-3 text-[11px] font-bold px-3 py-2 rounded-xl flex items-center justify-start gap-1.5 text-left leading-relaxed z-10 ${scheduleStatus.badgeBg} ${scheduleStatus.badgeText} border ${scheduleStatus.badgeBorder}`}>
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{scheduleStatus.messageText}</span>
        </p>
      )}

      {/* Locked Status Notice - Full Width Mentok Kiri */}
      {link.isLocked && (
        <p className="w-full mb-4 text-[11px] font-bold text-rose-800 bg-rose-100/90 border border-rose-200/90 px-3 py-1.5 rounded-xl flex items-center justify-start gap-1.5 text-left leading-relaxed z-10">
          <Lock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>
            {link.pinCode
              ? 'Tautan dikunci oleh Administrator — Silakan masukkan kode PIN untuk akses.'
              : 'Tautan dikunci oleh Administrator — Silakan masukkan kode untuk akses.'}
          </span>
        </p>
      )}

      {/* Action Area */}
      {(() => {
        const canShowSecondaryActions = (!link.isLocked && !link.isStealthMode) || isAdmin;
        return (
          <div className={`link-card-actions pt-3 border-t border-slate-100 flex items-center justify-between gap-2 z-10 ${!canShowSecondaryActions && !isAdmin ? 'w-full justify-stretch' : ''}`}>
            {/* Main Navigate Button */}
            <button
              onClick={() => {
                if (scheduleStatus.isScheduled && !scheduleStatus.isAvailable && !isAdmin) {
                  showToast(scheduleStatus.messageText);
                  return;
                }
                onNavigate(link);
              }}
              className={`w-full flex-1 inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm transition-all duration-300 shadow-sm border ${
                scheduleStatus.isScheduled && !scheduleStatus.isAvailable && !isAdmin
                  ? 'bg-slate-200 text-slate-600 border-slate-300 cursor-not-allowed'
                  : link.isLocked && !isAdmin
                  ? 'bg-rose-100 hover:bg-rose-200 text-rose-900 border-rose-300'
                  : link.isLocked && isAdmin
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white border-amber-400/40'
                  : 'theme-btn-primary text-white border-amber-400/40 shadow-sm group-hover:shadow-md'
              }`}
            >
              {scheduleStatus.isScheduled && !scheduleStatus.isAvailable && !isAdmin ? (
                <>
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>
                    {scheduleStatus.state === 'upcoming' ? 'Belum Dibuka' : 'Jadwal Berakhir'}
                  </span>
                </>
              ) : link.isLocked ? (
                <>
                  <Lock className="w-4 h-4 text-rose-600" />
                  <span>
                    {isAdmin
                      ? 'Kunjungi'
                      : link.pinCode
                      ? 'Masukkan PIN'
                      : 'Akses Dikunci'}
                  </span>
                </>
              ) : (
                <>
                  <span>Kunjungi</span>
                  <ArrowUpRight className="w-4 h-4 text-amber-300 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </>
              )}
            </button>

            {/* Copy URL Icon Button - Hidden when link is locked or stealth mode for public users */}
            {canShowSecondaryActions && (
              <button
                type="button"
                onClick={handleCopyUrl}
                title={copied ? 'Tautan tersalin!' : 'Salin URL Tautan'}
                className={`p-2.5 rounded-2xl border font-bold text-xs transition-all duration-200 shrink-0 ${
                  copied
                    ? 'theme-btn-primary text-white shadow-sm'
                    : 'theme-bg-subtle theme-bg-subtle-hover theme-text-primary border-slate-200/90 shadow-2xs active:scale-95'
                }`}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-amber-200 animate-scale-in" />
                ) : (
                  <Copy className="w-4 h-4 theme-text-primary" />
                )}
              </button>
            )}

            {/* Social Share Menu Toggle Button - Hidden when link is locked or stealth mode for public users */}
            {canShowSecondaryActions && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsShareModalOpen(!isShareModalOpen);
                }}
                title="Bagikan ke Media Sosial"
                className="p-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/90 hover:border-amber-300 font-bold text-xs transition-all duration-200 shadow-2xs shrink-0 active:scale-95"
              >
                <Share2 className="w-4 h-4 text-amber-700" />
              </button>
            )}

            {/* Admin Quick Actions */}
            {isAdmin && (
              <div className="flex items-center gap-1 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80">
                {onToggleLock && (
                  <button
                    onClick={() => onToggleLock(link)}
                    title={link.isLocked ? 'Buka Kunci Link' : 'Kunci Link Ini'}
                    className={`p-1.5 rounded-xl transition-colors ${
                      link.isLocked
                        ? 'text-rose-700 bg-rose-100 hover:bg-rose-200'
                        : 'text-slate-500 hover:text-rose-600 hover:bg-slate-200'
                    }`}
                  >
                    {link.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>
                )}
                {onToggleActive && (
                  <button
                    onClick={() => onToggleActive(link)}
                    title={link.isActive ? 'Matikan Link' : 'Aktifkan Link'}
                    className={`p-1.5 rounded-xl transition-colors ${
                      link.isActive
                        ? 'text-emerald-700 hover:bg-emerald-100'
                        : 'text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={() => onEdit(link)}
                    title="Edit Link"
                    className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-100 rounded-xl transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(link)}
                    title="Hapus Link"
                    className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-100 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Social Media Share Popover Modal */}
      <AnimatePresence>
        {isShareModalOpen && ((!link.isLocked && !link.isStealthMode) || isAdmin) && (
          <div
            onClick={() => setIsShareModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-3xl p-5 border border-emerald-200 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Bagikan Tautan</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{link.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Social Options Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {socialShareOptions.map((opt) => {
                  const IconComp = opt.icon;
                  return (
                    <a
                      key={opt.name}
                      href={opt.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsShareModalOpen(false)}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl font-bold text-xs transition-all shadow-xs ${opt.bgColor}`}
                    >
                      <IconComp className="w-4 h-4 shrink-0" />
                      <span>{opt.name}</span>
                    </a>
                  );
                })}
              </div>

              {/* Additional Options */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl font-bold text-xs border border-emerald-200 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span>Gunakan Dialog Sistem Perangkat</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleCopyUrl();
                    setIsShareModalOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs border border-slate-200 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>Salin Alamat Tautan</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

