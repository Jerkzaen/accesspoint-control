'use client';

import * as React from 'react';
import { useEffect, useRef } from 'react';
import { CreateTicketForm } from './CreateTicketForm';
import { CreationFlowStatus } from '@/types/ticket';
import { cn } from '@/lib/utils';
import StatusOverlay, { FlowStatus } from '@/components/ui/StatusOverlay'; 

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
  const modalContentRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [isRendered, setIsRendered] = React.useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
    } else {
      const timer = setTimeout(() => setIsRendered(false), 300); 
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
      if (modalContentRef.current && !modalContentRef.current.contains(event.target as Node) && isOpen && flowStatus !== 'loading' && flowStatus !== 'success') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEsc);
      document.addEventListener('mousedown', handleClickOutside);

      const focusTimer = setTimeout(() => {
        formRef.current?.querySelector<HTMLElement>('input, select, textarea, button:not([tabindex="-1"])')?.focus();
      }, 50);

      return () => {
        clearTimeout(focusTimer);
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEsc);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose, flowStatus]); 

  if (!isRendered) return null;

  const modalContentClasses = cn(
    "bg-card text-card-foreground rounded-lg shadow-xl overflow-hidden flex flex-col",
    // MODIFICADO: Aplicamos transiciones solo a 'opacity' y 'transform'
    "transition-opacity duration-300 ease-in-out transition-transform duration-300 ease-in-out transform",
    {
      'w-full max-w-2xl max-h-[90vh]': flowStatus === 'form',
      'w-full max-w-sm h-auto': flowStatus === 'success' || flowStatus === 'error',
      'w-48 h-48': flowStatus === 'loading', // Tamaño para el loader
      'opacity-100 translate-y-0 scale-100': isOpen,
      'opacity-0 translate-y-4 scale-95': !isOpen,
    }
  );

  const overlayFlowStatus: FlowStatus = flowStatus === 'form' ? 'idle' : flowStatus;

  return (
    <div
      ref={modalRef}
      className={cn(
        "fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      role="dialog"
      aria-modal="true"
    >
      <div
        key={flowStatus} 
        ref={modalContentRef}
        className={modalContentClasses}
      >
        {flowStatus === 'form' ? (
          <CreateTicketForm
            ref={formRef}
            nextNroCaso={nextNroCaso}
            onSubmit={onSubmit}
            onCancel={onClose}
            isSubmitting={isSubmitting}
            serverError={submissionError}
            empresasClientes={empresasClientes}
            ubicacionesDisponibles={ubicacionesDisponibles}
            stashedData={stashedData}
            initialData={null} 
          />
        ) : (
          <StatusOverlay
            isOpen={true} 
            flowStatus={overlayFlowStatus}
            message={
              flowStatus === 'loading' ? "Creando ticket..." :
              flowStatus === 'success' ? "¡Ticket Creado!" :
              flowStatus === 'error' ? "Error al Crear" : ""
            }
            subMessage={submissionError}
            onClose={onClose}
            onRetry={onRetry}
            minDisplayTime={flowStatus === 'loading' || flowStatus === 'success' ? 2000 : 0}
            isNested={true} 
          />
        )}
      </div>
    </div>
  );
}
