/**
 * useDriverActionAlert
 *
 * Hook que gerencia o estado do alerta de ação do motorista no painel do operador/admin.
 * Reproduz o som 1.mp3 e mantém o modal de confirmação aberto até o operador confirmar.
 */

import { useState, useRef, useCallback } from 'react';

export type DriverActionType = 'checkin' | 'checkout';

export interface DriverAlert {
  type: DriverActionType;
  ordem: any;
  timestamp: number;
}

export const useDriverActionAlert = () => {
  const [alert, setAlert] = useState<DriverAlert | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const triggerAlert = useCallback((type: DriverActionType, ordem: any) => {
    // Toca o som
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      const audio = new Audio('/songs/1.mp3');
      audio.volume = 0.85;
      audio.play().catch(() => {
        // Navegador pode bloquear autoplay sem interação prévia — ignora silenciosamente
      });
      audioRef.current = audio;
    } catch {
      // ignora erros de áudio
    }

    setAlert({ type, ordem, timestamp: Date.now() });
  }, []);

  const dismissAlert = useCallback(() => {
    // Para o som ao dispensar
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setAlert(null);
  }, []);

  return { alert, triggerAlert, dismissAlert };
};
