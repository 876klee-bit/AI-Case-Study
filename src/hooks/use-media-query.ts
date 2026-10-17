'use client';

import { useEffect, useState } from 'react';

export function useMediaQuery(query: string, initial = false): boolean {
  const [matches, setMatches] = useState(initial);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);
  return matches;
}

/** Desktop layout (resizable split) from 1024px up. */
export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)', true);
}

/** True after the first client render. Gates UI that depends on persisted local state. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
