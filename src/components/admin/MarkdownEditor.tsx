import { useEffect, useState } from 'react';
import { inputClass } from '../../lib/ui';
import { cn } from '../../lib/utils';
import { renderMarkdown } from '../../lib/markdown';

interface MarkdownEditorProps {
  name: string;
  label: string;
  value?: string;
  rows?: number;
  id?: string;
}

type Tab = 'tulis' | 'pratinjau';

/** Textarea + pratinjau untuk kolom Markdown (`projects.content`). */
export default function MarkdownEditor({ name, label, value, rows = 14, id }: MarkdownEditorProps) {
  const [text, setText] = useState(value ?? '');
  const [tab, setTab] = useState<Tab>('tulis');
  const [html, setHtml] = useState('');
  const textareaId = id ?? name;

  useEffect(() => {
    if (tab !== 'pratinjau') return;

    let cancelled = false;
    void renderMarkdown(text).then((result) => {
      if (!cancelled) setHtml(result);
    });

    return () => {
      cancelled = true;
    };
  }, [tab, text]);

  return (
    <div>
      <label htmlFor={textareaId} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>

      <div role="tablist" className="mb-2 flex flex-wrap gap-2">
        <button
          type="button"
          role="tab"
          aria-pressed={tab === 'tulis'}
          aria-selected={tab === 'tulis'}
          onClick={() => setTab('tulis')}
          className={cn(
            'rounded-md border border-border-strong px-3 py-1.5 text-sm outline-none',
            tab === 'tulis' ? 'border-primary text-foreground' : 'text-muted hover:text-foreground',
          )}
        >
          Tulis
        </button>
        <button
          type="button"
          role="tab"
          aria-pressed={tab === 'pratinjau'}
          aria-selected={tab === 'pratinjau'}
          onClick={() => setTab('pratinjau')}
          className={cn(
            'rounded-md border border-border-strong px-3 py-1.5 text-sm outline-none',
            tab === 'pratinjau' ? 'border-primary text-foreground' : 'text-muted hover:text-foreground',
          )}
        >
          Pratinjau
        </button>
      </div>

      {/* Tinggi dibatasi terhadap layar supaya textarea tidak memanjang di ponsel. */}
      <textarea
        id={textareaId}
        name={name}
        rows={rows}
        value={text}
        onChange={(event) => setText(event.target.value)}
        hidden={tab !== 'tulis'}
        className={cn(inputClass, 'max-h-[60vh] font-mono')}
      />
      {tab === 'tulis' && <p className="mt-1.5 text-xs text-muted">{text.length} karakter</p>}

      {tab === 'pratinjau' && (
        <div className="overflow-x-auto rounded-md border border-border bg-surface px-3 py-2">
          <div className="prose-db" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      )}
    </div>
  );
}
