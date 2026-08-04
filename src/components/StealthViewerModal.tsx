import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  ArrowLeft,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import { NavLinkItem } from '../types';
import { getMaskedDisplayUrl } from '../lib/urlObfuscator';

interface StealthViewerModalProps {
  isOpen: boolean;
  link: NavLinkItem | null;
  isAdmin: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const StealthViewerModal: React.FC<StealthViewerModalProps> = ({
  isOpen,
  link,
  onClose,
}) => {
  const [iframeError, setIframeError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  if (!isOpen || !link) return null;

  const maskedDisplayUrl = getMaskedDisplayUrl(link.url, true, false);

  const handleDirectLaunch = () => {
    // Open in secure window
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-lg animate-fade-in">
      {/* Compact Top Header */}
      <header className="h-12 px-3 sm:px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
        {/* Left: Back button & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onClose}
            title="Kembali"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors shrink-0 border border-slate-700/60"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Kembali</span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <h2 className="text-xs sm:text-sm font-extrabold text-white truncate flex items-center gap-1.5">
              <span>{link.title}</span>
              {link.isLocked && <Lock className="w-3 h-3 text-rose-400 shrink-0" />}
            </h2>
          </div>
        </div>

        {/* Center: Compact Obfuscated URL Address Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-3 items-center gap-1.5 px-3 py-1 bg-slate-950 rounded-lg border border-slate-800 text-slate-400 text-[11px] font-mono">
          <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="text-emerald-400/90 font-bold shrink-0">https://</span>
          <span className="text-slate-300 truncate flex-1">{maskedDisplayUrl.replace('https://', '')}</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[9px] font-bold border border-emerald-500/20 shrink-0">
            TERENKRIPSI
          </span>
        </div>

        {/* Right Actions: Reload icon button & Close icon button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIframeKey((prev) => prev + 1)}
            title="Muat Ulang"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition-colors border border-slate-700/60"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            title="Tutup Modal"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Viewer Area */}
      <div className="flex-1 relative overflow-hidden bg-slate-900 flex flex-col">
        {/* Iframe View or Fallback Card */}
        <div className="flex-1 relative w-full h-full">
          {!iframeError ? (
            <iframe
              key={iframeKey}
              src={link.url}
              title={link.title}
              onError={() => setIframeError(true)}
              className="w-full h-full border-0 bg-white"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-slate-200">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-extrabold text-white mb-2">
                Situs Melindungi Penampilan dalam Frame
              </h3>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6">
                Situs tujuan (<strong>{link.title}</strong>) memiliki kebijakan keamanan X-Frame-Options. Klik tombol di bawah untuk membuka tautan secara langsung dengan token acak.
              </p>
              <button
                onClick={handleDirectLaunch}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all shadow-lg flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Lanjutkan ke Situs Tujuan ({link.title})</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
