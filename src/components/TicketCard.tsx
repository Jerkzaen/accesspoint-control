// src/components/TicketCard.tsx
'use client';

import * as React from 'react';
import SingleTicketItemCard from './SingleTicketItemCard';
import SelectedTicketPanel from './SelectedTicketPanel';
import { Ticket } from '@/types/ticket';
import { useMediaQuery } from 'usehooks-ts';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet';
import { AlertTriangle, Loader2, X as CloseIcon, Filter as FilterIcon, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTickets, TicketFilters } from '@/hooks/useTickets';
import { TicketModal } from './TicketModal';
import { createNewTicketAction, loadLastTicketNro } from '@/app/actions/ticketActions';
import { Skeleton } from '@/components/ui/skeleton';
import { EstadoTicket, PrioridadTicket } from '@prisma/client';

// --- INTERFACES Y CONSTANTES ---
interface EmpresaClienteOption { id: string; nombre: string; }
interface UbicacionOption { id: string; nombreReferencial: string | null; direccionCompleta: string; }

// Interfaz que faltaba y causaba el error. Define las props que espera el componente.
interface TicketCardProps {
  empresasClientes: EmpresaClienteOption[];
  ubicacionesDisponibles: UbicacionOption[];
}

export type CreationFlowStatus = 'idle' | 'form' | 'loading' | 'success' | 'error';
interface ActionState { error?: string; success?: boolean; ticket?: Ticket; }

const HEADER_AND_PAGE_PADDING_OFFSET = '100px';
const MIN_SKELETON_DISPLAY_TIME = 500;
const MIN_CREATION_LOADER_TIME = 2000; // Mínimo 2 segundos de loader
const NEW_TICKET_HIGHLIGHT_DURATION = 3000;
const MODAL_SUCCESS_DISPLAY_DURATION = 2000;
const initialActionState: ActionState = { error: undefined, success: undefined, ticket: undefined };

