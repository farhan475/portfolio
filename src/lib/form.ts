import type { ZodError } from 'zod';

/** Helper parsing FormData. Nilai kosong selalu jadi null, bukan string kosong. */

export function formText(form: FormData, key: string): string | null {
  const raw = form.get(key);
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed === '' ? null : trimmed;
}

export function formRequired(form: FormData, key: string): string {
  return formText(form, key) ?? '';
}

export function formBool(form: FormData, key: string): boolean {
  return form.get(key) === 'on' || form.get(key) === 'true';
}

export function formInt(form: FormData, key: string, fallback = 0): number {
  const raw = form.get(key);
  if (typeof raw !== 'string' || raw.trim() === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/** Membaca hidden input berisi JSON array dari TagInput. */
export function formStringArray(form: FormData, key: string): string[] {
  const raw = form.get(key);
  if (typeof raw !== 'string' || raw.trim() === '') return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

/** Menggabungkan pesan error Zod jadi satu kalimat untuk ditampilkan ke admin. */
export function zodMessage(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join('; ');
}

/** Redirect kembali ke halaman dengan pesan sukses atau error. */
export function backTo(path: string, params: { ok?: string; error?: string }): string {
  const search = new URLSearchParams();
  if (params.ok) search.set('ok', params.ok);
  if (params.error) search.set('error', params.error);
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}
