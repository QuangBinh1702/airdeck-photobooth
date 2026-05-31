import { useEffect, useState } from 'react';

/**
 * Subscribe to a CSS media query and return whether it currently matches.
 *
 * The initial value is read synchronously from `window.matchMedia` so the very
 * first render is already correct (no layout flash). Guarded for environments
 * without `matchMedia` (e.g. SSR / some test runners), where it returns false.
 *
 * @example
 * const isDesktop = useMediaQuery('(min-width: 1024px)'); // Tailwind `lg`
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
