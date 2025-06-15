// RUTA: src/components/tickets/CreateTicketModal.tsx
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CreateTicketForm } from './CreateTicketForm';
import { CreationFlowStatus, Ticket } from '@/types/ticket';
import StatusOverlay from '@/components/ui/StatusOverlay';

// --- Interfaces ---
interface EmpresaClienteOption { id: string; nombre: string; }
interface UbicacionOption { id: string; nombreReferencial: string | null; }

// ============ INTERFAZ DE PROPS ACTUALIZADA ============
// Se añade la nueva propiedad para el mensaje de carga dinámico.
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
  createdTicket: Ticket | null;
  onViewTicket: () => void;
  loadingMessage: string; // ¡Propiedad añadida!
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
  stashedData,
  createdTicket,
  onViewTicket,
  loadingMessage, // Se recibe la nueva prop.
}: CreateTicketModalProps) {
  
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  const isOverlayOpen = flowStatus === 'loading' || flowStatus === 'success' || flowStatus === 'error';

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[625px] flex flex-col max-h-[90vh]">
        {/* El contenido del formulario se oculta si el overlay está activo */}
        <div className={isOverlayOpen ? 'hidden' : 'contents'}>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Ticket #{nextNroCaso}</DialogTitle>
            <DialogDescription>
              Completa la información a continuación para registrar un nuevo ticket de soporte.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2">
            {flowStatus === 'form' && (
              <CreateTicketForm
                isSubmitting={isSubmitting}
                onSubmit={onSubmit}
                onCancel={onClose}
                serverError={submissionError}
                initialData={stashedData}
                stashedData={stashedData}
                empresasClientes={empresasClientes}
                ubicacionesDisponibles={ubicacionesDisponibles}
                nextNroCaso={nextNroCaso}
              />
            )}
          </div>
        </div>

        {/* El overlay se muestra en lugar del formulario */}
        {isOverlayOpen && (
            <StatusOverlay 
                isOpen={isOverlayOpen}
                flowStatus={flowStatus} 
                onRetry={onRetry} 
                onClose={onClose}
                isNested={true}
                message={
                  flowStatus === 'success' && createdTicket
                    ? `¡Ticket #${createdTicket.numeroCaso} Creado!`
                    : flowStatus === 'error'
                    ? 'Error al Crear'
                    : 'Procesando...'
                }
                subMessage={
                  // =========== LÓGICA DE SUB-MENSAJE ACTUALIZADA ===========
                  // Ahora, en estado 'loading', muestra el mensaje dinámico que viene de las props.
                  flowStatus === 'loading'
                    ? loadingMessage
                    : flowStatus === 'success'
                    ? "Puedes ver el nuevo ticket en tu dashboard."
                    : submissionError
                  // =========================================================
                }
                primaryActionText="Ver Ticket"
                onPrimaryAction={onViewTicket}
            />
        )}
      </DialogContent>
    </Dialog>
  );
}
