import { Marked } from 'marked';

/**
 * Merender Markdown dari kolom database (`projects.content`).
 * Isi hanya bisa ditulis admin lewat /admin yang dijaga RLS, jadi tidak ada
 * sanitasi tambahan. Jangan pakai fungsi ini untuk input dari pengunjung.
 */
const marked = new Marked({ gfm: true, breaks: false });

export async function renderMarkdown(source: string | null | undefined): Promise<string> {
  if (!source) return '';
  return marked.parse(source);
}
