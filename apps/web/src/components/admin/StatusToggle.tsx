'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  loading?: boolean;
  disabled?: boolean;
  /** Optional aria-label override; defaults to the Indonesian status name. */
  'aria-label'?: string;
}

export function StatusToggle({
  checked,
  onChange,
  loading = false,
  disabled = false,
  'aria-label': ariaLabel,
}: StatusToggleProps) {
  const label = ariaLabel ?? (checked ? 'Aktif' : 'Nonaktif');

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled || loading}
      onClick={(e) => {
        e.stopPropagation();
        if (!loading && !disabled) onChange(!checked);
      }}
      className={cn(
        'relative inline-flex h-[19px] w-[34px] shrink-0 items-center rounded-[10px] transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        checked ? 'bg-primary' : 'bg-[#d1d5db]'
      )}
    >
      <span
        className={cn(
          'absolute top-[2.5px] inline-block h-[14px] w-[14px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-[left]',
          checked ? 'left-[18px]' : 'left-[2.5px]'
        )}
        aria-hidden
      >
        {loading && <Loader2 className="h-[14px] w-[14px] animate-spin text-muted-foreground" />}
      </span>
    </button>
  );
}
