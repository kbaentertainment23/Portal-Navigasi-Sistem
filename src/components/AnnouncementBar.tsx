import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, AlertTriangle, Info, CheckCircle2, ExternalLink, X, Bell } from 'lucide-react';
import { SiteSettings, AnnouncementType } from '../types';

interface AnnouncementBarProps {
  settings: SiteSettings;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ settings }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  const {
    announcementEnabled = false,
    announcementText = '',
    announcementType = 'urgent',
    announcementLink = '',
    announcementLinkText = '',
    announcementIsDismissible = true,
  } = settings;

  useEffect(() => {
    if (!announcementText) return;
    const dismissedText = sessionStorage.getItem('announcement_dismissed_key');
    if (dismissedText === announcementText) {
      setIsDismissed(true);
    } else {
      setIsDismissed(false);
    }
  }, [announcementText]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (announcementText) {
      sessionStorage.setItem('announcement_dismissed_key', announcementText);
    }
  };

  if (!announcementEnabled || !announcementText || isDismissed) {
    return null;
  }

  // Preset styles based on type
  const getBannerStyle = (type: AnnouncementType) => {
    switch (type) {
      case 'warning':
        return {
          containerClass: 'bg-gradient-to-r from-amber-700 via-amber-800 to-orange-800 text-amber-50 border-b border-amber-500/40',
          badgeClass: 'bg-amber-900/60 text-amber-200 border-amber-400/50',
          badgeText: 'PENTING / PERHATIAN',
          icon: <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 animate-bounce" />,
          btnClass: 'bg-amber-300 text-amber-950 hover:bg-amber-200 border-amber-400',
        };
      case 'urgent':
        return {
          containerClass: 'bg-gradient-to-r from-rose-800 via-red-700 to-rose-900 text-rose-50 border-b border-rose-500/40',
          badgeClass: 'bg-rose-950/70 text-rose-200 border-rose-400/50',
          badgeText: 'PENGUMUMAN DARURAT',
          icon: <Megaphone className="w-4 h-4 text-rose-300 shrink-0 animate-pulse" />,
          btnClass: 'bg-amber-300 text-rose-950 hover:bg-amber-200 border-amber-400',
        };
      case 'success':
        return {
          containerClass: 'bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-emerald-50 border-b border-emerald-500/40',
          badgeClass: 'bg-emerald-950/70 text-emerald-200 border-emerald-400/50',
          badgeText: 'INFORMASI TERBARU',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />,
          btnClass: 'bg-emerald-300 text-emerald-950 hover:bg-emerald-200 border-emerald-400',
        };
      case 'info':
      default:
        return {
          containerClass: 'bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-slate-100 border-b border-sky-500/30',
          badgeClass: 'bg-sky-950/80 text-sky-300 border-sky-400/40',
          badgeText: 'INFORMASI RESMI',
          icon: <Bell className="w-4 h-4 text-sky-300 shrink-0 animate-pulse" />,
          btnClass: 'bg-sky-300 text-slate-950 hover:bg-sky-200 border-sky-300',
        };
    }
  };

  const style = getBannerStyle(announcementType);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`relative z-40 w-full overflow-hidden shadow-sm ${style.containerClass}`}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-2.5 sm:py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 text-center sm:text-left">
            {/* Left Content Badge + Message */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 min-w-0">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider border shadow-2xs shrink-0 ${style.badgeClass}`}>
                {style.icon}
                <span>{style.badgeText}</span>
              </div>

              <p className="text-xs sm:text-sm font-semibold tracking-tight leading-snug break-words">
                {announcementText}
              </p>
            </div>

            {/* Right Action CTA & Close Button */}
            <div className="flex items-center gap-2 shrink-0">
              {announcementLink && (
                <a
                  href={announcementLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 shadow-2xs hover:scale-105 active:scale-95 ${style.btnClass}`}
                >
                  <span>{announcementLinkText || 'Selengkapnya'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              {announcementIsDismissible && (
                <button
                  type="button"
                  onClick={handleDismiss}
                  title="Tutup Pengumuman"
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
