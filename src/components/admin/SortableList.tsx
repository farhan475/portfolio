import { useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, EyeOff, GripVertical, Pencil, Trash } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SortableEntry {
  id: string;
  title: string;
  subtitle?: string | null;
  /** Link ke form edit. */
  href?: string | null;
  /** Nilai kolom boolean yang bisa di-toggle. */
  enabled?: boolean;
}

interface ToggleConfig {
  /** Nama kolom boolean, misal "is_visible" atau "is_published". */
  field: string;
  labelOn: string;
  labelOff: string;
}

/** Tinggi minimum dijaga supaya tetap nyaman disentuh di layar kecil. */
const actionClass =
  'inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border-strong px-2.5 py-1 text-xs whitespace-nowrap text-muted transition-colors hover:border-primary hover:text-foreground';

interface SortableListProps {
  items: SortableEntry[];
  /** Nama tabel, dikirim ke API admin. */
  table: string;
  toggle?: ToggleConfig;
  deletable?: boolean;
  emptyText?: string;
}

type Status = { kind: 'idle' } | { kind: 'busy' } | { kind: 'ok'; message: string } | { kind: 'error'; message: string };

async function postAdmin(endpoint: string, body: unknown): Promise<void> {
  const response = await fetch(`/api/admin/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(detail?.message ?? `Permintaan gagal (${response.status}).`);
  }
}

function Row({
  entry,
  toggle,
  deletable,
  onToggle,
  onDelete,
}: {
  entry: SortableEntry;
  toggle?: ToggleConfig;
  deletable?: boolean;
  onToggle: (id: string, next: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        // Di ponsel tombol aksi turun ke baris sendiri supaya judul tidak terjepit.
        'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-border bg-surface px-3 py-2.5',
        isDragging && 'border-primary opacity-80',
      )}
    >
      <button
        type="button"
        className="-ml-1 inline-flex size-9 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted hover:text-foreground"
        aria-label={`Ubah urutan ${entry.title}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} aria-hidden="true" />
      </button>

      <div className="min-w-0 flex-1 basis-40">
        <p className="truncate text-sm font-medium">{entry.title}</p>
        {entry.subtitle ? <p className="truncate text-xs text-muted">{entry.subtitle}</p> : null}
      </div>

      <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
        {toggle ? (
          <button
            type="button"
            onClick={() => onToggle(entry.id, !entry.enabled)}
            aria-pressed={entry.enabled ?? false}
            className={actionClass}
          >
            {entry.enabled ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
            {entry.enabled ? toggle.labelOn : toggle.labelOff}
          </button>
        ) : null}

        {entry.href ? (
          <a href={entry.href} className={actionClass}>
            <Pencil size={14} aria-hidden="true" />
            Edit
          </a>
        ) : null}

        {deletable ? (
          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            aria-label={`Hapus ${entry.title}`}
            className={cn(actionClass, 'hover:border-red-500 hover:text-red-400')}
          >
            <Trash size={14} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </li>
  );
}

export default function SortableList({
  items: initialItems,
  table,
  toggle,
  deletable = false,
  emptyText = 'Belum ada data.',
}: SortableListProps) {
  const [items, setItems] = useState(initialItems);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function persistOrder(ordered: SortableEntry[]) {
    setStatus({ kind: 'busy' });
    try {
      await postAdmin('reorder', { table, ids: ordered.map((item) => item.id) });
      setStatus({ kind: 'ok', message: 'Urutan tersimpan.' });
    } catch (cause) {
      setItems(initialItems);
      setStatus({ kind: 'error', message: cause instanceof Error ? cause.message : 'Gagal menyimpan urutan.' });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = items.findIndex((item) => item.id === active.id);
    const to = items.findIndex((item) => item.id === over.id);
    if (from === -1 || to === -1) return;

    const next = arrayMove(items, from, to);
    setItems(next);
    void persistOrder(next);
  }

  async function handleToggle(id: string, value: boolean) {
    if (!toggle) return;
    const previous = items;
    setItems(items.map((item) => (item.id === id ? { ...item, enabled: value } : item)));
    setStatus({ kind: 'busy' });
    try {
      await postAdmin('toggle', { table, id, field: toggle.field, value });
      setStatus({ kind: 'ok', message: 'Perubahan tersimpan.' });
    } catch (cause) {
      setItems(previous);
      setStatus({ kind: 'error', message: cause instanceof Error ? cause.message : 'Gagal menyimpan.' });
    }
  }

  async function handleDelete(id: string) {
    const entry = items.find((item) => item.id === id);
    if (!entry) return;
    if (!window.confirm(`Hapus "${entry.title}"? Tindakan ini tidak bisa dibatalkan.`)) return;

    const previous = items;
    setItems(items.filter((item) => item.id !== id));
    setStatus({ kind: 'busy' });
    try {
      await postAdmin('delete', { table, id });
      setStatus({ kind: 'ok', message: `"${entry.title}" dihapus.` });
    } catch (cause) {
      setItems(previous);
      setStatus({ kind: 'error', message: cause instanceof Error ? cause.message : 'Gagal menghapus.' });
    }
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted">{emptyText}</p>;
  }

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-2">
            {items.map((entry) => (
              <Row
                key={entry.id}
                entry={entry}
                toggle={toggle}
                deletable={deletable}
                onToggle={(id, next) => void handleToggle(id, next)}
                onDelete={(id) => void handleDelete(id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <p
        role="status"
        aria-live="polite"
        className={cn(
          'mt-3 text-xs',
          status.kind === 'error' ? 'text-red-400' : 'text-muted',
        )}
      >
        {status.kind === 'busy'
          ? 'Menyimpan…'
          : status.kind === 'ok' || status.kind === 'error'
            ? status.message
            : 'Seret ikon titik-titik untuk mengubah urutan. Urutan tersimpan otomatis.'}
      </p>
    </div>
  );
}
