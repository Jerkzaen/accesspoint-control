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
import { AlertTriangle, Loader2, X as CloseIcon, Search as SearchIcon, Filter as FilterIcon, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTickets, TicketFilters } from '@/hooks/useTickets';
import { TicketModal } from './TicketModal';
import { loadLastTicketNro } from '@/app/actions/ticketActions';
// Importar los enums de Prisma
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

export default function TicketCard({ empresasClientes, ubicacionesDisponibles }: TicketCardProps) {
  // Desestructurar propiedades de useTickets()
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
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [nextTicketNumber, setNextTicketNumber] = React.useState(0);

  const [searchText, setSearchText] = React.useState(currentFilters.searchText || '');
  const [estadoFilter, setEstadoFilter] = React.useState<EstadoTicket | 'all'>(currentFilters.estado as EstadoTicket || 'all'); 
  const [prioridadFilter, setPrioridadFilter] = React.useState<PrioridadTicket | 'all'>(currentFilters.prioridad as PrioridadTicket || 'all');

  // Estado para el texto de búsqueda con debounce
  const [debouncedSearchText, setDebouncedSearchText] = React.useState(searchText);

  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Efecto para aplicar debounce al searchText
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 500); // Retraso de 500ms

    return () => {
      clearTimeout(handler);
    };
  }, [searchText]); // Solo se ejecuta cuando searchText cambia

  // Efecto para aplicar filtros cuando el texto de búsqueda debounced cambia
  React.useEffect(() => {
    // Solo aplicar filtro si el texto debounced es diferente al actual, o si es la carga inicial
    // y también, si los filtros cambian, deseleccionar cualquier ticket si ya no aplica
    if (debouncedSearchText !== currentFilters.searchText || 
        estadoFilter !== (currentFilters.estado as EstadoTicket || 'all') || 
        prioridadFilter !== (currentFilters.prioridad as PrioridadTicket || 'all')) {
      
      applyFilters({
        searchText: debouncedSearchText.trim(),
        estado: estadoFilter === 'all' ? undefined : estadoFilter,
        prioridad: prioridadFilter === 'all' ? undefined : prioridadFilter,
      });
      // Importante: Deseleccionar el ticket si los filtros cambian para que el panel derecho
      // muestre el mensaje de "selecciona un ticket".
      setSelectedTicket(null); 
    }
  }, [debouncedSearchText, applyFilters, estadoFilter, prioridadFilter, currentFilters.searchText, currentFilters.estado, currentFilters.prioridad]);


  React.useEffect(() => {
    if (!isDesktop && selectedTicket) {
      setIsSheetOpen(true);
    } else if (isDesktop) {
      setIsSheetOpen(false);
    }
  }, [selectedTicket, isDesktop]);

  React.useEffect(() => {
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
    if (isCreateModalOpen || (tickets && tickets.length === 0)) { // Verificación adicional para tickets
      fetchNextTicketNumber();
    }
  }, [isCreateModalOpen, tickets]);

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
    // Si el ticket actualizado es el que está seleccionado, actualiza también el estado de selectedTicket
    if (selectedTicket?.id === updatedTicket.id) {
      setSelectedTicket(updatedTicket);
    }
  }, [selectedTicket, setTickets]);

  const handleApplyFilters = () => {
    // Si se hace clic en el botón, el debounce se ignora para esta acción
    applyFilters({
      searchText: searchText.trim(),
      estado: estadoFilter === 'all' ? undefined : estadoFilter,
      prioridad: prioridadFilter === 'all' ? undefined : prioridadFilter,
    });
    setDebouncedSearchText(searchText); // Sincroniza el debounced con el searchText actual inmediatamente
  };

  const handleClearFilters = () => {
    setSearchText('');
    setEstadoFilter('all');
    setPrioridadFilter('all');
    // Actualizar también el debounced para que el filtro se aplique
    setDebouncedSearchText(''); 
    applyFilters({});
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };
  
  const handleFormSubmitSuccessInModal = () => {
    handleCloseCreateModal();
    refreshTickets();
  };

  // Filtrar tickets para asegurar que tienen fechaCreacion antes de mapear
  const validTickets = React.useMemo(() => {
    if (!tickets) return [];
    return tickets.filter(t => t && t.fechaCreacion); 
  }, [tickets]);


  if (isLoading) {
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
            {/* Se elimina el botón de búsqueda explícita si la búsqueda es en tiempo real */}
            {/* <Button size="sm" onClick={handleApplyFilters}>
              <SearchIcon className="h-4 w-4 mr-2" />
              Buscar Tickets
            </Button> */}
          </div>
        </div>

        <div 
          className="flex-grow overflow-y-auto space-y-2 pb-4 md:pr-2" 
          style={{ maxHeight: `calc(100vh - ${HEADER_AND_PAGE_PADDING_OFFSET} - 160px)` }}
        >
          {validTickets.length > 0 ? (
            validTickets.map((ticket) => ( 
              <SingleTicketItemCard
                key={ticket.id}
                ticket={ticket} 
                onSelectTicket={handleSelectTicket}
                onTicketUpdatedInList={handleTicketUpdated}
                isSelected={selectedTicket?.id === ticket.id && isDesktop} 
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
              <p>No hay tickets para mostrar con los filtros actuales o algunos tickets tienen datos incompletos.</p>
            </div>
          )}
        </div>
      </div>

      {/* Condición para renderizar el panel derecho en desktop, SIEMPRE */}
      {isDesktop && ( 
        <div 
          className="shadow-lg rounded-lg sticky top-4 flex-shrink-0 md:w-[35%] lg:w-[30%]"
          style={{ height: `calc(100vh - ${HEADER_AND_PAGE_PADDING_OFFSET})`, maxHeight: `calc(100vh - ${HEADER_AND_PAGE_PADDING_OFFSET})` }}
        >
          {/* SelectedTicketPanel se encarga de mostrar el mensaje si selectedTicket es null */}
          <SelectedTicketPanel
            selectedTicket={selectedTicket} 
            onTicketUpdated={handleTicketUpdated}
            headerAndPagePaddingOffset={HEADER_AND_PAGE_PADDING_OFFSET}
          />
        </div>
      )}

      {/* Sheet para vista móvil (sin cambios, aún se basa en selectedTicket para abrirse) */}
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
                  {/* Asegurarse de que selectedTicket es válido antes de pasarlo */}
                  {selectedTicket && typeof selectedTicket.fechaCreacion === 'object' ? ( // 'Date' es un objeto
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

      {/* Actualización del componente TicketModal para recibir las props */}
      <TicketModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        nextNroCaso={nextTicketNumber}
        onFormSubmitSuccess={handleFormSubmitSuccessInModal}
        empresasClientes={empresasClientes} // Pasa la prop empresasClientes
        ubicacionesDisponibles={ubicacionesDisponibles} // Pasa la prop ubicacionesDisponibles
      />
    </div>
  );
}
