/** Shared form styling matching DevLeaderboard design system. */

export const fieldClass = 'flex flex-col gap-1.5';

export const labelClass = 'text-sm font-medium text-ink';

export const inputClass =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink ' +
  'placeholder:text-ink-faint focus:border-accent-500 focus:outline-none focus:ring-2 ' +
  'focus:ring-accent-500/25 disabled:cursor-not-allowed disabled:bg-overlay disabled:opacity-60';

export const textareaClass = `${inputClass} min-h-32 resize-y`;

export const selectClass = `${inputClass} cursor-pointer`;

export const errorClass = 'text-xs font-medium text-danger';

export const hintClass = 'text-xs leading-relaxed text-ink-faint';
