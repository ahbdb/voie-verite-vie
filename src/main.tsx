import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { logger } from '@/lib/logger'

// Expose SW update callback globally so React component can trigger reload
declare global {
  interface Window {
    __pwaUpdateSW?: (reloadPage?: boolean) => Promise<void>;
    __pwaUpdateAvailable?: boolean;
    __pwaUpdateListeners?: Set<() => void>;
  }
}

window.__pwaUpdateListeners = new Set();

if (import.meta.env.PROD) {
  const registerPWA = async () => {
    try {
      const { registerSW } = await (Function('return import("virtual:pwa-register")')() as Promise<any>);
      const updateSW = registerSW({
        onNeedRefresh() {
          logger.info('Nouvelle version disponible');
          window.__pwaUpdateAvailable = true;
          window.__pwaUpdateSW = updateSW;
          // Notify all listeners
          window.__pwaUpdateListeners?.forEach((fn) => fn());
        },
        onOfflineReady() {
          logger.info('App prête pour utilisation hors-ligne');
        },
        onRegisteredSW(swUrl: string) {
          logger.info('Service Worker enregistré', { swUrl });
          // Check for updates every 60 minutes
          setInterval(() => {
            fetch(swUrl, { cache: 'no-store' }).catch(() => {});
          }, 60 * 60 * 1000);
        },
        onRegisterError(error: Error) {
          logger.error("Erreur d'enregistrement du SW", {}, error instanceof Error ? error : new Error(String(error)));
        },
      });
    } catch (error) {
      logger.warn('PWA non disponible');
    }
  };
  registerPWA();
}

createRoot(document.getElementById("root")!).render(<App />);
