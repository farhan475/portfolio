/** Kelas Tailwind yang dipakai berulang di form admin, supaya gaya seragam. */

/**
 * `text-base` di layar kecil bukan soal selera: Safari iOS memperbesar halaman
 * otomatis saat fokus ke input dengan font di bawah 16px.
 */
export const inputClass =
  'w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-base outline-none focus:border-primary sm:text-sm';

export const buttonPrimary =
  'rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90';

export const buttonGhost =
  'rounded-md border border-border-strong px-4 py-2.5 text-sm transition-colors hover:border-primary';

/** Untuk aksi yang menimpa banyak isian sekaligus, misal reset ke bawaan. */
export const buttonDanger =
  'rounded-md border border-red-500/40 px-4 py-2.5 text-sm text-red-400 transition-colors hover:border-red-500 hover:bg-red-500/10';

/** Tombol kecil di dalam baris isian, tetap cukup besar untuk disentuh. */
export const buttonInline =
  'inline-flex items-center gap-1.5 rounded-md border border-border-strong px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-primary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border-strong disabled:hover:text-muted';

export const checkboxClass = 'size-4 rounded border-border-strong accent-[var(--theme-primary)]';
