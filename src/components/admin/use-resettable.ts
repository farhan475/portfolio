import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { ADMIN_RESET_EVENT, type ResetDetail } from '../../lib/reset';

/**
 * State biasa yang ikut pulih saat halaman memancarkan event reset.
 * `stored` dipakai untuk membatalkan perubahan, `fallback` untuk nilai bawaan.
 */
export function useResettable<T>(stored: T, fallback: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(stored);

  // Disimpan di ref supaya listener cukup dipasang sekali, walau `fallback`
  // ditulis sebagai literal baru pada tiap render.
  const latest = useRef({ stored, fallback });
  latest.current = { stored, fallback };

  useEffect(() => {
    function handle(event: Event) {
      const detail = (event as CustomEvent<ResetDetail>).detail;
      setValue(detail?.mode === 'default' ? latest.current.fallback : latest.current.stored);
    }

    document.addEventListener(ADMIN_RESET_EVENT, handle);
    return () => document.removeEventListener(ADMIN_RESET_EVENT, handle);
  }, []);

  return [value, setValue];
}
