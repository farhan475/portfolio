/**
 * Daftar putih tabel dan kolom yang boleh disentuh endpoint admin generik.
 * Nama tabel dan kolom datang dari browser, jadi tidak boleh dipakai apa adanya.
 * RLS tetap lapisan pertahanan utama; ini mencegah endpoint dipakai lintas tabel.
 */

export const SORTABLE_TABLES = [
  'sections',
  'projects',
  'skills',
  'experiences',
  'social_links',
] as const;

export type SortableTable = (typeof SORTABLE_TABLES)[number];

export const TOGGLEABLE_FIELDS: Record<SortableTable, readonly string[]> = {
  sections: ['is_visible'],
  projects: ['is_published', 'featured'],
  skills: ['is_visible'],
  experiences: ['is_visible'],
  social_links: ['is_visible'],
};

export const DELETABLE_TABLES: readonly SortableTable[] = [
  'sections',
  'projects',
  'skills',
  'experiences',
  'social_links',
];

export function isSortableTable(value: unknown): value is SortableTable {
  return typeof value === 'string' && (SORTABLE_TABLES as readonly string[]).includes(value);
}

export function isToggleableField(table: SortableTable, field: unknown): field is string {
  return typeof field === 'string' && TOGGLEABLE_FIELDS[table].includes(field);
}

export function isDeletableTable(table: SortableTable): boolean {
  return DELETABLE_TABLES.includes(table);
}
