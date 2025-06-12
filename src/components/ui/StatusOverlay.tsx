// RUTA: src/components/ui/StatusOverlay.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Define los posibles estados de flujo de una operación para el StatusOverlay.
 * 'idle': No hay operación activa, el overlay está oculto.
 * 'loading': La operación está en curso, se muestra un indicador de carga.
 * 'success': La operación se completó exitosamente.
 * 'error': La operación falló, se muestra un mensaje de error.
 */
export type FlowStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Propiedades para el componente StatusOverlay.
 */
interface StatusOverlayProps {
  isOpen: boolean; // Controla si el overlay es visible.
  flowStatus: FlowStatus; // El estado actual del flujo (loading, success, error).
  message?: string | null; // Mensaje principal a mostrar en el overlay.
  subMessage?: string | null; // Mensaje secundario o de detalle (útil para errores o información adicional).
  onClose?: () => void; // Función opcional para cerrar el overlay (llamada por un botón "Cerrar").
  onRetry?: () => void; // Función opcional para reintentar la operación (llamada por un botón "Reintentar" en estado de error).
  minDisplayTime?: number; // Tiempo mínimo en milisegundos que el overlay debe mostrarse para estados 'loading' o 'success'.
  isNested?: boolean; // Si es true, el componente no renderiza su propio fondo ni animaciones de superposición;
                      // asume que es un contenido dentro de otro componente que ya maneja eso (ej. un modal).
}

/**
 * `StatusOverlay` es un componente reutilizable para mostrar estados visuales de operaciones.
 * Puede funcionar como un overlay de pantalla completa o anidado dentro de otro componente.
 *
 * @param {StatusOverlayProps} props - Las propiedades del componente.
 */
const StatusOverlay: React.FC<StatusOverlayProps> = ({
  isOpen,
  flowStatus,
  message,
  subMessage,
  onClose,
  onRetry,
  minDisplayTime = 0, // Por defecto, no hay tiempo mínimo de visualización
  isNested = false,   // Por defecto, se comporta como un overlay de pantalla completa
}) => {
  const [isRendered, setIsRendered] = React.useState(false);
  const displayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Efecto para controlar el montaje y desmontaje del componente,
  // permitiendo animaciones de salida y respetando el tiempo mínimo de visualización.
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true); // Si se abre, lo marcamos para renderizar
      if (minDisplayTime > 0 && (flowStatus === 'loading' || flowStatus === 'success')) {
        // Establecer un temporizador para asegurar que el overlay se muestre por el tiempo mínimo.
        // El cierre real lo controla el componente padre o una interacción del usuario.
        displayTimerRef.current = setTimeout(() => {
          // El temporizador ha finalizado.
        }, minDisplayTime);
      }
    } else {
      // Si se cierra, limpiamos cualquier temporizador pendiente.
      if (displayTimerRef.current) {
        clearTimeout(displayTimerRef.current);
        displayTimerRef.current = null;
      }
      // Para el desmontaje, si no es anidado, esperamos la duración de la transición del fondo.
      // Si es anidado, el padre controla la desaparición de su contenedor, así que podemos desmontar de inmediato.
      if (!isNested) {
        const timer = setTimeout(() => setIsRendered(false), 300); // Coincide con la duración de la transición de opacidad del div principal
        return () => clearTimeout(timer);
      } else {
        setIsRendered(false); // Desmontar inmediatamente si es anidado.
      }
    }
    // Función de limpieza para asegurar que los temporizadores se borren al desmontar el componente.
    return () => {
        if (displayTimerRef.current) {
            clearTimeout(displayTimerRef.current);
        }
    };
  }, [isOpen, flowStatus, minDisplayTime, isNested]); // Dependencias del efecto

  // Si no debe ser renderizado (está cerrado y su animación de salida terminó, o está en estado 'idle'), no devuelve nada.
  if (!isRendered || flowStatus === 'idle') {
    return null;
  }

  // Clases CSS para el contenedor exterior del StatusOverlay.
  // Si no es anidado, se comporta como un overlay de pantalla completa.
  // Si es anidado, solo se centra dentro de su contenedor padre.
  const outerClasses = cn(
    // Clases para el overlay de pantalla completa (solo si no es anidado)
    {
      "fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300": !isNested,
      "opacity-100": !isNested && isOpen,
      "opacity-0 pointer-events-none": !isNested && !isOpen,
    },
    // Si es anidado, el `StatusOverlay` siempre debe ocupar el 100% del espacio que le proporciona su padre.
    // Su padre (CreateTicketModal) ya controla el tamaño y la animación de la "ventana" del modal.
    {
      "flex items-center justify-center w-full h-full": isNested,
    }
  );

  // Clases CSS para la tarjeta de contenido real dentro del StatusOverlay.
  // Estas clases controlan el tamaño y la apariencia visual de la "tarjeta" de estado.
  const cardClasses = cn(
    "bg-card text-card-foreground rounded-lg shadow-xl overflow-hidden flex flex-col transition-all duration-300 ease-in-out transform",
    // SI NO ES ANIDADO, StatusOverlay define su propio tamaño de tarjeta.
    {
      'w-48 h-48': !isNested && flowStatus === 'loading', // Solo si no es anidado
      'w-full max-w-sm h-auto': !isNested && (flowStatus === 'success' || flowStatus === 'error'), // Solo si no es anidado
    },
    // SI ES ANIDADO, la tarjeta interna debe ocupar el 100% del espacio que le da el outerClasses del StatusOverlay (que ya es w-full h-full del padre).
    // El tamaño del "cuadro" del modal ya lo maneja CreateTicketModal.
    {
      'w-full h-full': isNested // Para que la tarjeta interna llene el espacio del padre cuando es anidado.
    }
  );

  let content; // Variable para almacenar el JSX del contenido específico del estado
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
    default:
      content = null;
      break;
  }

  // Renderiza el contenedor exterior y, dentro de él, la tarjeta con el contenido específico del estado.
  return (
    <div className={outerClasses}>
      <div className={cardClasses}>
        {content}
      </div>
    </div>
  );
};

export default StatusOverlay;
