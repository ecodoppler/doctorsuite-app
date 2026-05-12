import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api';

// Context único pra estado da gestação. Compartilhado entre _layout (decide tabs)
// e inicio.js (renderiza o hub/cartão). Evita 2 fetches em paralelo no startup.
const PregnancyContext = createContext({
  data: null,
  loading: true,
  error: null,
  reload: () => {},
});

export function PregnancyProvider({ children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const d = await api('/api/my-pregnancy');
      setData(d || null);
    } catch (e) {
      setError(e?.message || 'Falha ao carregar');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return (
    <PregnancyContext.Provider value={{ data, loading, error, reload }}>
      {children}
    </PregnancyContext.Provider>
  );
}

export function usePregnancy() {
  return useContext(PregnancyContext);
}
