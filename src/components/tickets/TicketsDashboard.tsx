// RUTA FINAL: src/components/tickets/TicketsDashboard.tsx
'use client';

import * as React from 'react';
// Importamos los componentes que hemos creado y aislado
import { TicketFiltersPanel } from './TicketFiltersPanel';
import { TicketList } from './TicketList';
import { default as TicketDetailsPanel } from './TicketDetailsPanel';
import { CreateTicketModal } from './CreateTicketModal';

import { Ticket, CreationFlowStatus } from '@/types/ticket';
import { useMediaQuery } from 'usehooks-ts';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTickets, TicketFilters } from '@/hooks/useTickets';
import { createNewTicketAction, loadLastTicketNro } from '@/app/actions/ticketActions';

// --- Interfaces y Constantes ---
interface EmpresaClienteOption { id: string; nombre: string; }
interface UbicacionOption { id: string; nombreReferencial: string | null; direccionCompleta: string; }

interface TicketsDashboardProps {
  empresasClientes: EmpresaClienteOption[];
  ubicacionesDisponibles: UbicacionOption[];
}

interface ActionState { error?: string; success?: boolean; ticket?: Ticket; }

const HEADER_AND_PAGE_PADDING_OFFSET = '100px';
const MIN_CREATION_LOADER_TIME = 2000;
const NEW_TICKET_HIGHLIGHT_DURATION = 3000;
const MODAL_SUCCESS_DISPLAY_DURATION = 2000;
const initialActionState: ActionState = { error: undefined, success: undefined, ticket: undefined };