// --- COMPONENTE ORQUESTADOR ---
export default function TicketCard({ empresasClientes, ubicacionesDisponibles }: TicketCardProps) {
  const {
    tickets,
    setTickets,
    isLoading,
    error: fetchTicketsError,
    refreshTickets,
    applyFilters,
    currentFilters,
  } = useTickets();

  const [selectedTicket, setSelectedTicket] = React.useState<Ticket | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [nextTicketNumber, setNextTicketNumber] = React.useState(0);
  const [newlyCreatedTicketId, setNewlyCreatedTicketId] = React.useState<string | null>(null);

  // --- Estados del Flujo de Creación (El cerebro del orquestador) ---
  const [creationFlow, setCreationFlow] = React.useState<CreationFlowStatus>('idle');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submissionError, setSubmissionError] = React.useState<string | null>(null);
  const [stashedTicketData, setStashedTicketData] = React.useState<FormData | null>(null);

  const [searchText, setSearchText] = React.useState(currentFilters.searchText || '');
  const [estadoFilter, setEstadoFilter] = React.useState<EstadoTicket | 'all'>(currentFilters.estado as EstadoTicket || 'all');
  const [prioridadFilter, setPrioridadFilter] = React.useState<PrioridadTicket | 'all'>(currentFilters.prioridad as PrioridadTicket || 'all');
  const [debouncedSearchText, setDebouncedSearchText] = React.useState(searchText);
  const [showFilterSkeleton, setShowFilterSkeleton] = React.useState(false);
  const filterStartTimeRef = React.useRef<number | null>(null);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  
  // --- MANEJADORES Y CALLBACKS ---
  const handleTicketUpdated = React.useCallback((updatedTicket: Ticket) => {
    setTickets(prev => prev.map(t => (t.id === updatedTicket.id ? updatedTicket : t)));
    if (selectedTicket?.id === updatedTicket.id) setSelectedTicket(updatedTicket);
  }, [selectedTicket, setTickets]);

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
  
  // Lógica central para manejar el envío y el temporizador.
  const handleSubmitTicketForm = async (formData: FormData) => {
    setIsSubmitting(true);
    setSubmissionError(null);
    setCreationFlow('loading');

    // Se crean dos promesas: una para la acción de red y otra para el temporizador.
    const actionPromise = createNewTicketAction(initialActionState, formData);
    const timerPromise = new Promise(resolve => setTimeout(resolve, MIN_CREATION_LOADER_TIME));
    
    // `Promise.all` espera a que ambas terminen. Esto garantiza que el loader dure al menos 2 segundos.
    const [actionResult] = await Promise.all([actionPromise, timerPromise]);

    setIsSubmitting(false);

    // Se evalúa el resultado de la acción de red.
    if (actionResult.success && actionResult.ticket) {
      setCreationFlow('success');
      refreshTickets();
      setSelectedTicket(actionResult.ticket);
      setNewlyCreatedTicketId(actionResult.ticket.id);
      
      // Cierra el modal de éxito después de un tiempo para que el usuario lo vea.
      setTimeout(() => handleCloseCreateModal(), MODAL_SUCCESS_DISPLAY_DURATION);
    } else {
      // Si hay error, guarda los datos del formulario y muestra la pantalla de error.
      setStashedTicketData(formData);
      setSubmissionError(actionResult.error || 'Ocurrió un error desconocido.');
      setCreationFlow('error');
    }
  };

  const handleRetryCreation = () => {
    setCreationFlow('form');
    setSubmissionError(null);
  };
  
  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    if (!isDesktop) setIsSheetOpen(true);
  };
  
  const handleClearFilters = () => {
    setSearchText('');
    setEstadoFilter('all');
    setPrioridadFilter('all');
    setDebouncedSearchText('');
  };

  // --- EFECTOS ---
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchText(searchText), 500);
    return () => clearTimeout(handler);
  }, [searchText]);

  React.useEffect(() => {
    const newFilters: TicketFilters = {
      searchText: debouncedSearchText.trim() || undefined,
      estado: estadoFilter === 'all' ? undefined : estadoFilter,
      prioridad: prioridadFilter === 'all' ? undefined : prioridadFilter,
    };
    if (JSON.stringify(newFilters) !== JSON.stringify(currentFilters)) {
      setSelectedTicket(null);
      filterStartTimeRef.current = Date.now();
      setShowFilterSkeleton(true);
      applyFilters(newFilters);
    }
  }, [debouncedSearchText, estadoFilter, prioridadFilter, applyFilters, currentFilters]);

  React.useEffect(() => {
    if (!isLoading && showFilterSkeleton) {
      const elapsed = Date.now() - (filterStartTimeRef.current || 0);
      const remainingTime = MIN_SKELETON_DISPLAY_TIME - elapsed;
      if (remainingTime > 0) {
        const timer = setTimeout(() => setShowFilterSkeleton(false), remainingTime);
        return () => clearTimeout(timer);
      } else {
        setShowFilterSkeleton(false);
      }
    }
  }, [isLoading, showFilterSkeleton]);
  
  React.useEffect(() => {
    if (newlyCreatedTicketId) {
      const timer = setTimeout(() => setNewlyCreatedTicketId(null), NEW_TICKET_HIGHLIGHT_DURATION);
      return () => clearTimeout(timer);
    }
  }, [newlyCreatedTicketId]);

  React.useEffect(() => {
    if (!isDesktop && selectedTicket) setIsSheetOpen(true);
    else if (isDesktop) setIsSheetOpen(false);
  }, [selectedTicket, isDesktop]);

  // --- RENDERIZADO ---
  if (isLoading && !tickets.length && !fetchTicketsError) {
      return <LoadingState />;
  }
  if (fetchTicketsError) {
      return <ErrorState error={fetchTicketsError} onRetry={refreshTickets} />;
  }

  return (
    <div className="flex flex-col md:flex-row flex-grow h-full p-1 sm:p-4 gap-4">
      <div className={`flex flex-col h-full overflow-hidden ${isDesktop ? 'md:w-[calc(65%-0.5rem)] lg:w-[calc(70%-0.5rem)]' : 'w-full'}`}>
        {/* Panel de Filtros */}
        <div className="bg-card p-4 rounded-lg shadow-sm mb-4 flex-shrink-0">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FilterIcon className="h-5 w-5 text-primary" />
              Filtros de Búsqueda
            </h2>
            <Button onClick={handleOpenCreateModal} size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              Crear Ticket
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="searchText">Buscar por texto</Label>
              <Input id="searchText" type="text" placeholder="Título, Empresa..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="h-9"/>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="estadoFilter">Estado</Label>
              <Select value={estadoFilter} onValueChange={(value: EstadoTicket | 'all') => setEstadoFilter(value)}>
                <SelectTrigger id="estadoFilter" className="h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {Object.values(EstadoTicket).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prioridadFilter">Prioridad</Label>
              <Select value={prioridadFilter} onValueChange={(value: PrioridadTicket | 'all') => setPrioridadFilter(value)}>
                <SelectTrigger id="prioridadFilter" className="h-9"><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las prioridades</SelectItem>
                  {Object.values(PrioridadTicket).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={handleClearFilters}>Limpiar Filtros</Button>
          </div>
        </div>

        {/* Lista de Tickets */}
        <div className="flex-grow overflow-y-auto space-y-2 pb-4 md:pr-2" style={{ maxHeight: `calc(100vh - ${HEADER_AND_PAGE_PADDING_OFFSET} - 160px)` }}>
          {showFilterSkeleton ? (
            Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-32 w-full rounded-lg" />)
          ) : (
            tickets.length > 0 ? (
              tickets.sort((a,b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()).map((ticket) => (
                <SingleTicketItemCard
                  key={ticket.id}
                  ticket={ticket}
                  onSelectTicket={handleSelectTicket}
                  onTicketUpdatedInList={handleTicketUpdated}
                  isSelected={selectedTicket?.id === ticket.id && isDesktop}
                  isNew={newlyCreatedTicketId === ticket.id}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                <p>No se encontraron tickets con los filtros actuales.</p>
              </div>
            )
          )}
        </div>
      </div>
      
      {/* Panel de Detalles (Desktop) */}
      {isDesktop && (
        <div className="shadow-lg rounded-lg sticky top-4 flex-shrink-0 md:w-[35%] lg:w-[30%]" style={{ height: `calc(100vh - ${HEADER_AND_PAGE_PADDING_OFFSET})` }}>
          <SelectedTicketPanel selectedTicket={selectedTicket} onTicketUpdated={handleTicketUpdated} headerAndPagePaddingOffset={HEADER_AND_PAGE_PADDING_OFFSET} isLoadingGlobal={showFilterSkeleton}/>
        </div>
      )}

      {/* Panel de Detalles (Móvil) */}
      {!isDesktop && (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent side="right" className="w-[90vw] sm:w-[75vw] p-0 flex flex-col">
            {selectedTicket && (
              <>
                <SheetHeader className="p-4 border-b flex-row justify-between items-center">
                   <div><SheetTitle>Ticket #{selectedTicket.numeroCaso}</SheetTitle><SheetDescription className="sr-only">Detalles del ticket.</SheetDescription></div>
                   <SheetClose asChild><Button variant="ghost" size="icon"><CloseIcon className="h-5 w-5" /></Button></SheetClose>
                </SheetHeader>
                <div className="flex-grow overflow-y-auto"><SelectedTicketPanel selectedTicket={selectedTicket} onTicketUpdated={handleTicketUpdated} headerAndPagePaddingOffset="0px" /></div>
              </>
            )}
          </SheetContent>
        </Sheet>
      )}

      {/* Modal de Creación. Se le pasan todas las props necesarias para que el orquestador lo controle. */}
      <TicketModal
        isOpen={creationFlow !== 'idle'}
        flowStatus={creationFlow}
        onClose={handleCloseCreateModal}
        onSubmit={handleSubmitTicketForm}
        onRetry={handleRetryCreation}
        isSubmitting={isSubmitting}
        submissionError={submissionError}
        nextNroCaso={nextTicketNumber}
        empresasClientes={empresasClientes}
        ubicacionesDisponibles={ubicacionesDisponibles}
        stashedData={stashedTicketData}
      />
    </div>
  );
}

// Componentes auxiliares para estados de carga y error
const LoadingState = () => (
    <div className="flex flex-col items-center justify-center h-full p-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p>Cargando tickets...</p>
    </div>
);

const ErrorState = ({ error, onRetry }: { error: string, onRetry: () => void }) => (
    <div className="flex flex-col items-center justify-center h-full p-4 text-red-600 dark:text-red-400">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p className="mb-1 text-center">Error al cargar los tickets.</p>
        <p className="text-xs text-center mb-3">{error}</p>
        <Button onClick={onRetry} variant="default" size="sm">Reintentar</Button>
    </div>
);
