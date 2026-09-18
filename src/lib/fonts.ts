/**
 * Font yang berkasnya ikut di-deploy dari `public/fonts`.
 *
 * Mengambil font dari Google berarti dua lompatan berantai sebelum teks bisa
 * dicat: dokumen -> fonts.googleapis.com/css2 -> fonts.gstatic.com. Terukur
 * memblokir render 836ms di Lighthouse mobile, dan itu penahan terbesar FCP.
 * Berkas yang disajikan dari origin yang sama menghapus kedua lompatan itu.
 *
 * Font di luar daftar ini tetap diambil dari Google, supaya pilihan font di
 * /admin tidak dibatasi hanya pada yang sudah kita bundel.
 */
export interface SelfHostedFont {
  /** Rentang bobot font variabel, satu berkas untuk semua bobot. */
  weightRange: string;
  /**
   * Subset beserta unicode-range-nya. Hanya subset pertama yang di-preload;
   * sisanya diunduh browser hanya bila halaman memang memuat karakternya.
   */
  subsets: { url: string; unicodeRange: string }[];
}

export const SELF_HOSTED_FONTS: Record<string, SelfHostedFont> = {
  Inter: {
    weightRange: '100 900',
    subsets: [
      {
        url: '/fonts/inter-latin.woff2',
        unicodeRange:
          'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
      },
      {
        url: '/fonts/inter-latin-ext.woff2',
        unicodeRange:
          'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF',
      },
    ],
  },
};

/** Nama font dibandingkan tanpa peduli huruf besar-kecil dan spasi berlebih. */
function normalise(family: string): string {
  return family.trim().toLowerCase();
}

const BY_NORMALISED = new Map(
  Object.entries(SELF_HOSTED_FONTS).map(([name, font]) => [normalise(name), { name, font }]),
);

/** Daftar unik, urutan dipertahankan, nilai kosong dibuang. */
function unique(families: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const family of families) {
    const trimmed = family.trim();
    if (!trimmed || seen.has(normalise(trimmed))) continue;
    seen.add(normalise(trimmed));
    out.push(trimmed);
  }
  return out;
}

/** Font yang harus tetap diambil dari Google. */
export function remoteFamilies(families: string[]): string[] {
  return unique(families).filter((family) => !BY_NORMALISED.has(normalise(family)));
}

/** Berkas yang perlu di-preload: subset pertama dari setiap font lokal. */
export function preloadFonts(families: string[]): string[] {
  const out: string[] = [];
  for (const family of unique(families)) {
    const hit = BY_NORMALISED.get(normalise(family));
    if (hit?.font.subsets[0]) out.push(hit.font.subsets[0].url);
  }
  return out;
}

/**
 * Aturan @font-face untuk font lokal. Dipasang inline di <head> supaya tidak
 * menambah satu request lagi di jalur kritis.
 */
export function fontFaceCss(families: string[]): string {
  const blocks: string[] = [];

  for (const family of unique(families)) {
    const hit = BY_NORMALISED.get(normalise(family));
    if (!hit) continue;

    for (const subset of hit.font.subsets) {
      blocks.push(
        `@font-face{font-family:'${hit.name}';font-style:normal;font-weight:${hit.font.weightRange};` +
          `font-display:swap;src:url('${subset.url}') format('woff2');unicode-range:${subset.unicodeRange}}`,
      );
    }
  }

  return blocks.join('');
}
