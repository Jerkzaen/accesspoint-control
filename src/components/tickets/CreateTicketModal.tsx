// RUTA: src/components/tickets/CreateTicketModal.tsx
'use client';

import * as React from 'react';
import { useEffect, useRef } from 'react';
// La importación ahora apunta al futuro componente CreateTicketForm
import { CreateTicketForm } from './CreateTicketForm'; 
import { CreationFlowStatus } from '@/types/ticket'; 
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// --- Interfaces ---
interface EmpresaClienteOption { id: string; nombre: string; }
interface UbicacionOption { id: string; nombreReferencial: string | null; direccionCompleta: string; }

interface CreateTicketModalProps {
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

// El componente ahora tiene un nombre más específico para su función
export function CreateTicketModal({
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
}: CreateTicketModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [isRendered, setIsRendered] = React.useState(false);

  // Efecto para controlar las animaciones de entrada/salida del modal
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
    } else {
      const timer = setTimeout(() => setIsRendered(false), 300); 
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Efecto para manejar eventos del teclado, clics fuera del modal y el foco inicial
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
      
      const focusTimer = setTimeout(() => {
        formRef.current?.querySelector<HTMLElement>('input, select, textarea')?.focus();
      }, 50);
      
      return () => {
        clearTimeout(focusTimer);
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEsc);
        document.removeEventListener('mousedown', handleClickOutside);
      }; 
    }
  }, [isOpen, onClose, flowStatus]);

  if (!isRendered) {
    return null;
  }
  
  const modalContainerClasses = cn(
    "bg-card text-card-foreground rounded-lg shadow-xl overflow-hidden flex flex-col transition-all duration-300 ease-in-out", 
    {
      'w-full max-w-2xl max-h-[90vh]': flowStatus === 'form',
      'w-48 h-48': flowStatus === 'loading',
      'w-full max-w-sm h-auto': flowStatus === 'success' || flowStatus === 'error',
    }
  );

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
      data-state={isOpen ? 'open' : 'closed'}
    >
      <div
        key={flowStatus}
        ref={modalRef}
        className={cn(
            modalContainerClasses,
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:duration-500",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-300"
        )}
        data-state={isOpen ? 'open' : 'closed'}
        role="dialog"
        aria-modal="true"
      >
        {flowStatus === 'form' && (
          <CreateTicketForm
            ref={formRef} 
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
          <div className="flex flex-col items-center justify-center text-center p-6 w-full h-full" role="status" aria-live="polite">
            <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Creando ticket...</p>
          </div>
        )}

        {flowStatus === 'success' && (
          <div className="flex flex-col items-center justify-center text-center p-8 w-full h-full" role="status" aria-live="polite">
            <CheckCircle className="h-20 w-20 text-green-500 mb-6" />
            <h3 className="text-xl font-semibold">¡Ticket Creado!</h3>
            <p className="text-muted-foreground text-sm mt-1">El ticket ha sido registrado exitosamente.</p>
          </div>
        )}
        
        {flowStatus === 'error' && (
            <div className="flex flex-col items-center justify-center text-center p-8 w-full h-full" role="alert" aria-live="assertive">
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
