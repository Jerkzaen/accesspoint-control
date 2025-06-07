// src/components/TicketModal.tsx
"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { TicketFormInModal } from "./TicketFormInModal";
import { Ticket } from '@/types/ticket';
import { CreationFlowStatus } from "./TicketCard"; // Importando el tipo desde el orquestador
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "./ui/button";

// Definimos los tipos para las props
interface EmpresaClienteOption {
  id: string;
  nombre: string;
}

interface UbicacionOption {
  id: string;
  nombreReferencial: string | null;
  direccionCompleta: string;
}

// Props actualizadas para ser controladas por el orquestador
interface TicketModalProps {
  isOpen: boolean;
  flowStatus: CreationFlowStatus;
  onClose: () => void;
  onCompletion: (newTicket?: Ticket, formData?: FormData, error?: string) => void;
  onRetry: () => void;
  nextNroCaso: number;
  empresasClientes: EmpresaClienteOption[];
  ubicacionesDisponibles: UbicacionOption[];
  stashedData: FormData | null;
}

export function TicketModal({
  isOpen,
  flowStatus,
  onClose,
  onCompletion,
  onRetry,
  nextNroCaso,
  empresasClientes,
  ubicacionesDisponibles,
  stashedData
}: TicketModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Efecto para manejar el cierre con ESC y click fuera del modal.
  // La visibilidad ahora es manejada por la prop `isOpen`.
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && isOpen) {
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
  }, [isOpen, onClose]);

  if (!isOpen && flowStatus === 'idle') {
    return null;
  }
  
  // --- LÓGICA DE ANIMACIÓN Y RENDERIZADO CONDICIONAL ---
  
  // Clases dinámicas para la animación de tamaño del modal
  const modalContainerClasses = cn(
    "bg-card text-card-foreground rounded-lg shadow-xl overflow-hidden flex flex-col transition-all duration-500 ease-in-out",
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
        "transition-opacity duration-300 ease-out",
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      <div
        ref={modalRef}
        className={modalContainerClasses}
        onClick={(e) => e.stopPropagation()}
      >
        {flowStatus === 'form' && (
          <TicketFormInModal
            nextNroCaso={nextNroCaso}
            onCompletion={onCompletion}
            onCancel={onClose}
            empresasClientes={empresasClientes}
            ubicacionesDisponibles={ubicacionesDisponibles}
            initialData={stashedData} // Pasamos los datos guardados si existen
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
                <p className="text-muted-foreground text-sm mt-1 mb-4">No se pudo crear el ticket. Por favor, inténtalo de nuevo.</p>
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
