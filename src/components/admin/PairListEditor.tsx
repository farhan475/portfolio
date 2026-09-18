import { useId } from 'react';
import { useResettable } from './use-resettable';
import { ArrowDown, ArrowUp, Plus, Trash } from 'lucide-react';
import { inputClass } from '../../lib/ui';
import { cn } from '../../lib/utils';

export type PairRow = Record<string, string>;

interface PairListEditorProps {
  /** Dikirim sebagai hidden input berisi JSON.stringify(rows). */
  name: string;
  label: string;
  /** Tepat dua kolom, misal label+href untuk menu atau label+value untuk highlight. */
  fields: readonly [{ key: string; label: string }, { key: string; label: string }];
  value?: PairRow[];
  addLabel?: string;
  emptyText?: string;
}

export default function PairListEditor({
  name,
  label,
  fields,
  value,
  addLabel = 'Tambah baris',
  emptyText = 'Belum ada data.',
}: PairListEditorProps) {
  const baseId = useId();
  const [rows, setRows] = useResettable<PairRow[]>(value ?? [], []);

  function update(index: number, key: string, next: string) {
    setRows(rows.map((row, i) => (i === index ? { ...row, [key]: next } : row)));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    const [moved] = next.splice(index, 1);
    if (moved) next.splice(target, 0, moved);
    setRows(next);
  }

  function describe(row: PairRow): string {
    return row[fields[0].key] || 'baris';
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input type="hidden" name={name} value={JSON.stringify(rows)} />

      {rows.length === 0 ? (
        <p className="text-sm text-muted">{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row, index) => (
            <li
              key={`${baseId}-${index}`}
              className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:flex-wrap sm:items-end sm:border-0 sm:p-0"
            >
              {fields.map((field) => (
                <div key={field.key} className="min-w-0 sm:min-w-[9rem] sm:flex-1">
                  <label htmlFor={`${baseId}-${field.key}-${index}`} className="mb-1 block text-xs text-muted">
                    {field.label}
                  </label>
                  <input
                    id={`${baseId}-${field.key}-${index}`}
                    type="text"
                    value={row[field.key] ?? ''}
                    onChange={(event) => update(index, field.key, event.target.value)}
                    className={inputClass}
                  />
                </div>
              ))}

              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Naikkan ${describe(row)}`}
                  className={cn(
                    'inline-flex size-9 items-center justify-center rounded-md border border-border-strong text-muted',
                    index === 0 ? 'opacity-40' : 'hover:border-primary hover:text-foreground',
                  )}
                >
                  <ArrowUp size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === rows.length - 1}
                  aria-label={`Turunkan ${describe(row)}`}
                  className={cn(
                    'inline-flex size-9 items-center justify-center rounded-md border border-border-strong text-muted',
                    index === rows.length - 1 ? 'opacity-40' : 'hover:border-primary hover:text-foreground',
                  )}
                >
                  <ArrowDown size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setRows(rows.filter((_, i) => i !== index))}
                  aria-label={`Hapus ${describe(row)}`}
                  className="inline-flex size-9 items-center justify-center rounded-md border border-border-strong text-muted hover:border-red-500 hover:text-red-400"
                >
                  <Trash size={14} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setRows([...rows, { [fields[0].key]: '', [fields[1].key]: '' }])}
        className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border-strong px-3 py-1.5 text-sm text-muted hover:border-primary hover:text-foreground"
      >
        <Plus size={14} aria-hidden="true" />
        {addLabel}
      </button>
    </div>
  );
}
