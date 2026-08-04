import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, KeyRound, X, ArrowUpRight, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { NavLinkItem } from '../types';
import { DynamicIcon } from './DynamicIcon';

interface PinUnlockModalProps {
  isOpen: boolean;
  link: NavLinkItem | null;
  onClose: () => void;
  onSuccess: (link: NavLinkItem) => void;
}

export const PinUnlockModal: React.FC<PinUnlockModalProps> = ({
  isOpen,
  link,
  onClose,
  onSuccess,
}) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEnteredPin('');
      setErrorMsg(null);
      setIsShaking(false);
      setShowPassword(false);
    }
  }, [isOpen, link]);

  if (!isOpen || !link) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredPin.trim()) {
      setErrorMsg('Silakan masukkan PIN keamanan.');
      return;
    }

    if (link.pinCode && enteredPin.trim() === link.pinCode.trim()) {
      setErrorMsg(null);
      onSuccess(link);
      onClose();
    } else {
      setErrorMsg('PIN yang Anda masukkan salah!');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={
            isShaking
              ? { x: [-10, 10, -10, 10, 0], opacity: 1, scale: 1, y: 0 }
              : { opacity: 1, scale: 1, y: 0 }
          }
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ duration: isShaking ? 0.4 : 0.2 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-rose-200 overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-rose-900 via-rose-800 to-amber-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-amber-300">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base tracking-tight text-white">
                  Tautan Dilindungi Administrator
                </h3>
                <p className="text-[11px] text-rose-100 font-medium">
                  Silakan masukkan kode PIN untuk akses
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Link Information Summary */}
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3.5 p-3.5 bg-rose-50/70 rounded-2xl border border-rose-100">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-rose-700 shadow-xs border border-rose-200">
                <DynamicIcon name={link.icon} className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-200/80 text-rose-900 mb-0.5">
                  {link.category}
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm truncate">
                  {link.title}
                </h4>
              </div>
            </div>

            {/* PIN Entry Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-rose-700" />
                  <span>Kode PIN Pembuka</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={enteredPin}
                    onChange={(e) => {
                      setEnteredPin(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Masukkan PIN..."
                    autoFocus
                    className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20 rounded-2xl text-base font-black tracking-widest text-slate-900 focus:outline-none transition-all placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message Alert */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-center gap-2 p-3 bg-rose-100 text-rose-900 rounded-xl border border-rose-300 text-xs font-extrabold"
                  >
                    <ShieldAlert className="w-4 h-4 shrink-0 text-rose-700" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-2xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-2xl text-xs font-extrabold bg-gradient-to-r from-rose-800 to-rose-900 hover:from-rose-700 hover:to-rose-800 text-white shadow-md shadow-rose-900/20 border border-amber-300/40 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <span>Buka & Kunjungi</span>
                  <ArrowUpRight className="w-4 h-4 text-amber-300" />
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
