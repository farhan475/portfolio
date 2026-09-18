import type { APIRoute } from 'astro';
import { isSortableTable, isToggleableField } from '../../../lib/admin-tables';

interface ToggleBody {
  table?: unknown;
  id?: unknown;
  field?: unknown;
  value?: unknown;
}

export const POST: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  if (!supabase) {
    return Response.json({ message: 'Supabase belum dikonfigurasi.' }, { status: 500 });
  }

  const body = (await context.request.json().catch(() => null)) as ToggleBody | null;
  if (!body || !isSortableTable(body.table)) {
    return Response.json({ message: 'Tabel tidak dikenal.' }, { status: 400 });
  }

  const table = body.table;
  if (!isToggleableField(table, body.field)) {
    return Response.json({ message: 'Kolom tidak boleh diubah lewat endpoint ini.' }, { status: 400 });
  }
  if (typeof body.id !== 'string' || typeof body.value !== 'boolean') {
    return Response.json({ message: 'id atau value tidak valid.' }, { status: 400 });
  }

  // Nama kolom dinamis tidak bisa dicocokkan ke tipe Update gabungan dari semua
  // tabel. Aman karena field sudah lolos daftar putih isToggleableField().
  const patch = { [body.field]: body.value } as never;

  const { error } = await supabase.from(table).update(patch).eq('id', body.id);

  if (error) {
    return Response.json({ message: `Gagal menyimpan: ${error.message}` }, { status: 400 });
  }

  return Response.json({ ok: true });
};
