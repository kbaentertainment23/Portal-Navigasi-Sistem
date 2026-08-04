import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { DEFAULT_CATEGORIES } from '../types';

interface CategoryFilterProps {
  categories?: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalActiveCount: number;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories = DEFAULT_CATEGORIES,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  totalActiveCount,
}) => {
  const displayCategories = ['Semua', ...categories.filter((c) => c !== 'Semua')];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4 mb-8"
    >
      {/* Search Input Bar */}
      <div className="relative max-w-xl mx-auto group">
        <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none theme-text-primary">
          <Search className="w-5 h-5 transition-transform group-focus-within:scale-110" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari tautan, informasi, atau layanan..."
          className="w-full pl-12 pr-24 py-3.5 bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-300/40 theme-border-primary shadow-sm hover:shadow-md transition-all"
        />
        <AnimatePresence>
          {searchQuery ? (
            <motion.button
              key="clear-btn"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-3 my-auto h-7 px-2.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition-colors"
            >
              Bersihkan
            </motion.button>
          ) : (
            <motion.div
              key="count-badge"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-y-0 right-3.5 my-auto h-6 flex items-center gap-1 px-2 rounded-md theme-bg-subtle border border-slate-200/80 text-[10px] font-bold theme-text-primary"
            >
              <span>{totalActiveCount} Link</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Categories Horizontal Bar with smooth layoutId sliding background */}
      <div className="relative w-full mx-auto">
        <div className="flex items-center justify-start sm:justify-center flex-nowrap sm:flex-wrap gap-2 overflow-x-auto sm:overflow-x-visible py-2.5 px-2 no-scrollbar w-full snap-x scroll-smooth min-h-[52px]">
          {displayCategories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <motion.button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                className={`relative min-h-[42px] px-4.5 py-2.5 rounded-2xl text-xs sm:text-xs font-extrabold whitespace-nowrap shrink-0 transition-all duration-300 border snap-start active:scale-95 touch-manipulation overflow-hidden ${
                  isSelected
                    ? 'text-white shadow-md border-transparent'
                    : 'bg-white/95 text-slate-700 border-slate-200/90 hover:border-slate-300 theme-bg-subtle-hover hover:text-slate-900 hover:shadow-2xs'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeCategoryPill"
                    className="absolute inset-0 theme-btn-primary rounded-2xl z-0 shadow-sm"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <motion.span
                  className="relative z-10 inline-block"
                  animate={{
                    scale: isSelected ? 1.03 : 1,
                    fontWeight: isSelected ? 800 : 700,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {cat}
                </motion.span>
              </motion.button>
            );
          })}
        </div>

        {/* Active Category Status Banner with smooth slide & fade animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center gap-2 mt-2 text-[11px] font-bold text-slate-500"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Kategori Aktif:</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-900 border border-emerald-200/90 font-extrabold">
              {selectedCategory}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

