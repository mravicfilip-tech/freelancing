import { useId, useState, type ReactNode } from 'react';
import { CheckCircle, ImageSquare, WarningCircle } from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/cn';
import { AVATAR_MAX_BYTES, AVATAR_MAX_PX } from './data';
import { formatUsd } from '../../lib/format';

// Parts the account page needs that components/ui does not have yet. The main thread can lift
// LimitSlider, FileDrop and SaveBar into components/ui.

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/** The Save changes button with its result beside it. A result carries an icon and a sentence. */
export function SaveBar({ status, onSave, disabled, errorNext }: { status: SaveStatus; onSave: () => void; disabled?: boolean; errorNext?: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Button onClick={onSave} loading={status === 'saving'} disabled={disabled}>
          Save changes
        </Button>
        {status === 'saved' && (
          <p role="status" className="flex items-center gap-2 text-14 font-medium text-success">
            <CheckCircle weight="bold" className="h-5 w-5 shrink-0" aria-hidden />
            Saved. Your changes are live.
          </p>
        )}
      </div>
      {status === 'error' && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-danger bg-sunken p-4 text-14">
          <WarningCircle weight="bold" className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden />
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-ink">We could not save your changes.</p>
            <p className="text-ink2">{errorNext ?? 'Check your connection and select Save changes again. If it keeps failing, contact support.'}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/** A limit slider on a native range input, so the keyboard and screen readers work as they should. */
export function LimitSlider({
  label,
  value,
  min = 0,
  max,
  step,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  min?: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-14 font-medium text-ink2">
          {label}
        </label>
        <output htmlFor={id} className="num text-16 font-semibold text-ink">
          {formatUsd(value).replace('.00', '')}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-valuetext={`${formatUsd(value).replace('.00', '')}`}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8 w-full cursor-pointer accent-accent disabled:cursor-not-allowed disabled:opacity-50"
      />
      <div className="num flex justify-between text-14 text-ink3" aria-hidden>
        <span>{formatUsd(min).replace('.00', '')}</span>
        <span>{formatUsd(max).replace('.00', '')}</span>
      </div>
    </div>
  );
}

/** A dashed drop area for the profile picture. Checks size and pixels before it accepts a file. */
export function FileDrop({ hint, children, disabled }: { hint: ReactNode; children?: ReactNode; disabled?: boolean }) {
  const id = useId();
  const [name, setName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  const check = (file: File | undefined) => {
    if (!file) return;
    setName(null);
    if (!file.type.startsWith('image/')) {
      setError('That file is not an image. Choose a PNG, JPG or WebP.');
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setError(`That image is ${Math.round(file.size / 1024)} KB. Choose one under 500 KB.`);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width > AVATAR_MAX_PX || img.height > AVATAR_MAX_PX) {
        setError(`That image is ${img.width} by ${img.height} px. Choose one up to ${AVATAR_MAX_PX} by ${AVATAR_MAX_PX} px.`);
      } else {
        setError(null);
        setName(file.name);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError('We could not read that image. Try a different file.');
    };
    img.src = url;
  };

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (!disabled) check(e.dataTransfer.files[0]);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors focus-within:border-accent hover:bg-raised',
          over ? 'border-accent bg-raised' : error ? 'border-danger bg-sunken' : 'border-field bg-sunken',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <ImageSquare className="h-8 w-8 text-ink2" aria-hidden />
        <span className="text-16 font-semibold text-ink">{name ? `Selected ${name}` : 'Upload profile picture'}</span>
        <span className="text-14 text-ink2">{hint}</span>
        {children}
        <input id={id} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={disabled} onChange={(e) => check(e.target.files?.[0])} />
      </label>
      {error && (
        <p role="alert" className="flex items-start gap-2 text-14 text-danger">
          <WarningCircle weight="bold" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