// --- Componente Orquestador Principal ---
export default function TicketsDashboard({ empresasClientes, ubicacionesDisponibles }: TicketsDashboardProps) {
  const { tickets, setTickets, isLoading, error: fetchTicketsError, refreshTickets, applyFilters, currentFilters } = useTickets();

  const [selectedTicket, setSelectedTicket] = React.useState<Ticket | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [nextTicketNumber, setNextTicketNumber] = React.useState(0);
  const [newlyCreatedTicketId, setNewlyCreatedTicketId] = React.useState<string | null>(null);
  const [creationFlow, setCreationFlow] = React.useState<CreationFlowStatus>('idle');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submissionError, setSubmissionError] = React.useState<string | null>(null);
  const [stashedTicketData, setStashedTicketData] = React.useState<FormData | null>(null);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  
  const handleTicketUpdated = React.useCallback((updatedTicket: Ticket) => {
    setTickets(prev => prev.map(t => (t.id === updatedTicket.id ? updatedTicket : t)));
    if (selectedTicket?.id === updatedTicket.id) {
      setSelectedTicket(updatedTicket);
    }
  }, [selectedTicket, setTickets]);

  const handleSelectTicket = React.useCallback((ticket: Ticket) => {
    setSelectedTicket(ticket);
    if (!isDesktop) setIsSheetOpen(true);
  }, [isDesktop]);

  const handleOpenCreateModal = React.useCallback(async () => {
    setSubmissionError(null);
    try {
      const lastNro = await loadLastTicketNro();
      setNextTicketNumber(lastNro + 1);
      setCreationFlow('form');
    } catch (err) {
      console.error("Error al cargar el siguiente número de ticket:", err);
      setSubmissionError("No se pudo obtener el número de ticket. Intente de nuevo.");
      setCreationFlow('error');
    }
  }, []);
  
  const handleCloseCreateModal = React.useCallback(() => {
    setCreationFlow('idle');
    setStashedTicketData(null);
    setSubmissionError(null);
    setIsSubmitting(false);
  }, []);
  
  const handleSubmitTicketForm = React.useCallback(async (formData: FormData) => {
    setIsSubmitting(true);
    setSubmissionError(null);
    setCreationFlow('loading');
    const actionPromise = createNewTicketAction(initialActionState, formData);
    const timerPromise = new Promise(resolve => setTimeout(resolve, MIN_CREATION_LOADER_TIME));
    const [actionResult] = await Promise.all([actionPromise, timerPromise]);
    setIsSubmitting(false);
    if (actionResult.success && actionResult.ticket) {
      setCreationFlow('success');
      refreshTickets();
      setSelectedTicket(actionResult.ticket);
      setNewlyCreatedTicketId(actionResult.ticket.id);
      setTimeout(handleCloseCreateModal, MODAL_SUCCESS_DISPLAY_DURATION);
    } else {
      setStashedTicketData(formData);
      setSubmissionError(actionResult.error || 'Ocurrió un error desconocido.');
      setCreationFlow('error');
    }
  }, [refreshTickets, handleCloseCreateModal]);
  
  const handleRetryCreation = () => setCreationFlow('form');
  
  const handleFiltersChange = React.useCallback((newFilters: TicketFilters) => {
    applyFilters(newFilters);
  }, [applyFilters]);

  React.useEffect(() => {
    if (selectedTicket && !isLoading) {
      if (!tickets.some(t => t.id === selectedTicket.id)) {
        setSelectedTicket(null);
      }
    }
  }, [tickets, selectedTicket, isLoading]);

  React.useEffect(() => {
    if (newlyCreatedTicketId) {
      const timer = setTimeout(() => setNewlyCreatedTicketId(null), NEW_TICKET_HIGHLIGHT_DURATION);
      return () => clearTimeout(timer);
    }
  }, [newlyCreatedTicketId]);

  if (fetchTicketsError && tickets.length === 0) return <ErrorState error={fetchTicketsError} onRetry={refreshTickets} />;

  return (
    <div className="flex flex-col md:flex-row flex-grow h-full p-1 sm:p-4 gap-4">
      {/* Columna Izquierda, ahora contiene los componentes memoizados */}
      <div className={`flex flex-col h-full overflow-hidden ${isDesktop ? 'md:w-[calc(65%-0.5rem)] lg:w-[calc(70%-0.5rem)]' : 'w-full'}`}>
        <TicketFiltersPanel 
            onFiltersChange={handleFiltersChange}
            onOpenCreateModal={handleOpenCreateModal}
            initialFilters={currentFilters}
        />
        <TicketList 
            tickets={tickets}
            isLoading={isLoading}
            selectedTicket={selectedTicket}
            isDesktop={isDesktop}
            newlyCreatedTicketId={newlyCreatedTicketId}
            onSelectTicket={handleSelectTicket}
            onTicketUpdated={handleTicketUpdated}
            listHeightStyle={{ maxHeight: `calc(100vh - ${HEADER_AND_PAGE_PADDING_OFFSET} - 170px)` }}
        />
      </div>
      
      {/* Columna Derecha */}
      {isDesktop && <div className="w-[400px] flex-shrink-0"><TicketDetailsPanel selectedTicket={selectedTicket} onTicketUpdated={handleTicketUpdated} isLoadingGlobal={isLoading} /></div>}
      {!isDesktop && <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}><SheetContent side="right" className="w-[90vw] sm:w-[75vw] p-0 flex flex-col">{selectedTicket && <TicketDetailsPanel selectedTicket={selectedTicket} onTicketUpdated={handleTicketUpdated} isLoadingGlobal={isLoading} />}</SheetContent></Sheet>}
      
      {/* Modal de Creación */}
      <CreateTicketModal isOpen={creationFlow !== 'idle'} flowStatus={creationFlow} onClose={handleCloseCreateModal} onSubmit={handleSubmitTicketForm} onRetry={handleRetryCreation} isSubmitting={isSubmitting} submissionError={submissionError} nextNroCaso={nextTicketNumber} empresasClientes={empresasClientes} ubicacionesDisponibles={ubicacionesDisponibles} stashedData={stashedTicketData} />
    </div>
  );
}

const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void; }) => <div className="flex flex-col items-center justify-center h-full text-destructive p-4"><AlertTriangle className="h-8 w-8 mb-2" /><p className="text-center">{error}</p><Button onClick={onRetry} className="mt-4">Reintentar</Button></div>;
