import { useState, type KeyboardEvent } from 'react';
import { cn } from '../../lib/utils';

interface TagInputProps {
  name: string;
  label: string;
  value?: string[];
  placeholder?: string;
  id?: string;
}

/**
 * Input terkontrol untuk kumpulan tag (dipakai untuk `tech_stack` dan `gallery`).
 * Nilai dikirim lewat hidden input berisi JSON array string, supaya bisa
 * ikut form POST biasa tanpa JavaScript tambahan di server.
 */
export default function TagInput({ name, label, value, placeholder, id }: TagInputProps) {
  const [tags, setTags] = useState<string[]>(value ?? []);
  const [draft, setDraft] = useState('');
  const inputId = id ?? name;

  function addTag(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const exists = tags.some((tag) => tag.toLowerCase() === trimmed.toLowerCase());
    if (exists) return;
    setTags([...tags, trimmed]);
  }

  function removeTag(index: number) {
    setTags(tags.filter((_, i) => i !== index));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag(draft);
      setDraft('');
      return;
    }
    if (event.key === 'Backspace' && draft === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(tags)} />
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div
        className={cn(
          'flex w-full flex-wrap gap-2 rounded-md border border-border-strong bg-surface px-3 py-2',
          'focus-within:border-primary',
        )}
      >
        {tags.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="flex items-center gap-1.5 rounded-md border border-border-strong bg-background px-2 py-1 text-xs text-foreground"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              aria-label={`Hapus ${tag}`}
              className="inline-flex size-5 items-center justify-center text-muted outline-none hover:text-foreground focus-visible:text-foreground"
            >
              &times;
            </button>
          </span>
        ))}
        <input
          id={inputId}
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-w-[8rem] flex-1 bg-transparent py-1 text-base outline-none placeholder:text-muted sm:text-sm"
        />
      </div>
    </div>
  );
}
