import { useState, useEffect, useCallback } from 'react';
import { getPendingSyncCount, getLastSyncedAt } from '../services/cloudSync';

export function useSyncStatus(userId, isSyncing = false) {
  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true;
  });

  const [pendingCount, setPendingCount] = useState(() => {
    return userId ? getPendingSyncCount(userId) : 0;
  });

  const [lastSyncedAt, setLastSyncedAt] = useState(() => {
    return userId ? getLastSyncedAt(userId) : null;
  });

  const refreshStatus = useCallback(() => {
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }
    if (userId) {
      setPendingCount(getPendingSyncCount(userId));
      setLastSyncedAt(getLastSyncedAt(userId));
    }
  }, [userId]);

  useEffect(() => {
    refreshStatus();

    const handleOnline = () => {
      setIsOnline(true);
      refreshStatus();
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshStatus();
    };

    const handlePendingChanged = (e) => {
      if (!userId || !e.detail || e.detail.userId === userId) {
        setPendingCount(userId ? getPendingSyncCount(userId) : 0);
      }
    };

    const handleLastSyncedChanged = (e) => {
      if (!userId || !e.detail || e.detail.userId === userId) {
        setLastSyncedAt(userId ? getLastSyncedAt(userId) : null);
      }
    };

    const handleStorage = (e) => {
      if (e.key && (e.key.includes('pending') || e.key.includes('last_synced'))) {
        refreshStatus();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('ganado_pending_sync_changed', handlePendingChanged);
    window.addEventListener('ganado_last_synced_changed', handleLastSyncedChanged);
    window.addEventListener('storage', handleStorage);

    // Verificación periódica cada 4 segundos por seguridad en campo
    const interval = setInterval(refreshStatus, 4000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('ganado_pending_sync_changed', handlePendingChanged);
      window.removeEventListener('ganado_last_synced_changed', handleLastSyncedChanged);
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [userId, refreshStatus]);

  // Determinar estado semántico
  let status = 'synced';
  if (isSyncing) {
    status = 'syncing';
  } else if (!isOnline) {
    status = 'offline';
  } else if (pendingCount > 0) {
    status = 'pending';
  } else {
    status = 'synced';
  }

  return {
    isOnline,
    pendingCount,
    lastSyncedAt,
    status,
    refreshStatus
  };
}
