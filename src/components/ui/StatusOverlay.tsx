// RUTA: src/components/ui/StatusOverlay.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Definimos los posibles estados de flujo de una operación
export type FlowStatus = 'idle' | 'loading' | 'success' | 'error';

interface StatusOverlayProps {
  isOpen: boolean; // Controla si el overlay es visible
  flowStatus: FlowStatus; // El estado actual: 'loading', 'success', 'error', 'idle'
  message?: string | null; // Mensaje principal a mostrar
  subMessage?: string | null; // Mensaje secundario o de detalle (ej. para errores)
  onClose?: () => void; // Función para cerrar el overlay (opcional)
  onRetry?: () => void; // Función para reintentar (opcional, útil en estado 'error')
  minDisplayTime?: number; // Tiempo mínimo en ms que el overlay debe mostrarse (para estados de carga/éxito)
}

const StatusOverlay: React.FC<StatusOverlayProps> = ({
  isOpen,
  flowStatus,
  message,
  subMessage,
  onClose,
  onRetry,
  minDisplayTime = 0, // Por defecto, no hay tiempo mínimo de visualización
}) => {
  const [isRendered, setIsRendered] = React.useState(false);
  const displayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Efecto para controlar las animaciones de entrada/salida y el tiempo mínimo de visualización
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      if (minDisplayTime > 0 && (flowStatus === 'loading' || flowStatus === 'success')) {
        displayTimerRef.current = setTimeout(() => {
          // Si el estado sigue siendo loading/success después del tiempo mínimo,
          // permitir que onClose se active (si existe)
          // Esto es más para prevenir que el loader desaparezca demasiado rápido.
          if (onClose && (flowStatus === 'loading' || flowStatus === 'success')) {
            // onClose(); // No lo cerramos automáticamente aquí, solo aseguramos que pueda cerrar.
          }
        }, minDisplayTime);
      }
    } else {
      // Limpiar cualquier temporizador pendiente al cerrar el overlay
      if (displayTimerRef.current) {
        clearTimeout(displayTimerRef.current);
        displayTimerRef.current = null;
      }
      // Retrasar el desmontaje del componente para permitir animaciones de salida
      const timer = setTimeout(() => setIsRendered(false), 300); // Duración de la animación de salida
      return () => clearTimeout(timer);
    }
    return () => {
        if (displayTimerRef.current) {
            clearTimeout(displayTimerRef.current);
        }
    };
  }, [isOpen, flowStatus, minDisplayTime, onClose]);

  // Si no está renderizado, no devuelve nada
  if (!isRendered) {
    return null;
  }

  // Clases CSS condicionales para el contenedor principal del overlay
  const overlayClasses = cn(
    "fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300",
    isOpen ? "opacity-100" : "opacity-0 pointer-events-none" // Control de opacidad y eventos para animación
  );

  // Clases CSS para la tarjeta de contenido dentro del overlay
  const cardClasses = cn(
    "bg-card text-card-foreground rounded-lg shadow-xl overflow-hidden flex flex-col transition-all duration-300 ease-in-out transform",
    {
      'w-48 h-48': flowStatus === 'loading', // Tamaño pequeño para loader
      'w-full max-w-sm h-auto': flowStatus === 'success' || flowStatus === 'error', // Tamaño adaptable para éxito/error
      // Aquí puedes añadir clases para animaciones de entrada/salida de la tarjeta si quieres más allá de la opacidad global
      // ej: "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
      // Las animaciones de Radix UI en Dialog/Sheet ya suelen manejar esto si lo usas en el padre.
    }
  );

  let content;
  switch (flowStatus) {
    case 'loading':
      content = (
        <div className="flex flex-col items-center justify-center text-center p-6 w-full h-full" role="status" aria-live="polite">
          <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">{message || "Cargando..."}</p>
          {subMessage && <p className="text-xs text-muted-foreground mt-1">{subMessage}</p>}
        </div>
      );
      break;
    case 'success':
      content = (
        <div className="flex flex-col items-center justify-center text-center p-8 w-full h-full" role="status" aria-live="polite">
          <CheckCircle className="h-20 w-20 text-green-500 mb-6" />
          <h3 className="text-xl font-semibold">{message || "Operación Exitosa!"}</h3>
          {subMessage && <p className="text-muted-foreground text-sm mt-1">{subMessage}</p>}
          {onClose && (
            <Button onClick={onClose} className="mt-4">Cerrar</Button>
          )}
        </div>
      );
      break;
    case 'error':
      content = (
        <div className="flex flex-col items-center justify-center text-center p-8 w-full h-full" role="alert" aria-live="assertive">
          <AlertCircle className="h-20 w-20 text-destructive mb-6" />
          <h3 className="text-xl font-semibold">{message || "Ocurrió un Error"}</h3>
          {subMessage && <p className="text-muted-foreground text-sm mt-1 mb-4">{subMessage}</p>}
          <div className="flex gap-2">
            {onClose && (
              <Button variant="outline" onClick={onClose}>Cerrar</Button>
            )}
            {onRetry && (
              <Button onClick={onRetry}>Reintentar</Button>
            )}
          </div>
        </div>
      );
      break;
    default: // 'idle' o cualquier otro estado no visible
      content = null;
      break;
  }

  if (flowStatus === 'idle') {
    return null; // Si está en 'idle', no renderiza nada del overlay
  }

  return (
    <div className={overlayClasses}>
      <div className={cardClasses}>
        {content}
      </div>
    </div>
  );
};

export default StatusOverlay;
