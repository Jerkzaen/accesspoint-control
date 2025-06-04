// src/components/TicketCard.tsx
'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
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

const HEADER_AND_PAGE_PADDING_OFFSET = '100px';

export default function TicketCard() {
  const {
    tickets, // Este es el array original de tickets
    setTickets,
    isLoading,
    error: fetchTicketsError,
    refreshTickets,
    applyFilters,
    currentFilters,
  } = useTickets();

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [nextTicketNumber, setNextTicketNumber] = useState(0);

  const [searchText, setSearchText] = useState(currentFilters.searchText || '');
  const [estadoFilter, setEstadoFilter] = useState(currentFilters.estado || 'all');
  const [prioridadFilter, setPrioridadFilter] = useState(currentFilters.prioridad || 'all');

  const isDesktop = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    if (!isDesktop && selectedTicket) {
      setIsSheetOpen(true);
    } else if (isDesktop) {
      setIsSheetOpen(false);
    }
  }, [selectedTicket, isDesktop]);

  useEffect(() => {
    setSearchText(currentFilters.searchText || '');
    setEstadoFilter(currentFilters.estado || 'all'); 
    setPrioridadFilter(currentFilters.prioridad || 'all');
  }, [currentFilters]);

  useEffect(() => {
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

  const handleTicketUpdated = useCallback((updatedTicket: Ticket) => {
    setTickets(prevTickets =>
      prevTickets.map(t => (t.id === updatedTicket.id ? updatedTicket : t))
    );
    if (selectedTicket?.id === updatedTicket.id) {
      setSelectedTicket(updatedTicket);
    }
  }, [selectedTicket, setTickets]);

  const handleApplyFilters = () => {
    applyFilters({
      searchText: searchText.trim(),
      estado: estadoFilter === 'all' ? undefined : estadoFilter,
      prioridad: prioridadFilter === 'all' ? undefined : prioridadFilter,
    });
  };

  const handleClearFilters = () => {
    setSearchText('');
    setEstadoFilter('all');
    setPrioridadFilter('all');
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
  // Esto es una medida defensiva. El problema principal debería ser atajado
  // por la guarda dentro de SingleTicketItemCard o en la fuente de datos (API/useTickets).
  // Si la línea 34 de ESTE archivo (TicketCard.tsx) es la que da error,
  // significa que 'ticket.fechaCreacion' se usa ANTES de este map,
  // posiblemente con 'selectedTicket'.
  const validTickets = React.useMemo(() => {
    if (!tickets) return [];
    return tickets.filter(t => t && typeof t.fechaCreacion === 'string' && t.fechaCreacion.trim() !== '');
  }, [tickets]);

  // Si el error está en la línea 34 de ESTE archivo (TicketCard.tsx)
  // y esa línea es "const fechaCreacionDate = new Date(ticket.fechaCreacion)...",
  // entonces necesitas una guarda para el 'ticket' que se esté usando en ESE CONTEXTO.
  // Por ejemplo, si fuera para selectedTicket:
  // let selectedTicketFechaCreacionFormatted = 'N/A';
  // if (selectedTicket && typeof selectedTicket.fechaCreacion === 'string') {
  //   try {
  //      selectedTicketFechaCreacionFormatted = new Date(selectedTicket.fechaCreacion).toLocaleString('es-CL', {...});
  //   } catch (e) { console.error("Error formateando fecha de selectedTicket", e); }
  // }
  // Y luego usar selectedTicketFechaCreacionFormatted.
  // Como no sé exactamente dónde está esa línea 34 en tu versión actual de TicketCard.tsx,
  // el filtro de 'validTickets' es la medida más general que puedo aplicar aquí.

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
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger id="estadoFilter" className="h-9">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="Abierto">Abierto</SelectItem>
                  <SelectItem value="En Progreso">En Progreso</SelectItem>
                  <SelectItem value="Cerrado">Cerrado</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prioridadFilter">Prioridad</Label>
              <Select value={prioridadFilter} onValueChange={setPrioridadFilter}>
                <SelectTrigger id="prioridadFilter" className="h-9">
                  <SelectValue placeholder="Todas las prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las prioridades</SelectItem>
                  <SelectItem value="baja">BAJA</SelectItem>
                  <SelectItem value="media">MEDIA</SelectItem>
                  <SelectItem value="alta">ALTA</SelectItem>
                  <SelectItem value="urgente">URGENTE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Limpiar Filtros
            </Button>
            <Button size="sm" onClick={handleApplyFilters}>
              <SearchIcon className="h-4 w-4 mr-2" />
              Buscar Tickets
            </Button>
          </div>
        </div>

        <div 
          className="flex-grow overflow-y-auto space-y-2 pb-4 md:pr-2" 
          style={{ maxHeight: `calc(100vh - ${HEADER_AND_PAGE_PADDING_OFFSET} - 160px)` }}
        >
          {/* Se mapea sobre 'validTickets' en lugar de 'tickets' */}
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

      {isDesktop ? (
        selectedTicket && ( 
          <div 
            className="shadow-lg rounded-lg sticky top-4 flex-shrink-0 md:w-[35%] lg:w-[30%]"
          >
            <SelectedTicketPanel
              selectedTicket={selectedTicket} 
              onTicketUpdated={handleTicketUpdated}
              headerAndPagePaddingOffset={HEADER_AND_PAGE_PADDING_OFFSET}
            />
          </div>
        )
      ) : (
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
                  {selectedTicket && typeof selectedTicket.fechaCreacion === 'string' ? (
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
        onFormSubmitSuccess={handleFormSubmitSuccessInModal}
      />
    </div>
  );
}
