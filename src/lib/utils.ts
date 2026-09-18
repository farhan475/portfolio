import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** "Inter" -> "Inter:wght@400;500;600;700" untuk URL Google Fonts. */
export function googleFontsHref(families: string[]): string | null {
  const unique = [...new Set(families.map((f) => f.trim()).filter(Boolean))];
  if (unique.length === 0) return null;

  const params = unique
    .map((family) => `family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@400;500;600;700`)
    .join('&');

  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

/** Judul -> slug aman untuk URL. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 255);
}

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/** "2024-01-01" -> "Januari 2024". Tanggal kosong -> "Sekarang". */
export function formatMonthYear(date: string | null): string {
  if (!date) return 'Sekarang';
  const [year, month] = date.split('-');
  const index = Number(month) - 1;
  if (!year || Number.isNaN(index) || !MONTHS_ID[index]) return date;
  return `${MONTHS_ID[index]} ${year}`;
}

export function formatDateTime(value: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
