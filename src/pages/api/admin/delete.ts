import type { APIRoute } from 'astro';
import { isDeletableTable, isSortableTable, type SortableTable } from '../../../lib/admin-tables';
import { projectAssetUrls, removeOrphanAssets } from '../../../lib/storage';
import type { TypedSupabaseClient } from '../../../lib/supabase';

interface DeleteBody {
  table?: unknown;
  id?: unknown;
}

/** Membaca image_url dari content section, kalau typenya memang punya gambar. */
function imageUrlOf(content: unknown): string | null {
  if (typeof content !== 'object' || content === null || !('image_url' in content)) return null;
  const value = (content as { image_url?: unknown }).image_url;
  return typeof value === 'string' ? value : null;
}

/**
 * Mengumpulkan URL aset milik baris SEBELUM dihapus, supaya berkasnya bisa
 * ikut dibersihkan dan tidak menumpuk di bucket.
 */
async function collectAssets(
  supabase: TypedSupabaseClient,
  table: SortableTable,
  id: string,
): Promise<(string | null | undefined)[]> {
  if (table === 'projects') {
    const { data } = await supabase
      .from('projects')
      .select('image_url, gallery')
      .eq('id', id)
      .maybeSingle();
    return data ? projectAssetUrls(data) : [];
  }

  if (table === 'sections') {
    const { data } = await supabase.from('sections').select('content').eq('id', id).maybeSingle();
    return data ? [imageUrlOf(data.content)] : [];
  }

  return [];
}

export const POST: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  if (!supabase) {
    return Response.json({ message: 'Supabase belum dikonfigurasi.' }, { status: 500 });
  }

  const body = (await context.request.json().catch(() => null)) as DeleteBody | null;
  if (!body || !isSortableTable(body.table) || !isDeletableTable(body.table)) {
    return Response.json({ message: 'Tabel ini tidak boleh dihapus lewat endpoint ini.' }, { status: 400 });
  }
  if (typeof body.id !== 'string') {
    return Response.json({ message: 'id tidak valid.' }, { status: 400 });
  }

  const assets = await collectAssets(supabase, body.table, body.id);

  const { error } = await supabase.from(body.table).delete().eq('id', body.id);
  if (error) {
    return Response.json({ message: `Gagal menghapus: ${error.message}` }, { status: 400 });
  }

  // Barisnya sudah hilang, jadi tidak ada lagi yang memakai berkas ini.
  await removeOrphanAssets(supabase, assets, []);

  return Response.json({ ok: true });
};
