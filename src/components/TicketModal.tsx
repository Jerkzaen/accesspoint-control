// src/components/TicketModal.tsx
"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { TicketFormInModal } from "./TicketFormInModal";
import { CreationFlowStatus } from "./TicketCard";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "./ui/button";

// --- INTERFACES ---
interface EmpresaClienteOption {
  id: string;
  nombre: string;
}

interface UbicacionOption {
  id: string;
  nombreReferencial: string | null;
  direccionCompleta: string;
}

interface TicketModalProps {
  isOpen: boolean;
  flowStatus: CreationFlowStatus;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  onRetry: () => void;
  isSubmitting: boolean;
  submissionError: string | null;
  nextNroCaso: number;
  empresasClientes: EmpresaClienteOption[];
  ubicacionesDisponibles: UbicacionOption[];
  stashedData: FormData | null;
}

// --- COMPONENTE ---
export function TicketModal({
  isOpen,
  flowStatus,
  onClose,
  onSubmit,
  onRetry,
  isSubmitting,
  submissionError,
  nextNroCaso,
  empresasClientes,
  ubicacionesDisponibles,
  stashedData
}: TicketModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = React.useState(false);

  // Este efecto maneja el montaje y desmontaje del modal
  // para permitir que la animación de salida se complete.
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
    } else {
      // Espera a que termine la animación de salida antes de desmontar
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 300); // Debe coincidir con la duración de la animación de salida
      return () => clearTimeout(timer);
    }
  }, [isOpen]);


  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && flowStatus !== 'loading' && flowStatus !== 'success') {
        onClose();
      }
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && isOpen && flowStatus !== 'loading' && flowStatus !== 'success') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEsc);
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, flowStatus]);

  if (!isRendered) {
    return null;
  }
  
  const modalContainerClasses = cn(
    "bg-card text-card-foreground rounded-lg shadow-xl overflow-hidden flex flex-col transition-all duration-200", // Transición suave para el tamaño
    {
      'w-full max-w-2xl max-h-[90vh]': flowStatus === 'form',
      'w-48 h-48': flowStatus === 'loading',
      'w-full max-w-sm h-auto': flowStatus === 'success' || flowStatus === 'error',
    }
  );

  return (
    <div
      className={cn(
        "fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
      )}
      data-state={isOpen ? 'open' : 'closed'}
    >
      <div
        // CORRECCIÓN 1: La prop `key` fuerza a React a re-renderizar este div como uno nuevo
        // cada vez que el `flowStatus` cambia. Esto reinicia la animación de entrada
        // con el tamaño correcto, eliminando el "salto".
        key={flowStatus}
        ref={modalRef}
        className={cn(
            modalContainerClasses,
            // CORRECCIÓN 2: Se aumenta la duración para una animación más lenta y fluida.
            // Se aplican tanto en la entrada como en la salida.
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:duration-500",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-300"
        )}
        data-state={isOpen ? 'open' : 'closed'}
        onClick={(e) => e.stopPropagation()}
      >
        {flowStatus === 'form' && (
          <TicketFormInModal
            nextNroCaso={nextNroCaso}
            onSubmit={onSubmit}
            onCancel={onClose}
            isSubmitting={isSubmitting}
            serverError={submissionError}
            empresasClientes={empresasClientes}
            ubicacionesDisponibles={ubicacionesDisponibles}
            initialData={stashedData}
          />
        )}

        {flowStatus === 'loading' && (
          <div className="flex flex-col items-center justify-center text-center p-6 w-full h-full">
            <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Creando ticket...</p>
          </div>
        )}

        {flowStatus === 'success' && (
          <div className="flex flex-col items-center justify-center text-center p-8 w-full h-full">
            <CheckCircle className="h-20 w-20 text-green-500 mb-6" />
            <h3 className="text-xl font-semibold">¡Ticket Creado!</h3>
            <p className="text-muted-foreground text-sm mt-1">El ticket ha sido registrado exitosamente.</p>
          </div>
        )}
        
        {flowStatus === 'error' && (
            <div className="flex flex-col items-center justify-center text-center p-8 w-full h-full">
                <AlertCircle className="h-20 w-20 text-destructive mb-6" />
                <h3 className="text-xl font-semibold">Error al Crear</h3>
                <p className="text-muted-foreground text-sm mt-1 mb-4">{submissionError || "No se pudo crear el ticket."}</p>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                    <Button onClick={onRetry}>Reintentar</Button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
