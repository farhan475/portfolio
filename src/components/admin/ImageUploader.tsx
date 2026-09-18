import { useId, useRef, useState } from 'react';
import { useResettable } from './use-resettable';
import { Trash, Upload } from 'lucide-react';
import { createSupabaseBrowserClient } from '../../lib/supabase';
import { ALLOWED_UPLOAD_TYPES, ASSETS_BUCKET, MAX_UPLOAD_BYTES } from '../../lib/storage';
import { cn } from '../../lib/utils';

const BUCKET = ASSETS_BUCKET;
const MAX_BYTES = MAX_UPLOAD_BYTES;
const ALLOWED: readonly string[] = ALLOWED_UPLOAD_TYPES;

interface ImageUploaderProps {
  /** Nama field form. Nilainya adalah public URL hasil upload. */
  name: string;
  label: string;
  value?: string | null;
  /** Subfolder di dalam bucket, misal "projects". */
  folder?: string;
  hint?: string;
}

function extensionOf(file: File): string {
  const fromName = file.name.includes('.') ? file.name.split('.').pop() : undefined;
  if (fromName) return fromName.toLowerCase();
  return file.type === 'application/pdf' ? 'pdf' : 'bin';
}

export default function ImageUploader({ name, label, value, folder, hint }: ImageUploaderProps) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  // Bawaan sebuah aset adalah kosong, jadi reset ke bawaan berarti mengosongkannya.
  const [url, setUrl] = useResettable<string>(value ?? '', '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!ALLOWED.includes(file.type)) {
      setError(`Tipe file ${file.type || 'tidak dikenal'} tidak diizinkan.`);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`Ukuran file ${(file.size / 1024 / 1024).toFixed(2)} MB melebihi batas 2 MB.`);
      return;
    }

    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      // Nama file pakai UUID supaya tidak pernah menimpa aset lain.
      const path = [folder, `${crypto.randomUUID()}.${extensionOf(file)}`].filter(Boolean).join('/');

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        setError(`Gagal mengunggah: ${uploadError.message}`);
        return;
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setUrl(data.publicUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal mengunggah file.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const isPdf = url.toLowerCase().endsWith('.pdf');

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>

      <input type="hidden" name={name} value={url} />

      <div className="flex flex-wrap items-start gap-4">
        {url ? (
          <div className="shrink-0">
            {isPdf ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-24 items-center justify-center rounded-md border border-border-strong bg-surface text-xs text-muted"
              >
                Lihat PDF
              </a>
            ) : (
              <img
                src={url}
                alt="Pratinjau berkas yang diunggah"
                width={96}
                height={96}
                loading="lazy"
                className="size-24 rounded-md border border-border object-cover"
              />
            )}
          </div>
        ) : null}

        <div className="flex-1">
          <input
            id={inputId}
            ref={fileRef}
            type="file"
            accept={ALLOWED.join(',')}
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
            className={cn(
              'block w-full text-sm text-muted',
              'file:mr-3 file:rounded-md file:border file:border-border-strong file:bg-surface',
              'file:px-3 file:py-2 file:text-sm file:text-foreground hover:file:border-primary',
            )}
          />

          <p className="mt-1.5 text-xs text-muted">
            {hint ?? 'JPEG, PNG, WebP, AVIF, SVG, atau PDF. Maksimal 2 MB.'}
          </p>

          {busy ? (
            <p role="status" className="mt-2 flex items-center gap-1.5 text-xs text-muted">
              <Upload size={14} aria-hidden="true" />
              Mengunggah…
            </p>
          ) : null}

          {error ? (
            <p role="alert" className="mt-2 text-xs text-red-400">
              {error}
            </p>
          ) : null}

          {url ? (
            <div className="mt-3 flex items-center gap-2">
              <input
                readOnly
                value={url}
                aria-label={`URL ${label}`}
                className="w-full min-w-0 rounded-md border border-border-strong bg-surface px-2 py-1 text-xs text-muted"
              />
              <button
                type="button"
                onClick={() => setUrl('')}
                aria-label={`Hapus ${label}`}
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border-strong px-2 py-1 text-xs text-muted hover:border-primary hover:text-foreground"
              >
                <Trash size={14} aria-hidden="true" />
                Hapus
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
