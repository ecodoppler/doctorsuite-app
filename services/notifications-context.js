import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { api } from './api';

// Context único pra badge de notificações in-app.
// Refetch unread count: no startup, em foreground (AppState), e via .reload() manual.
const NotificationsContext = createContext({
  unreadCount: 0,
  reload: () => {},
  list: null,
  loadList: () => {},
});

export function NotificationsProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [list, setList] = useState(null);
  const appState = useRef(AppState.currentState);

  const reload = useCallback(async () => {
    try {
      const r = await api('/api/my-notifications/unread-count');
      setUnreadCount(Number(r?.count || 0));
    } catch {}
  }, []);

  const loadList = useCallback(async () => {
    try {
      const r = await api('/api/my-notifications');
      setList(Array.isArray(r) ? r : []);
    } catch (e) {
      setList([]);
    }
  }, []);

  useEffect(() => {
    reload();
    const sub = AppState.addEventListener('change', (next) => {
      // Quando o app volta pro foreground, refaz a contagem
      if (appState.current.match(/inactive|background/) && next === 'active') {
        reload();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [reload]);

  return (
    <NotificationsContext.Provider value={{ unreadCount, reload, list, loadList, setList, setUnreadCount }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
