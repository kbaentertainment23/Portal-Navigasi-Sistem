import React from 'react';
import { ArrowUp, Sparkles, Trees, Lock, LogOut, Sliders } from 'lucide-react';
import { SiteSettings } from '../types';

interface FooterProps {
  settings: SiteSettings;
  totalLinksCount?: number;
  totalClicksCount?: number;
  isAdminLoggedIn?: boolean;
  onOpenSettings?: () => void;
  onAdminLogout?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  isAdminLoggedIn,
  onOpenSettings,
  onAdminLogout,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative border-t border-slate-200/80 bg-white/80 backdrop-blur-xl mt-auto z-20">
      {/* Top subtle ornamental bar */}
      <div className="h-1 w-full theme-header-bar opacity-80" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          {/* Brand Info & Copyright */}
          <div className="flex items-center gap-3">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Logo Footer"
                className="h-9 w-9 object-contain rounded-xl bg-white p-0.5 border border-slate-200 shadow-xs shrink-0"
              />
            ) : (
              <div className="h-9 w-9 rounded-xl theme-icon-box flex items-center justify-center text-white shadow-xs shrink-0">
                <Trees className="w-5 h-5 text-amber-200" />
              </div>
            )}
            <div>
              <p className="font-extrabold text-slate-800 text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-2 leading-tight">
                <span>{settings.siteTitle || 'Portal Nyiur Indah'}</span>
                <span className="text-slate-400 font-normal">© {new Date().getFullYear()}</span>
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center justify-center sm:justify-start gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Portal Navigasi & Integrasi Terpadu</span>
              </p>
            </div>
          </div>

          {/* Right Action: Admin Access & Scroll To Top */}
          <div className="flex items-center gap-2.5">
            {isAdminLoggedIn ? (
              <>
                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    title="Buka Panel Admin"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Panel Admin</span>
                  </button>
                )}
                {onAdminLogout && (
                  <button
                    type="button"
                    onClick={onAdminLogout}
                    title="Keluar Mode Admin"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-600" />
                    <span>Keluar Admin</span>
                  </button>
                )}
              </>
            ) : (
              onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  title="Akses Login Admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 text-xs font-semibold border border-slate-200/80 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5 theme-text-primary" />
                  <span>Admin</span>
                </button>
              )
            )}

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full theme-bg-subtle border border-slate-200/80 text-[11px] font-bold theme-text-primary">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Sistem Akses Terpadu</span>
            </div>
            <button
              type="button"
              onClick={scrollToTop}
              title="Kembali ke Atas"
              className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold border border-slate-200/90 transition-all duration-200 active:scale-95 shrink-0 shadow-2xs hover:shadow-xs"
            >
              <span>Atas</span>
              <ArrowUp className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};



