import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="relative flex flex-col justify-between rounded-3xl border border-emerald-100/90 p-5 sm:p-6 bg-white/95 backdrop-blur-sm shadow-sm overflow-hidden min-h-[190px]">
      {/* Shimmer overlay effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-emerald-100/40 to-transparent pointer-events-none" />

      {/* Top Header Section */}
      <div className="space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          {/* Icon Box Skeleton */}
          <div className="w-12 h-12 rounded-2xl bg-slate-200/80 animate-pulse shrink-0" />
          {/* Badge Skeleton */}
          <div className="w-20 h-5 rounded-full bg-slate-200/70 animate-pulse" />
        </div>

        {/* Title & Subtitle Skeleton */}
        <div className="space-y-2 pt-1">
          <div className="w-3/4 h-5 rounded-lg bg-slate-200/90 animate-pulse" />
          <div className="w-full h-3.5 rounded-md bg-slate-200/60 animate-pulse" />
          <div className="w-4/5 h-3.5 rounded-md bg-slate-200/50 animate-pulse" />
        </div>
      </div>

      {/* Action Footer Area Skeleton */}
      <div className="pt-4 mt-4 border-t border-slate-100/80 flex items-center justify-between gap-2">
        <div className="flex-1 h-10 rounded-2xl bg-slate-200/80 animate-pulse" />
        <div className="w-10 h-10 rounded-2xl bg-slate-200/70 animate-pulse shrink-0" />
        <div className="w-10 h-10 rounded-2xl bg-slate-200/70 animate-pulse shrink-0" />
      </div>
    </div>
  );
};

export const SkeletonGrid: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Skeleton Header Label */}
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-slate-200 animate-pulse" />
        <div className="w-36 h-4 rounded-md bg-slate-200 animate-pulse" />
      </div>

      {/* Skeleton Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <SkeletonCard key={idx} />
        ))}
      </div>
    </div>
  );
};
