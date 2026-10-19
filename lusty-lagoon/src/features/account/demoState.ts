import { useMemo } from 'react';

// ?state= reaches the loading, error, saved, empty and large states for the shots.
export function useDemoState() {
  return useMemo(() => new URLSearchParams(window.location.search).get('state'), []);
}
