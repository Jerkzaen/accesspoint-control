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
import { loadLastTicketNro } from '@/app/actions/ticketActions';
import { Skeleton } from '@/components/ui/skeleton';
import { EstadoTicket, PrioridadTicket } from '@prisma/client';

// Interfaces para los datos que esperamos
interface EmpresaClienteOption {
  id: string;
  nombre: string;
}

interface UbicacionOption {
  id: string;
  nombreReferencial: string | null;
  direccionCompleta: string;
}

interface TicketCardProps {
  empresasClientes: EmpresaClienteOption[];
  ubicacionesDisponibles: UbicacionOption[];
}

// NUEVO: Tipo para la máquina de estados del flujo de creación
export type CreationFlowStatus = 'idle' | 'form' | 'loading' | 'success' | 'error';

const HEADER_AND_PAGE_PADDING_OFFSET = '100px';
const MIN_SKELETON_DISPLAY_TIME = 500;
const NEW_TICKET_HIGHLIGHT_DURATION = 3000; // 3 segundos para el resaltado
const MODAL_SUCCESS_DISPLAY_DURATION = 2000; // 2 segundos para el mensaje de éxito en el modal

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

  // --- INICIO: NUEVOS ESTADOS PARA ORQUESTACIÓN ---
  const [creationFlow, setCreationFlow] = React.useState<CreationFlowStatus>('idle');
  // Almacenará los datos del formulario si la creación falla, para poder rellenarlos de nuevo.
  const [stashedTicketData, setStashedTicketData] = React.useState<FormData | null>(null);
  // --- FIN: NUEVOS ESTADOS PARA ORQUESTACIÓN ---

  const [searchText, setSearchText] = React.useState(currentFilters.searchText || '');
  const [estadoFilter, setEstadoFilter] = React.useState<EstadoTicket | 'all'>(currentFilters.estado as EstadoTicket || 'all');
  const [prioridadFilter, setPrioridadFilter] = React.useState<PrioridadTicket | 'all'>(currentFilters.prioridad as PrioridadTicket || 'all');
  const [debouncedSearchText, setDebouncedSearchText] = React.useState(searchText);
  const [showFilterSkeleton, setShowFilterSkeleton] = React.useState(false);
  const filterStartTimeRef = React.useRef<number | null>(null);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  
  // --- MANEJADORES Y CALLBACKS ---

  const handleTicketUpdated = React.useCallback((updatedTicket: Ticket) => {
    setTickets(prevTickets =>
      prevTickets.map(t => (t.id === updatedTicket.id ? updatedTicket : t))
    );
    if (selectedTicket?.id === updatedTicket.id) {
      setSelectedTicket(updatedTicket);
    }
  }, [selectedTicket, setTickets]);

  const handleOpenCreateModal = React.useCallback(async () => {
    try {
      const lastNro = await loadLastTicketNro();
      setNextTicketNumber(lastNro + 1);
      setCreationFlow('form'); // Abre el modal mostrando el formulario
    } catch (err) {
      console.error("Error al cargar el siguiente número de ticket:", err);
      // Opcional: mostrar un toast de error aquí
    }
  }, []);
  
  const handleCloseCreateModal = React.useCallback(() => {
    setCreationFlow('idle'); // Cierra el modal y resetea el flujo
    setStashedTicketData(null); // Limpia datos guardados
  }, []);

  const handleTicketFormCompletion = React.useCallback((newTicket: Ticket | undefined, formData?: FormData, error?: string) => {
    if (newTicket) {
      setCreationFlow('success'); // Transición a la vista de éxito
      refreshTickets();
      setSelectedTicket(newTicket); // Selecciona inmediatamente el nuevo ticket
      setNewlyCreatedTicketId(newTicket.id); // Marca para resaltar
      
      // Cierra el modal después de que la animación de éxito se muestre
      setTimeout(() => {
        handleCloseCreateModal();
      }, MODAL_SUCCESS_DISPLAY_DURATION);

    } else {
      // Si hay error, guardamos los datos del formulario para poder reintentar
      if (formData) {
        setStashedTicketData(formData);
      }
      setCreationFlow('error'); // Transición a la vista de error
    }
  }, [refreshTickets, handleCloseCreateModal]);
  
  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    if (!isDesktop) {
      setIsSheetOpen(true);
    }
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
  };
  
  const handleClearFilters = () => {
    setSearchText('');
    setEstadoFilter('all');
    setPrioridadFilter('all');
    setDebouncedSearchText('');
  };

  // --- EFECTOS ---

  // Efecto para debounce de la búsqueda de texto
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchText(searchText), 500);
    return () => clearTimeout(handler);
  }, [searchText]);

  // Efecto para aplicar filtros
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

  // Efecto para el tiempo mínimo del skeleton de filtros
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
  
  // Efecto para el resaltado del nuevo ticket en la lista
  React.useEffect(() => {
    if (newlyCreatedTicketId) {
      const timer = setTimeout(() => {
        setNewlyCreatedTicketId(null);
      }, NEW_TICKET_HIGHLIGHT_DURATION);
      return () => clearTimeout(timer);
    }
  }, [newlyCreatedTicketId]);

  // Efecto para manejar el panel lateral en móvil
  React.useEffect(() => {
    if (!isDesktop && selectedTicket) {
      setIsSheetOpen(true);
    } else if (isDesktop) {
      setIsSheetOpen(false);
    }
  }, [selectedTicket, isDesktop]);

  // --- RENDERIZADO ---

  if (isLoading && !tickets.length && !fetchTicketsError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p>Cargando tickets...</p>
      </div>
    );
  }

  if (fetchTicketsError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-red-600 dark:text-red-400">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p className="mb-1 text-center">Error al cargar los tickets.</p>
        <p className="text-xs text-center mb-3">{fetchTicketsError}</p>
        <Button onClick={refreshTickets} variant="default" size="sm">Reintentar</Button>
      </div>
    );
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
            {/* Controles de filtro... */}
             <div className="space-y-1.5">
              <Label htmlFor="searchText">Buscar por texto</Label>
              <Input
                id="searchText"
                type="text"
                placeholder="Título, Descripción, Empresa..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="h-9"
              />
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
          <SelectedTicketPanel
            selectedTicket={selectedTicket}
            onTicketUpdated={handleTicketUpdated}
            headerAndPagePaddingOffset={HEADER_AND_PAGE_PADDING_OFFSET}
          />
        </div>
      )}

      {/* Panel de Detalles (Móvil) */}
      {!isDesktop && (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent side="right" className="w-[90vw] sm:w-[75vw] p-0 flex flex-col">
            {selectedTicket && (
              <>
                <SheetHeader className="p-4 border-b flex-row justify-between items-center">
                   <div>
                    <SheetTitle>Ticket #{selectedTicket.numeroCaso}</SheetTitle>
                    <SheetDescription className="sr-only">Detalles del ticket.</SheetDescription>
                  </div>
                   <SheetClose asChild><Button variant="ghost" size="icon"><CloseIcon className="h-5 w-5" /></Button></SheetClose>
                </SheetHeader>
                <div className="flex-grow overflow-y-auto">
                  <SelectedTicketPanel selectedTicket={selectedTicket} onTicketUpdated={handleTicketUpdated} headerAndPagePaddingOffset="0px" />
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      )}

      {/* Modal de Creación */}
      <TicketModal
        isOpen={creationFlow !== 'idle'}
        flowStatus={creationFlow}
        onClose={handleCloseCreateModal}
        onCompletion={handleTicketFormCompletion}
        nextNroCaso={nextTicketNumber}
        empresasClientes={empresasClientes}
        ubicacionesDisponibles={ubicacionesDisponibles}
        stashedData={stashedTicketData}
        onRetry={() => setCreationFlow('form')}
      />
    </div>
  );
}
