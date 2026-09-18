import { useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Trash, Upload } from 'lucide-react';
import { createSupabaseBrowserClient } from '../../lib/supabase';
import { ALLOWED_UPLOAD_TYPES, ASSETS_BUCKET, MAX_UPLOAD_BYTES } from '../../lib/storage';
import { cn } from '../../lib/utils';

interface GalleryUploaderProps {
  /** Dikirim sebagai hidden input berisi JSON.stringify(urls). */
  name: string;
  label: string;
  value?: string[];
  folder?: string;
  hint?: string;
}

function extensionOf(file: File): string {
  const fromName = file.name.includes('.') ? file.name.split('.').pop() : undefined;
  return fromName ? fromName.toLowerCase() : 'bin';
}

export default function GalleryUploader({ name, label, value, folder, hint }: GalleryUploaderProps) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [urls, setUrls] = useState<string[]>(value ?? []);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  async function handleFiles(files: FileList) {
    const list = [...files];
    if (list.length === 0) return;

    setErrors([]);
    setBusy(true);
    setProgress({ done: 0, total: list.length });

    const uploaded: string[] = [];
    const failed: string[] = [];
    const supabase = createSupabaseBrowserClient();

    for (const [index, file] of list.entries()) {
      if (!(ALLOWED_UPLOAD_TYPES as readonly string[]).includes(file.type)) {
        failed.push(`${file.name}: tipe ${file.type || 'tidak dikenal'} tidak diizinkan.`);
      } else if (file.size > MAX_UPLOAD_BYTES) {
        failed.push(`${file.name}: ${(file.size / 1024 / 1024).toFixed(2)} MB, melebihi batas 2 MB.`);
      } else {
        const path = [folder, `${crypto.randomUUID()}.${extensionOf(file)}`].filter(Boolean).join('/');
        const { error } = await supabase.storage
          .from(ASSETS_BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false });

        if (error) {
          failed.push(`${file.name}: ${error.message}`);
        } else {
          uploaded.push(supabase.storage.from(ASSETS_BUCKET).getPublicUrl(path).data.publicUrl);
        }
      }

      setProgress({ done: index + 1, total: list.length });
    }

    setUrls((current) => [...current, ...uploaded]);
    setErrors(failed);
    setBusy(false);
    setProgress(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= urls.length) return;
    const next = [...urls];
    const [moved] = next.splice(index, 1);
    if (moved) next.splice(target, 0, moved);
    setUrls(next);
  }

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>

      <input type="hidden" name={name} value={JSON.stringify(urls)} />

      <input
        id={inputId}
        ref={fileRef}
        type="file"
        multiple
        accept={ALLOWED_UPLOAD_TYPES.join(',')}
        disabled={busy}
        onChange={(event) => {
          if (event.target.files) void handleFiles(event.target.files);
        }}
        className={cn(
          'block w-full text-sm text-muted',
          'file:mr-3 file:rounded-md file:border file:border-border-strong file:bg-surface',
          'file:px-3 file:py-2 file:text-sm file:text-foreground hover:file:border-primary',
        )}
      />

      <p className="mt-1.5 text-xs text-muted">
        {hint ?? 'Bisa pilih beberapa gambar sekaligus. Maksimal 2 MB per gambar.'}
      </p>

      {busy && progress ? (
        <p role="status" className="mt-2 flex items-center gap-1.5 text-xs text-muted">
          <Upload size={14} aria-hidden="true" />
          Mengunggah {progress.done} dari {progress.total}…
        </p>
      ) : null}

      {errors.length > 0 ? (
        <ul role="alert" className="mt-2 flex flex-col gap-1">
          {errors.map((message) => (
            <li key={message} className="text-xs text-red-400">
              {message}
            </li>
          ))}
        </ul>
      ) : null}

      {urls.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Belum ada gambar di galeri.</p>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {urls.map((url, index) => (
            <li key={url} className="rounded-md border border-border bg-surface p-2">
              <img
                src={url}
                alt={`Gambar galeri ${index + 1}`}
                width={200}
                height={125}
                loading="lazy"
                className="aspect-[8/5] w-full rounded object-cover"
              />
              <div className="mt-2 flex items-center justify-between gap-1">
                <span className="text-xs text-muted">{index + 1}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Geser gambar ${index + 1} ke kiri`}
                    className={cn(
                      'inline-flex size-8 items-center justify-center rounded border border-border-strong text-muted sm:size-7',
                      index === 0 ? 'opacity-40' : 'hover:border-primary hover:text-foreground',
                    )}
                  >
                    <ArrowLeft size={12} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === urls.length - 1}
                    aria-label={`Geser gambar ${index + 1} ke kanan`}
                    className={cn(
                      'inline-flex size-8 items-center justify-center rounded border border-border-strong text-muted sm:size-7',
                      index === urls.length - 1 ? 'opacity-40' : 'hover:border-primary hover:text-foreground',
                    )}
                  >
                    <ArrowRight size={12} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrls(urls.filter((_, i) => i !== index))}
                    aria-label={`Hapus gambar ${index + 1} dari galeri`}
                    className="inline-flex size-8 items-center justify-center rounded border border-border-strong text-muted hover:border-red-500 hover:text-red-400 sm:size-7"
                  >
                    <Trash size={12} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
