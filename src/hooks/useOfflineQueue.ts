import { useCallback, useEffect, useState } from 'react';
import { RoadIncident } from '../types.ts';

const QUEUE_STORAGE_KEY = 'radar_rural_offline_queue_v1';

export function useOfflineQueue(
  isOnline: boolean,
  onSynced?: (syncedItems: RoadIncident[]) => void
) {
  const [queuedIncidents, setQueuedIncidents] = useState<RoadIncident[]>(() => {
    try {
      const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as RoadIncident[]) : [];
    } catch {
      return [];
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queuedIncidents));
    } catch {
      // Ignore quota errors cleanly
    }
  }, [queuedIncidents]);

  const enqueueIncident = useCallback((incident: RoadIncident) => {
    const pendingItem: RoadIncident = { ...incident, isOfflinePending: true };
    setQueuedIncidents((prev) => [pendingItem, ...prev]);
    return pendingItem;
  }, []);

  const syncNow = useCallback(async () => {
    if (!isOnline || queuedIncidents.length === 0 || isSyncing) return 0;
    setIsSyncing(true);
    try {
      const response = await fetch('/api/incidents/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: queuedIncidents }),
      });
      if (!response.ok) return 0;
      const data = (await response.json()) as { syncedCount: number; synced: RoadIncident[] };
      setQueuedIncidents([]);
      if (onSynced && data.synced) {
        onSynced(data.synced);
      }
      return data.syncedCount;
    } catch {
      return 0;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, onSynced, queuedIncidents]);

  useEffect(() => {
    if (isOnline && queuedIncidents.length > 0) {
      void syncNow();
    }
  }, [isOnline, queuedIncidents.length, syncNow]);

  return {
    queuedIncidents,
    isSyncing,
    enqueueIncident,
    syncNow,
  };
}
