import { useState, useCallback } from 'react';
import {
  initOpenWearables,
  syncNow,
  isInitialized,
} from '../services/openWearables';
import { toast } from '@/store';

export function useOpenWearables() {
  const [connected, setConnected] = useState(isInitialized());
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(false);

  const connect = useCallback(async () => {
    setLoading(true);
    try {
      await initOpenWearables();
      setConnected(true);
      toast.success('Wearable conectado');
    } catch (err) {
      console.warn('[OpenWearables] connect failed:', err);
      toast.error('No se pudo conectar el wearable');
    } finally {
      setLoading(false);
    }
  }, []);

  const forceSync = useCallback(async () => {
    setSyncing(true);
    try {
      await syncNow();
      toast.success('Sincronización completada');
    } catch (err) {
      console.warn('[OpenWearables] sync failed:', err);
      toast.error('Error al sincronizar');
    } finally {
      setSyncing(false);
    }
  }, []);

  return { connected, syncing, loading, connect, forceSync };
}
