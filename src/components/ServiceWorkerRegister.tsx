'use client';

import { useEffect } from 'react';

/**
 * Enregistre le service worker côté client (uniquement en production, pour
 * éviter d'interférer avec le hot-reload en développement).
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV === 'production' &&
      'serviceWorker' in navigator
    ) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Enregistrement silencieux : l'app fonctionne sans le SW.
      });
    }
  }, []);

  return null;
}
