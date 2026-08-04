import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Save, Globe, Sparkles, Check, Link as LinkIcon, Lock, KeyRound, Upload, Image as ImageIcon, Calendar, Clock, Timer, ShieldCheck } from 'lucide-react';
import { NavLinkItem, DEFAULT_CATEGORIES, ICON_OPTIONS, COLOR_PRESETS, LinkColor } from '../types';
import { DynamicIcon } from './DynamicIcon';

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (linkData: Omit<NavLinkItem, 'id' | 'clicks'>, editId?: string) => void;
  editingLink?: NavLinkItem | null;
  defaultOrder?: number;
  categories?: string[];
  customIcons?: string[];
  onAddCustomIcon?: (iconUrl: string) => void;
}

export const LinkModal: React.FC<LinkModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingLink,
  defaultOrder = 1,
  categories = DEFAULT_CATEGORIES,
  customIcons = [],
  onAddCustomIcon,
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Utama');
  const [icon, setIcon] = useState<string>('Globe');
  const [color, setColor] = useState<LinkColor>('indigo');
  const [order, setOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [pinCode, setPinCode] = useState<string>('');
  const [isStealthMode, setIsStealthMode] = useState<boolean>(false);
  
  // Penjadwalan Otomatis Tautan
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [expiredAction, setExpiredAction] = useState<'hide' | 'lock'>('hide');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Custom Icon selector state
  const [iconTab, setIconTab] = useState<'preset' | 'upload' | 'url'>('preset');
  const [customIconUrlInput, setCustomIconUrlInput] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Persist selected/uploaded custom icon in sessionStorage to prevent preview loss during Firestore reconnects
  const handleSetIcon = (newIcon: string) => {
    setIcon(newIcon);
    if (newIcon.startsWith('data:') || newIcon.startsWith('http')) {
      try {
        sessionStorage.setItem('pending_custom_icon_preview', newIcon);
      } catch (e) {
        console.warn('Could not cache icon preview in sessionStorage:', e);
      }
    } else {
      sessionStorage.removeItem('pending_custom_icon_preview');
    }
  };

  useEffect(() => {
    if (editingLink) {
      setTitle(editingLink.title || '');
      setUrl(editingLink.url || '');
      setDescription(editingLink.description || '');
      setCategory(editingLink.category || 'Utama');
      setIcon(editingLink.icon || 'Globe');
      setColor(editingLink.color || 'indigo');
      setOrder(editingLink.order || 1);
      setIsActive(editingLink.isActive !== false);
      setIsFeatured(Boolean(editingLink.isFeatured));
      setIsLocked(Boolean(editingLink.isLocked));
      setPinCode(editingLink.pinCode || '');
      setIsStealthMode(Boolean(editingLink.isStealthMode));

      setIsScheduled(Boolean(editingLink.isScheduled));
      setStartDate(editingLink.startDate || '');
      setEndDate(editingLink.endDate || '');
      setExpiredAction(editingLink.expiredAction || 'hide');

      if (editingLink.icon && (editingLink.icon.startsWith('http') || editingLink.icon.startsWith('data:'))) {
        setIconTab(editingLink.icon.startsWith('data:') ? 'upload' : 'url');
        setCustomIconUrlInput(editingLink.icon.startsWith('http') ? editingLink.icon : '');
      } else {
        setIconTab('preset');
      }
    } else {
      // Check if there is an un-saved preview image in sessionStorage from ongoing session
      const cachedPreview = typeof window !== 'undefined' ? sessionStorage.getItem('pending_custom_icon_preview') : null;
      setTitle('');
      setUrl('https://');
      setDescription('');
      setCategory('Utama');
      setIcon(cachedPreview || 'Globe');
      setColor('indigo');
      setOrder(defaultOrder);
      setIsActive(true);
      setIsFeatured(false);
      setIsLocked(false);
      setPinCode('');
      setIsStealthMode(false);
      setIsScheduled(false);
      setStartDate('');
      setEndDate('');
      setExpiredAction('hide');
      if (cachedPreview) {
        setIconTab(cachedPreview.startsWith('data:') ? 'upload' : 'url');
        setCustomIconUrlInput(cachedPreview.startsWith('http') ? cachedPreview : '');
      } else {
        setIconTab('preset');
        setCustomIconUrlInput('');
      }
    }
    setErrors({});
    setUploadError('');
  }, [editingLink, isOpen, defaultOrder]);

  if (!isOpen) return null;

  const validateUrlFormat = (inputUrl: string): { isValid: boolean; normalizedUrl: string; errorMsg?: string } => {
    const trimmed = inputUrl.trim();
    if (!trimmed || trimmed === 'https://' || trimmed === 'http://') {
      return { isValid: false, normalizedUrl: trimmed, errorMsg: 'URL link wajib diisi.' };
    }

    // Special protocols: mailto, tel, whatsapp
    if (trimmed.startsWith('mailto:')) {
      const email = trimmed.replace('mailto:', '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { isValid: false, normalizedUrl: trimmed, errorMsg: 'Format email (mailto:) tidak valid.' };
      }
      return { isValid: true, normalizedUrl: trimmed };
    }

    if (trimmed.startsWith('tel:')) {
      const phone = trimmed.replace('tel:', '').trim();
      if (!/^\+?[0-9\s\-\(\)]{5,20}$/.test(phone)) {
        return { isValid: false, normalizedUrl: trimmed, errorMsg: 'Format nomor telepon (tel:) tidak valid.' };
      }
      return { isValid: true, normalizedUrl: trimmed };
    }

    // Auto-prefix protocol if missing
    let formatted = trimmed;
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(formatted)) {
      formatted = `https://${formatted}`;
    }

    try {
      const parsed = new URL(formatted);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { isValid: false, normalizedUrl: formatted, errorMsg: 'URL harus menggunakan protokol http:// atau https://.' };
      }

      const hostname = parsed.hostname;
      if (!hostname || hostname.length < 3) {
        return { isValid: false, normalizedUrl: formatted, errorMsg: 'Alamat domain/server URL tidak valid.' };
      }

      // Ensure hostname contains dot (e.g. domain.com) or is localhost / IP
      const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
      const isLocalhost = hostname === 'localhost';
      if (!hostname.includes('.') && !isIp && !isLocalhost) {
        return { isValid: false, normalizedUrl: formatted, errorMsg: 'Format domain tidak lengkap (contoh: https://domain.com).' };
      }

      return { isValid: true, normalizedUrl: formatted };
    } catch {
      return { isValid: false, normalizedUrl: formatted, errorMsg: 'Format URL tidak valid. Pastikan penulisan tautan benar.' };
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Judul link wajib diisi.';
    
    const urlValidation = validateUrlFormat(url);
    if (!urlValidation.isValid) {
      newErrors.url = urlValidation.errorMsg || 'Format URL tidak valid.';
    } else {
      setUrl(urlValidation.normalizedUrl);
    }

    if (isScheduled) {
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        newErrors.schedule = 'Tanggal & Jam Mulai Tayang tidak boleh setelah Selesai Tayang.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const urlValidation = validateUrlFormat(url);
    if (!title.trim() || !urlValidation.isValid) {
      validate();
      return;
    }

    const finalUrl = urlValidation.normalizedUrl;

    onSave(
      {
        title: title.trim(),
        url: finalUrl,
        description: description.trim(),
        category,
        icon,
        color,
        order: Number(order) || 1,
        isActive,
        isFeatured,
        isLocked,
        pinCode: pinCode.trim(),
        isStealthMode,
        isScheduled,
        startDate,
        endDate,
        expiredAction,
      },
      editingLink?.id
    );
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-emerald-100 my-8 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-emerald-100 bg-emerald-50/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-700 text-white shadow-xs">
                {editingLink ? <Sparkles className="w-5 h-5 text-amber-300" /> : <Plus className="w-5 h-5 text-amber-300" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingLink ? 'Edit Link Navigasi' : 'Tambah Link Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingLink ? 'Ubah informasi tautan yang sudah ada' : 'Tambahkan tombol tautan baru ke halaman utama'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Title & URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Tautan / Tombol <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Website Resmi Perusahaan"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-emerald-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-600"
                />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL Tujuan (Tautan) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-600">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://contoh.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-emerald-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-600"
                  />
                </div>
                {errors.url && <p className="text-xs text-red-500 mt-1">{errors.url}</p>}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deskripsi Singkat (Opsional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Penjelasan singkat mengenai isi atau kegunaan link ini..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-emerald-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-600"
              />
            </div>

            {/* Category & Order */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Link
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-emerald-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-600"
                >
                  {Array.from(
                    new Set([
                      ...categories.filter((c) => c !== 'Semua'),
                      ...(category ? [category] : []),
                    ])
                  )
                    .filter(Boolean)
                    .map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Urutan Tampil (Angka Kecil Di Atas)
                </label>
                <input
                  type="number"
                  min={1}
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-emerald-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Icon & Custom Logo Picker Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Ikon & Logo Tombol
                </label>
                {/* Active Selected Icon Preview Badge */}
                <div className="flex items-center gap-2 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                  <span className="text-[11px] font-medium text-emerald-800">Pratinjau:</span>
                  <div className="w-7 h-7 flex items-center justify-center bg-white rounded-lg border border-emerald-300 overflow-hidden shrink-0 shadow-2xs">
                    <DynamicIcon name={icon} className="w-5 h-5 object-contain" />
                  </div>
                </div>
              </div>

              {/* Icon Mode Tabs */}
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 gap-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setIconTab('preset')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    iconTab === 'preset'
                      ? 'bg-white text-emerald-900 shadow-xs border border-emerald-200 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Ikon System ({ICON_OPTIONS.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIconTab('upload')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    iconTab === 'upload'
                      ? 'bg-white text-emerald-900 shadow-xs border border-emerald-200 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Upload Logo (File)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIconTab('url')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    iconTab === 'url'
                      ? 'bg-white text-emerald-900 shadow-xs border border-emerald-200 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                  <span>URL Gambar Logo</span>
                </button>
              </div>

              {/* TAB 1: PRESET ICONS */}
              {iconTab === 'preset' && (
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-emerald-200">
                  {ICON_OPTIONS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIcon(item.id)}
                      title={item.label}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                        icon === item.id
                          ? 'bg-emerald-700 text-white border-amber-400/60 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <DynamicIcon name={item.id} className="w-5 h-5 mb-1" />
                      <span className="text-[10px] truncate max-w-full font-medium">{item.id}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* TAB 2: UPLOAD CUSTOM LOGO FILE */}
              {iconTab === 'upload' && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-emerald-200 space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-emerald-50 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl text-xs font-bold text-emerald-800 transition-all">
                      <Upload className="w-4 h-4 text-emerald-600" />
                      <span>Unggah Gambar Logo (PNG / JPG / SVG / WebP)</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 3 * 1024 * 1024) {
                              setUploadError('Ukuran file maksimal 3 MB.');
                              return;
                            }
                            setUploadError('');
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              const result = evt.target?.result as string;
                              if (result) {
                                handleSetIcon(result);
                                if (onAddCustomIcon) onAddCustomIcon(result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {uploadError && <p className="text-xs text-red-500 font-medium">{uploadError}</p>}

                  {/* Active Upload Preview */}
                  {icon && (icon.startsWith('data:') || icon.startsWith('http')) && (
                    <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-emerald-300">
                      <div className="flex items-center gap-2.5">
                        <img src={icon} alt="Logo custom" className="w-9 h-9 object-contain rounded-lg border border-slate-200 p-0.5 bg-slate-50" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">Logo Custom Aktif</p>
                          <p className="text-[10px] text-emerald-700 font-medium">Logo khusus ini dipasang untuk tautan</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIcon('Globe')}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2.5 py-1 rounded-lg hover:bg-rose-50 border border-rose-200"
                      >
                        Reset Icon
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: URL CUSTOM LOGO LINK */}
              {iconTab === 'url' && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-emerald-200 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={customIconUrlInput}
                      onChange={(e) => setCustomIconUrlInput(e.target.value)}
                      placeholder="Masukkan URL logo (https://contoh.com/logo.png)"
                      className="flex-1 px-3.5 py-2 bg-white border border-emerald-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = customIconUrlInput.trim();
                        if (trimmed) {
                          const res = validateUrlFormat(trimmed);
                          if (res.isValid) {
                            handleSetIcon(res.normalizedUrl);
                            if (onAddCustomIcon) onAddCustomIcon(res.normalizedUrl);
                            setUploadError('');
                          } else {
                            setUploadError(res.errorMsg || 'URL logo custom tidak valid.');
                          }
                        }
                      }}
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                    >
                      <Check className="w-3.5 h-3.5 text-amber-300" />
                      <span>Gunakan</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    • Anda dapat menyalin tautan logo/ikon dari Google Drive, Imgur, PostImg, atau situs web resmi Anda.
                  </p>
                </div>
              )}

              {/* SAVED CUSTOM LOGOS BY ADMIN (IF ANY) */}
              {customIcons && customIcons.length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    Koleksi Logo Custom Admin ({customIcons.length}):
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {customIcons.map((customImg, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setIcon(customImg)}
                        title="Gunakan logo ini"
                        className={`p-1.5 rounded-xl border transition-all shrink-0 bg-white ${
                          icon === customImg
                            ? 'ring-2 ring-emerald-600 border-emerald-600 shadow-sm'
                            : 'border-slate-200 hover:border-emerald-400'
                        }`}
                      >
                        <img src={customImg} alt={`Custom logo ${idx}`} className="w-7 h-7 object-contain rounded-md" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Color Palette Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Pilih Warna Tema Card
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setColor(preset.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      preset.bg
                    } ${preset.border} ${preset.text} ${
                      color === preset.id ? 'ring-2 ring-emerald-600 ring-offset-1 font-bold' : ''
                    }`}
                  >
                    <span>{preset.name}</span>
                    {color === preset.id && <Check className="w-4 h-4 text-emerald-700" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Switches & Options */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Status Tampil (Aktif)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                />
                <span className="text-xs font-semibold text-amber-800 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                  Link Unggulan
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-extrabold text-blue-900 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-700" />
                  Jadwalkan Waktu Tayang
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <input
                  type="checkbox"
                  checked={isStealthMode}
                  onChange={(e) => setIsStealthMode(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Samarkan Tautan (Stealth)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                <input
                  type="checkbox"
                  checked={isLocked}
                  onChange={(e) => setIsLocked(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="text-xs font-bold text-rose-800 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                  Kunci PIN
                </span>
              </label>
            </div>

            {/* Stealth Mode Callout Box */}
            <AnimatePresence>
              {isStealthMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-emerald-50/90 rounded-2xl border border-emerald-200/90 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <h4 className="text-xs font-extrabold text-emerald-950">
                      Penyamaran Tautan (Stealth Mode) Aktif Untuk Link Ini
                    </h4>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Saat diklik oleh pengunjung, tautan ini akan dibuka dalam viewer terenkripsi internal agar URL asli (seperti ni-order) disamarkan dan tidak terlihat langsung di address bar.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scheduled Link Settings Box */}
            <AnimatePresence>
              {isScheduled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-sky-50/90 rounded-2xl border border-sky-200/90 space-y-3.5"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-sky-200/70">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-sky-200 text-sky-900 rounded-lg">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-sky-950">
                          Penjadwalan Otomatis Tautan (Scheduled Link)
                        </h4>
                        <p className="text-[11px] text-sky-800">Atur tanggal & jam tayang otomatis untuk pendaftaran atau acara berbatas waktu</p>
                      </div>
                    </div>
                  </div>

                  {errors.schedule && (
                    <p className="p-2.5 bg-rose-100 border border-rose-300 rounded-xl text-xs font-bold text-rose-900">
                      {errors.schedule}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Start Date & Time */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Mulai Tayang (Tanggal & Jam)</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-sky-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/25"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Kosongkan jika ingin langsung tayang</span>
                    </div>

                    {/* End Date & Time */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5 text-rose-600" />
                        <span>Selesai Tayang (Tanggal & Jam)</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-sky-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/25"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Kosongkan jika tayang tanpa batas akhir</span>
                    </div>
                  </div>

                  {/* Expired Action Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Tindakan Jika Di Luar Waktu Jadwal:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setExpiredAction('hide')}
                        className={`p-2.5 rounded-xl border text-xs text-left font-bold transition-all flex items-start gap-2 ${
                          expiredAction === 'hide'
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="w-2 h-2 rounded-full bg-amber-400 mt-1 shrink-0" />
                        <div>
                          <span>Sembunyikan Otomatis (Rekomendasi)</span>
                          <span className="block text-[10px] opacity-80 font-normal">Tautan otomatis disembunyikan dari halaman publik</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpiredAction('lock')}
                        className={`p-2.5 rounded-xl border text-xs text-left font-bold transition-all flex items-start gap-2 ${
                          expiredAction === 'lock'
                            ? 'bg-amber-900 text-white border-amber-900 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="w-2 h-2 rounded-full bg-amber-400 mt-1 shrink-0" />
                        <div>
                          <span>Tetap Tampilkan & Kunci Akses</span>
                          <span className="block text-[10px] opacity-80 font-normal">Tampilan kartu tetap muncul dengan badge status jadwal</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* PIN Code Input Field when Locked */}
            <AnimatePresence>
              {isLocked && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-rose-50/90 rounded-2xl border border-rose-200/90 space-y-2.5"
                >
                  <label className="block text-xs font-extrabold text-rose-950 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-rose-700" />
                    <span>Kode PIN Pembuka Tautan (Opsional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={12}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      placeholder="Contoh: 1234 atau RAHASIA..."
                      className="w-full px-3.5 py-2.5 bg-white border border-rose-300 rounded-xl text-sm font-extrabold text-rose-950 focus:outline-none focus:ring-2 focus:ring-rose-500/25 focus:border-rose-600 tracking-wider placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400"
                    />
                  </div>
                  <p className="text-[11px] text-rose-800 leading-relaxed font-medium">
                    • <strong>Jika PIN diisi:</strong> Pengunjung umum dapat membuka tautan di halaman utama dengan memasukkan PIN ini.<br />
                    • <strong>Jika PIN kosong:</strong> Tautan akan dikunci total dari publik (hanya bisa dibuka oleh Admin).
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer buttons */}
            <div className="flex gap-3 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 shadow-md shadow-emerald-700/20 border border-amber-400/30 transition-all flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4 text-amber-300" />
                <span>{editingLink ? 'Simpan Perubahan' : 'Tambah Link'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
