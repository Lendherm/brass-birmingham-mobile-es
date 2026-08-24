import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { registerSW } from 'virtual:pwa-register';

/** Aviso de nueva versión (PWA en PC/navegador). No se muestra en el APK Android. */
export function PwaUpdateBanner() {
  const [visible, setVisible] = useState(false);
  const reloadRef = useRef<((reloadPage?: boolean) => Promise<void>) | undefined>();

  useEffect(() => {
    if (Capacitor.isNativePlatform() || !('serviceWorker' in navigator)) return;

    reloadRef.current = registerSW({
      immediate: true,
      onNeedRefresh() {
        setVisible(true);
      },
    });
  }, []);

  if (!visible) return null;

  return (
    <div className="pwa-update-banner" role="status" data-testid="pwa-update-banner">
      <span>Hay una nueva versión disponible.</span>
      <button
        type="button"
        className="primary"
        onClick={() => void reloadRef.current?.(true)}
        data-testid="pwa-update-apply"
      >
        Actualizar ahora
      </button>
      <button type="button" onClick={() => setVisible(false)} data-testid="pwa-update-dismiss">
        Después
      </button>
    </div>
  );
}
