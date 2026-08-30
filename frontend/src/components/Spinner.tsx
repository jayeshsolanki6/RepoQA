const SIZES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-5 w-5 border-2',
  lg: 'h-8 w-8 border-[3px]',
} as const;

/**
 * Inherits the surrounding text colour, so it stays visible on both the dark
 * surfaces and the lime primary button (where a lime spinner disappeared).
 */
export function Spinner({ size = 'md' }: { size?: keyof typeof SIZES }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`${SIZES[size]} inline-block shrink-0 animate-spin rounded-full border-current/25 border-t-current`}
    />
  );
}
