import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { logger } from '@/lib/logger'

// PWA registration only in production  
if (import.meta.env.PROD) {
  const registerPWA = async () => {
    try {
      // Dynamic import to avoid static analysis errors
      const { registerSW } = await (Function('return import("virtual:pwa-register")')() as Promise<any>);
      registerSW({
        immediate: true,
        onRegisteredSW(swUrl: string) {
          logger.info('Service Worker (PWA) enregistré', { swUrl });
        },
        onRegisterError(error: Error) {
          logger.error(
            "Erreur d'enregistrement du Service Worker (PWA)",
            {},
            error instanceof Error ? error : new Error(String(error))
          );
        },
      });
    } catch (error) {
      logger.warn('PWA non disponible');
    }
  };
  registerPWA();
}

createRoot(document.getElementById("root")!).render(<App />);
