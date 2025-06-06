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

// Interfaces para los datos que esperamos (deben coincidir con los de page.tsx y TicketModal.tsx)
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

const HEADER_AND_PAGE_PADDING_OFFSET = '100px';
const MIN_SKELETON_DISPLAY_TIME = 500; // Milisegundos que el skeleton debe mostrarse como mínimo

export default function TicketCard({ empresasClientes, ubicacionesDisponibles }: TicketCardProps) {
  const {
    tickets,
    setTickets, // Added setTickets to directly manipulate the list
    isLoading, 
    error: fetchTicketsError,
    refreshTickets,
    applyFilters,
    currentFilters, // Expose current active filters from the hook
  } = useTickets();

  const [selectedTicket, setSelectedTicket] = React.useState<Ticket | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [nextTicketNumber, setNextTicketNumber] = React.useState(0);

  const [searchText, setSearchText] = React.useState(currentFilters.searchText || '');
  const [estadoFilter, setEstadoFilter] = React.useState<EstadoTicket | 'all'>(currentFilters.estado as EstadoTicket || 'all'); 
  const [prioridadFilter, setPrioridadFilter] = React.useState<PrioridadTicket | 'all'>(currentFilters.prioridad as PrioridadTicket || 'all');

  const [debouncedSearchText, setDebouncedSearchText] = React.useState(searchText);

  // Explicit state to control skeleton visibility for filtering
  const [showFilterSkeleton, setShowFilterSkeleton] = React.useState(false); 
  // Reference to store the start time of a filter-induced loading, for minimum display time
  const filterStartTimeRef = React.useRef<number | null>(null);

  // New state to manage the ID of the newly created ticket for animation purposes
  const [newlyCreatedTicketId, setNewlyCreatedTicketId] = React.useState<string | null>(null);

  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Effect for debouncing search text
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 500); 
    return () => {
      clearTimeout(handler);
    };
  }, [searchText]);

  // Effect for applying filters (triggered by debouncedSearchText, estadoFilter, prioridadFilter changes)
  React.useEffect(() => {
    const newFilters: TicketFilters = {
      searchText: debouncedSearchText.trim() || undefined, // Use undefined for empty string
      estado: estadoFilter === 'all' ? undefined : estadoFilter,
      prioridad: prioridadFilter === 'all' ? undefined : prioridadFilter,
    };

    // Deep compare current values with new values to avoid unnecessary filter application
    const areFiltersTrulyDifferent = 
      (newFilters.searchText !== currentFilters.searchText) ||
      (newFilters.estado !== currentFilters.estado) ||
      (newFilters.prioridad !== currentFilters.prioridad);

    // Determine if the *new* filter state is completely "empty"
    const isNewStateCompletelyEmpty = !newFilters.searchText && !newFilters.estado && !newFilters.prioridad;
    // Determine if the *current active* filter state is completely "empty"
    const isCurrentStateCompletelyEmpty = !currentFilters.searchText && !currentFilters.estado && !currentFilters.prioridad;


    if (areFiltersTrulyDifferent) {
      setSelectedTicket(null); 

      // Condition for showing skeleton:
      // Show skeleton if it's NOT a transition from a non-empty state TO a completely empty state
      // (meaning, if we are clearing ALL filters back to the initial default state, don't show skeleton)
      // Otherwise, show skeleton.
      const shouldShowSkeleton = !(isNewStateCompletelyEmpty && !isCurrentStateCompletelyEmpty);

      if (shouldShowSkeleton) {
        filterStartTimeRef.current = Date.now();
        setShowFilterSkeleton(true);
      } else {
        // If clearing all filters to empty state, ensure skeleton is explicitly hidden immediately
        setShowFilterSkeleton(false);
        filterStartTimeRef.current = null; // Clear ref if not showing skeleton
      }
      
      applyFilters(newFilters);
    }
  }, [debouncedSearchText, estadoFilter, prioridadFilter, applyFilters, currentFilters]); // Added currentFilters to dependencies for comparison

  // Effect to manage minimum skeleton display time and hide it once data is loaded
  React.useEffect(() => {
    if (isLoading) {
      // If loading starts due to a filter change or initial load, set skeleton to true
      // and record the start time if not already recorded by filter change logic.
      if (filterStartTimeRef.current === null) { // Only set if not already set by filter useEffect
         filterStartTimeRef.current = Date.now();
         setShowFilterSkeleton(true);
      }
    } else {
      // When data loading completes
      const elapsed = Date.now() - (filterStartTimeRef.current || 0);
      if (filterStartTimeRef.current && elapsed < MIN_SKELETON_DISPLAY_TIME) {
        const remainingTime = MIN_SKELETON_DISPLAY_TIME - elapsed;
        const timer = setTimeout(() => {
          setShowFilterSkeleton(false);
          filterStartTimeRef.current = null;
        }, remainingTime);
        return () => clearTimeout(timer);
      } else {
        // If minimum time passed or no filter-induced skeleton was active, hide immediately
        setShowFilterSkeleton(false);
        filterStartTimeRef.current = null;
      }
    }
  }, [isLoading]); // Only depends on isLoading to react to fetch state changes


  React.useEffect(() => {
    if (!isDesktop && selectedTicket) {
      setIsSheetOpen(true);
    } else if (isDesktop) {
      setIsSheetOpen(false);
    }
  }, [selectedTicket, isDesktop]);

  React.useEffect(() => {
    // Sync local filter states with currentFilters from hook after refresh or external changes
    setSearchText(currentFilters.searchText || '');
    setEstadoFilter(currentFilters.estado as EstadoTicket || 'all'); 
    setPrioridadFilter(currentFilters.prioridad as PrioridadTicket || 'all');
  }, [currentFilters]);

  React.useEffect(() => {
    const fetchNextTicketNumber = async () => {
      try {
        const lastNro = await loadLastTicketNro();
        setNextTicketNumber(lastNro + 1);
      } catch (err) {
        console.error("Error al cargar el siguiente número de ticket:", err);
      }
    };
    // Fetch next ticket number if modal is open or if tickets are empty and not loading from a filter
    if (isCreateModalOpen || (tickets && tickets.length === 0 && !isLoading && !fetchTicketsError && !showFilterSkeleton)) { 
      fetchNextTicketNumber();
    }
  }, [isCreateModalOpen, tickets, isLoading, fetchTicketsError, showFilterSkeleton]);

  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    if (!isDesktop) {
      setIsSheetOpen(true);
    }
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
  };

  const handleTicketUpdated = React.useCallback((updatedTicket: Ticket) => {
    setTickets(prevTickets =>
      prevTickets.map(t => (t.id === updatedTicket.id ? updatedTicket : t))
    );
    if (selectedTicket?.id === updatedTicket.id) {
      setSelectedTicket(updatedTicket);
    }
  }, [selectedTicket, setTickets]);

  // Handler for explicit filter button click (e.g., "Clear Filters" or a hypothetical "Apply Filter" button)
  // This will trigger the filter logic in the main useEffect.
  const handleTriggerFilter = () => {
    // Explicitly update debouncedSearchText to trigger the main useEffect for filters
    setDebouncedSearchText(searchText); 
  };


  const handleClearFilters = () => {
    setSearchText('');
    setEstadoFilter('all');
    setPrioridadFilter('all');
    
    // Explicitly set debounced search text to empty string.
    // This will trigger the main useEffect, which handles the skeleton logic
    // based on the `isNewStateCompletelyEmpty` and `isCurrentStateCompletelyEmpty` checks.
    setDebouncedSearchText(''); 
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };
  
  // MODIFIED: Accepts the newly created ticket
  const handleFormSubmitSuccessInModal = React.useCallback((newTicket?: Ticket) => {
    handleCloseCreateModal();
    if (newTicket) {
      // Add the new ticket to the existing list immediately for smooth animation
      // We assume new tickets should appear at the top.
      setTickets(prevTickets => [newTicket, ...prevTickets]);
      setNewlyCreatedTicketId(newTicket.id); // Set the ID for the animation
      
      // Clear the animation ID and then refresh tickets from server
      // This ensures data consistency without a jarring immediate refresh.
      const timer = setTimeout(() => {
        setNewlyCreatedTicketId(null);
        refreshTickets(); // Now refresh to get any other new tickets/changes
      }, 1000); // Highlight for 1 second
      return () => clearTimeout(timer);
    } else {
      // If no new ticket is returned (shouldn't happen with current action), just refresh
      refreshTickets();
    }
  }, [setTickets, refreshTickets]);


  const validTickets = React.useMemo(() => {
    if (!tickets) return [];
    return tickets.filter(t => t && t.fechaCreacion); 
  }, [tickets]);


  // Only show initial loader if it's the very first load and no tickets are present,
  // and no filter skeleton is active from previous filter actions.
  if (isLoading && tickets.length === 0 && !fetchTicketsError && !showFilterSkeleton && newlyCreatedTicketId === null) { 
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
        <p className="mb-1 text-center">Error al cargar los tickets:</p>
        <p className="text-xs text-center mb-3">{fetchTicketsError}</p>
        <Button 
          onClick={refreshTickets} 
          variant="default"
          size="sm"
          className="px-4 py-2 text-sm"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row flex-grow h-full p-1 sm:p-4 gap-4">
      <div className={`flex flex-col h-full overflow-hidden ${isDesktop ? 'md:w-[calc(65%-0.5rem)] lg:w-[calc(70%-0.5rem)]' : 'w-full'}`}>
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
              <Input
                id="searchText"
                type="text"
                placeholder="Título, Descripción, Empresa, Contacto, Técnico..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="estadoFilter">Estado</Label>
              <Select value={estadoFilter} onValueChange={(value: EstadoTicket | 'all') => setEstadoFilter(value)}>
                <SelectTrigger id="estadoFilter" className="h-9">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value={EstadoTicket.ABIERTO}>Abierto</SelectItem>
                  <SelectItem value={EstadoTicket.EN_PROGRESO}>En Progreso</SelectItem>
                  <SelectItem value={EstadoTicket.PENDIENTE_TERCERO}>Pendiente (Tercero)</SelectItem>
                  <SelectItem value={EstadoTicket.PENDIENTE_CLIENTE}>Pendiente (Cliente)</SelectItem>
                  <SelectItem value={EstadoTicket.RESUELTO}>Resuelto</SelectItem>
                  <SelectItem value={EstadoTicket.CERRADO}>Cerrado</SelectItem>
                  <SelectItem value={EstadoTicket.CANCELADO}>Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prioridadFilter">Prioridad</Label>
              <Select value={prioridadFilter} onValueChange={(value: PrioridadTicket | 'all') => setPrioridadFilter(value)}>
                <SelectTrigger id="prioridadFilter" className="h-9">
                  <SelectValue placeholder="Todas las prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las prioridades</SelectItem>
                  <SelectItem value={PrioridadTicket.BAJA}>BAJA</SelectItem>
                  <SelectItem value={PrioridadTicket.MEDIA}>MEDIA</SelectItem>
                  <SelectItem value={PrioridadTicket.ALTA}>ALTA</SelectItem>
                  <SelectItem value={PrioridadTicket.URGENTE}>URGENTE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Limpiar Filtros
            </Button>
            {/* The "Buscar Tickets" button is not needed if filtering is debounced/real-time */}
            {/* <Button size="sm" onClick={handleTriggerFilter}> 
              <SearchIcon className="h-4 w-4 mr-2" />
              Buscar Tickets
            </Button> */}
          </div>
        </div>

        <div 
          className="flex-grow overflow-y-auto space-y-2 pb-4 md:pr-2" 
          style={{ maxHeight: `calc(100vh - ${HEADER_AND_PAGE_PADDING_OFFSET} - 160px)` }}
        >
          {showFilterSkeleton || (isLoading && filterStartTimeRef.current !== null) ? ( 
            Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-32 w-full rounded-lg mb-3" />
            ))
          ) : (
            validTickets.length > 0 ? (
              validTickets.map((ticket) => ( 
                <SingleTicketItemCard
                  key={ticket.id}
                  ticket={ticket} 
                  onSelectTicket={handleSelectTicket}
                  onTicketUpdatedInList={handleTicketUpdated}
                  isSelected={selectedTicket?.id === ticket.id && isDesktop} 
                  isNew={newlyCreatedTicketId === ticket.id} // Pass new prop for animation
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                <p>No hay tickets para mostrar con los filtros actuales o algunos tickets tienen datos incompletos.</p>
              </div>
            )
          )}
        </div>
      </div>

      {isDesktop && ( 
        <div 
          className="shadow-lg rounded-lg sticky top-4 flex-shrink-0 md:w-[35%] lg:w-[30%]"
          style={{ height: `calc(100vh - ${HEADER_AND_PAGE_PADDING_OFFSET})`, maxHeight: `calc(100vh - ${HEADER_AND_PAGE_PADDING_OFFSET})` }}
        >
          <SelectedTicketPanel
            selectedTicket={selectedTicket} 
            onTicketUpdated={handleTicketUpdated}
            headerAndPagePaddingOffset={HEADER_AND_PAGE_PADDING_OFFSET}
          />
        </div>
      )}

      {!isDesktop && (
        <Sheet open={isSheetOpen} onOpenChange={(open) => {
          if (!open) {
            handleCloseSheet();
          } else {
            setIsSheetOpen(true);
          }
        }}>
          <SheetContent side="right" className="w-[90vw] sm:w-[75vw] p-0 flex flex-col">
            {selectedTicket && ( 
              <>
                <SheetHeader className="p-4 border-b flex-row justify-between items-center">
                  <div>
                    <SheetTitle>Detalles del Ticket #{selectedTicket.numeroCaso}</SheetTitle>
                    <SheetDescription className="sr-only">
                      Información y bitácora del ticket seleccionado.
                    </SheetDescription>
                  </div>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" aria-label="Cerrar panel de detalles">
                      <CloseIcon className="h-5 w-5" />
                    </Button>
                  </SheetClose>
                </SheetHeader> 
                <div className="flex-grow overflow-y-auto">
                  {selectedTicket && typeof selectedTicket.fechaCreacion === 'object' ? (
                    <SelectedTicketPanel
                      selectedTicket={selectedTicket} 
                      onTicketUpdated={handleTicketUpdated}
                      headerAndPagePaddingOffset="0px"
                    />
                  ) : (
                    <div className="p-4 text-sm text-muted-foreground">Cargando detalles o datos incompletos...</div>
                  )}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      )}

      <TicketModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        nextNroCaso={nextTicketNumber}
        onFormSubmitSuccess={handleFormSubmitSuccessInModal} // Pass the modified handler
        empresasClientes={empresasClientes} 
        ubicacionesDisponibles={ubicacionesDisponibles} 
      />
    </div>
  );
}
