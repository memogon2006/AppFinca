import { useState, useEffect, useRef } from 'react';

export function useOnlineStatus(onReconnect = null) {
  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true;
  });

  const [wasOffline, setWasOffline] = useState(false);
  const onReconnectRef = useRef(onReconnect);
  onReconnectRef.current = onReconnect;

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (onReconnectRef.current) {
        onReconnectRef.current();
        // Reintentos automáticos escalonados para cuando el socket TCP/DNS esté 100% listo
        setTimeout(() => {
          if (onReconnectRef.current) onReconnectRef.current();
        }, 1500);
        setTimeout(() => {
          if (onReconnectRef.current) onReconnectRef.current();
        }, 4000);
      }
      setWasOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}
