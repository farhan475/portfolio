/**
 * Jembatan reset form admin. Kontrol native cukup dipulihkan lewat atribut
 * value / data-default, tapi island React memegang state sendiri, jadi halaman
 * memberi tahu mereka lewat event pada document.
 *
 * Berkas ini sengaja bebas React supaya script halaman bisa memakainya tanpa
 * ikut memuat React. Sisi React ada di components/admin/use-resettable.ts.
 */

export const ADMIN_RESET_EVENT = 'admin:reset';

/** stored = nilai yang tersimpan di database, default = nilai bawaan skema. */
export type ResetMode = 'stored' | 'default';

export interface ResetDetail {
  mode: ResetMode;
}

export function emitAdminReset(mode: ResetMode): void {
  document.dispatchEvent(new CustomEvent<ResetDetail>(ADMIN_RESET_EVENT, { detail: { mode } }));
}
