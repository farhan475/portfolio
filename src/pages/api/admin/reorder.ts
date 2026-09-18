import type { APIRoute } from 'astro';
import { isSortableTable } from '../../../lib/admin-tables';

interface ReorderBody {
  table?: unknown;
  ids?: unknown;
}

export const POST: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  if (!supabase) {
    return Response.json({ message: 'Supabase belum dikonfigurasi.' }, { status: 500 });
  }

  const body = (await context.request.json().catch(() => null)) as ReorderBody | null;
  if (!body || !isSortableTable(body.table)) {
    return Response.json({ message: 'Tabel tidak dikenal.' }, { status: 400 });
  }

  const ids = body.ids;
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string')) {
    return Response.json({ message: 'Daftar id tidak valid.' }, { status: 400 });
  }

  const table = body.table;
  const results = await Promise.all(
    (ids as string[]).map((id, index) =>
      supabase
        .from(table)
        .update({ sort_order: index + 1 })
        .eq('id', id),
    ),
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) {
    return Response.json({ message: `Gagal menyimpan urutan: ${failed.error.message}` }, { status: 400 });
  }

  return Response.json({ ok: true });
};
