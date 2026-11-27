import { useCallback, useEffect, useState } from 'react';
import { toDisplayError } from './validation';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseApiResult<T> extends ApiState<T> {
  reload: () => void;
}

export function useApi<T>(fetcher: () => Promise<T>, deps: ReadonlyArray<unknown>): UseApiResult<T> {
  const [state, setState] = useState<ApiState<T>>({ data: null, loading: true, error: null });
  const [nonce, setNonce] = useState(0);

  const run = useCallback(fetcher, deps);

  useEffect(() => {
    let active = true;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    run()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (active) {
          setState({ data: null, loading: false, error: toDisplayError(error).message });
        }
      });
    return () => {
      active = false;
    };
  }, [run, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { ...state, reload };
}
