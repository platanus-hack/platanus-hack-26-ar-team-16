import { useState, useCallback } from 'react';
import {
  initOpenWearables,
  syncNow,
  isInitialized,
} from '../services/openWearables';

export function useOpenWearables() {
  const [connected, setConnected] = useState(isInitialized());
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(false);

  const connect = useCallback(async () => {
    setLoading(true);
    try {
      await initOpenWearables();
      setConnected(true);
    } catch (err) {
      console.warn('[OpenWearables] connect failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const forceSync = useCallback(async () => {
    setSyncing(true);
    try {
      await syncNow();
    } catch (err) {
      console.warn('[OpenWearables] sync failed:', err);
    } finally {
      setSyncing(false);
    }
  }, []);

  return { connected, syncing, loading, connect, forceSync };
}
