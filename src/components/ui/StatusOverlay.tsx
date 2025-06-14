// RUTA: src/components/ui/StatusOverlay.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export type FlowStatus = 'idle' | 'loading' | 'success' | 'error';

interface StatusOverlayProps {
  isOpen: boolean;
  flowStatus: FlowStatus;
  message?: string | null;
  subMessage?: string | null;
  onClose?: () => void;
  onRetry?: () => void;
  isNested?: boolean;
  onPrimaryAction?: () => void;
  primaryActionText?: string;
}

const AUTO_CLOSE_DURATION = 5000; // 5 segundos

const StatusOverlay: React.FC<StatusOverlayProps> = ({
  isOpen,
  flowStatus,
  message,
  subMessage,
  onClose,
  onRetry,
  isNested = false,
  onPrimaryAction,
  primaryActionText,
}) => {
  const [progress, setProgress] = useState(0);
  const [autoCloseProgress, setAutoCloseProgress] = useState(100);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoCloseIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // ======================= INICIO DE LA CORRECCIÓN =======================
  // Nuevo estado para controlar la finalización del temporizador de forma segura.
  const [timerFinished, setTimerFinished] = useState(false);
  // =====================================================================

  useEffect(() => {
    if (flowStatus === 'loading' && isOpen) {
      setProgress(10);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = setInterval(() => setProgress(prev => Math.min(prev + 10, 95)), 200);
    } else {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    }
    return () => { if (progressIntervalRef.current) clearInterval(progressIntervalRef.current) };
  }, [flowStatus, isOpen]);

  useEffect(() => {
    // Reseteamos el estado del temporizador cada vez que el estado del flujo cambia,
    // para asegurar que no se llame a onClose de forma errónea en ciclos posteriores.
    setTimerFinished(false); 

    if (flowStatus === 'success' && isOpen && onClose) {
      setAutoCloseProgress(100);
      if (autoCloseIntervalRef.current) clearInterval(autoCloseIntervalRef.current);
      const intervalStep = 100 / (AUTO_CLOSE_DURATION / 100);
      autoCloseIntervalRef.current = setInterval(() => {
        setAutoCloseProgress(prev => {
          if (prev <= 0) {
            clearInterval(autoCloseIntervalRef.current!);
            // En lugar de llamar a onClose() directamente, lo que causa el error,
            // cambiamos nuestro estado local.
            setTimerFinished(true); 
            return 0;
          }
          return prev - intervalStep;
        });
      }, 100);
    }
    return () => { if (autoCloseIntervalRef.current) clearInterval(autoCloseIntervalRef.current) };
  }, [flowStatus, isOpen, onClose]);

  // ======================= INICIO DE LA CORRECCIÓN =======================
  // Este nuevo useEffect escucha los cambios en `timerFinished`.
  // Cuando `timerFinished` se vuelve `true`, llama a `onClose` de forma segura,
  // porque ahora es una reacción a un cambio de estado, no una llamada directa
  // desde un temporizador durante el renderizado.
  useEffect(() => {
    if (timerFinished && onClose) {
      onClose();
    }
  }, [timerFinished, onClose]);
  // =====================================================================

  if (!isOpen || flowStatus === 'idle') return null;

  const cardClasses = cn(
    "bg-card text-card-foreground rounded-lg flex flex-col transition-all duration-300 ease-in-out transform p-6 text-center w-full h-full justify-center items-center"
  );
  
  let content;
  switch (flowStatus) {
    case 'loading':
      content = (
        <div className="w-full max-w-xs space-y-4">
          <h3 className="text-lg font-semibold">{message}</h3>
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground">{subMessage}</p>
        </div>
      );
      break;
    case 'success':
      content = (
        <div className="flex flex-col h-full justify-between w-full">
          <div className="flex-grow flex flex-col items-center justify-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h3 className="text-lg font-semibold">{message}</h3>
            <p className="text-sm text-muted-foreground">{subMessage}</p>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={onClose}>Cerrar</Button>
              {onPrimaryAction && primaryActionText && (
                <Button onClick={onPrimaryAction}>{primaryActionText}</Button>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 pt-4">
            <Progress value={autoCloseProgress} className="w-full h-1" />
          </div>
        </div>
      );
      break;
    case 'error':
      content = (
        <div className="w-full max-w-xs space-y-4">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
          <h3 className="text-lg font-semibold">{message}</h3>
          <p className="text-sm text-muted-foreground break-words">{subMessage}</p>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Cerrar</Button>
            <Button onClick={onRetry}>Reintentar</Button>
          </div>
        </div>
      );
      break;
    default: content = null;
  }

  return (
    <div className={cardClasses}>
        {content}
    </div>
  );
};

export default StatusOverlay;
