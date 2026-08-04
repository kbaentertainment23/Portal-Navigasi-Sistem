import { NavLinkItem } from '../types';

export type ScheduleState = 'none' | 'active' | 'upcoming' | 'expired';

export interface ScheduleStatus {
  state: ScheduleState;
  isAvailable: boolean;
  isScheduled: boolean;
  startDateFormatted?: string;
  endDateFormatted?: string;
  badgeLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  messageText: string;
}

export function formatDateTimeIndonesian(dateTimeStr?: string): string {
  if (!dateTimeStr) return '';
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return dateTimeStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateTimeStr;
  }
}

export function getScheduleStatus(link: NavLinkItem, nowTime: Date = new Date()): ScheduleStatus {
  if (!link.isScheduled) {
    return {
      state: 'none',
      isAvailable: true,
      isScheduled: false,
      badgeLabel: '',
      badgeBg: '',
      badgeText: '',
      badgeBorder: '',
      messageText: '',
    };
  }

  const start = link.startDate ? new Date(link.startDate) : null;
  const end = link.endDate ? new Date(link.endDate) : null;

  const startFormatted = start ? formatDateTimeIndonesian(link.startDate) : undefined;
  const endFormatted = end ? formatDateTimeIndonesian(link.endDate) : undefined;

  const now = nowTime.getTime();

  // Check before start
  if (start && !isNaN(start.getTime()) && now < start.getTime()) {
    return {
      state: 'upcoming',
      isAvailable: false,
      isScheduled: true,
      startDateFormatted: startFormatted,
      endDateFormatted: endFormatted,
      badgeLabel: `Belum Dibuka (Mulai ${startFormatted})`,
      badgeBg: 'bg-amber-100/90',
      badgeText: 'text-amber-900',
      badgeBorder: 'border-amber-300',
      messageText: `Tautan ini dijadwalkan baru akan dibuka pada ${startFormatted}.`,
    };
  }

  // Check after end
  if (end && !isNaN(end.getTime()) && now > end.getTime()) {
    return {
      state: 'expired',
      isAvailable: false,
      isScheduled: true,
      startDateFormatted: startFormatted,
      endDateFormatted: endFormatted,
      badgeLabel: `Jadwal Berakhir (${endFormatted})`,
      badgeBg: 'bg-rose-100/90',
      badgeText: 'text-rose-900',
      badgeBorder: 'border-rose-300',
      messageText: `Masa berlaku tautan ini telah berakhir pada ${endFormatted}.`,
    };
  }

  // Otherwise inside schedule active window
  return {
    state: 'active',
    isAvailable: true,
    isScheduled: true,
    startDateFormatted: startFormatted,
    endDateFormatted: endFormatted,
    badgeLabel: endFormatted ? `Jadwal Aktif (s.d. ${endFormatted})` : 'Jadwal Aktif',
    badgeBg: 'bg-emerald-100/90',
    badgeText: 'text-emerald-900',
    badgeBorder: 'border-emerald-300',
    messageText: endFormatted
      ? `Tautan aktif sesuai jadwal hingga ${endFormatted}.`
      : 'Tautan aktif sesuai jadwal.',
  };
}
