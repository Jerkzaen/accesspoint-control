// src/components/TicketCard.tsx (ACTUALIZADO)
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
import { AlertTriangle, Loader2, X as CloseIcon, Search as SearchIcon, Filter as FilterIcon } from 'lucide-react'; // Importar SearchIcon y FilterIcon
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Importar Input
import { Label } from '@/components/ui/label'; // Importar Label
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Importar Select
import { useTickets, TicketFilters } from '@/hooks/useTickets'; // Importar TicketFilters

const HEADER_AND_PAGE_PADDING_OFFSET = '100px';

export default function TicketCard() {
  const {
    tickets,
    setTickets,
    isLoading,
    error: fetchTicketsError,
    refreshTickets,
    applyFilters, // Nuevo: para aplicar filtros
    currentFilters, // Nuevo: para acceder a los filtros actuales
  } = useTickets();

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Estados locales para los filtros de búsqueda
  // Inicializar con "all" si el filtro actual es vacío, para que el Select muestre la opción "Todos"
  const [searchText, setSearchText] = useState(currentFilters.searchText || '');
  const [estadoFilter, setEstadoFilter] = useState(currentFilters.estado || 'all'); // Cambiado a 'all'
  const [prioridadFilter, setPrioridadFilter] = useState(currentFilters.prioridad || 'all'); // Cambiado a 'all'

  const isDesktop = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    if (!isDesktop && selectedTicket) {
      setIsSheetOpen(true);
    } else if (isDesktop) {
      setIsSheetOpen(false);
    }
  }, [selectedTicket, isDesktop]);

  // Sincronizar los estados locales de los filtros con `currentFilters` del hook
  useEffect(() => {
    setSearchText(currentFilters.searchText || '');
    // Si currentFilters.estado es vacío, establecer estadoFilter a "all" para que el Select lo muestre
    setEstadoFilter(currentFilters.estado || 'all'); 
    setPrioridadFilter(currentFilters.prioridad || 'all');
  }, [currentFilters]);

  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    if (!isDesktop) {
      setIsSheetOpen(true);
    }
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
  };

  const handleTicketUpdated = (updatedTicket: Ticket) => {
    setTickets(prevTickets =>
      prevTickets.map(t => (t.id === updatedTicket.id ? updatedTicket : t))
    );
    if (selectedTicket?.id === updatedTicket.id) {
      setSelectedTicket(updatedTicket);
    }
  };

  // Función para aplicar los filtros cuando se hace clic en el botón
  const handleApplyFilters = () => {
    applyFilters({
      searchText: searchText.trim(),
      // Si estadoFilter es "all", enviar una cadena vacía para que la API lo ignore
      estado: estadoFilter === 'all' ? '' : estadoFilter,
      prioridad: prioridadFilter === 'all' ? '' : prioridadFilter,
    });
  };

  // Función para limpiar los filtros
  const handleClearFilters = () => {
    setSearchText('');
    setEstadoFilter('all'); // Restablecer a 'all' para que el Select muestre la opción "Todos"
    setPrioridadFilter('all'); // Restablecer a 'all'
    applyFilters({}); // Aplicar filtros vacíos para recargar sin filtros
  };

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
      <div 
        className={`flex-grow overflow-y-auto md:pr-2 space-y-2 w-full ${isDesktop ? 'md:w-[calc(65%-0.5rem)] lg:w-[calc(70%-0.5rem)]' : 'md:w-full'}`}
        style={{ maxHeight: `calc(100vh - ${HEADER_AND_PAGE_PADDING_OFFSET})` }} 
      >
        {/* Controles de filtro */}
        <div className="bg-card p-4 rounded-lg shadow-sm mb-4">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FilterIcon className="h-5 w-5 text-primary" />
            Filtros de Búsqueda
          </h2>
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
                  {/* Cambiado value a "all" */}
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
                  {/* Cambiado value a "all" */}
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

        {/* Lista de tickets */}
        {tickets.length > 0 ? (
          tickets.map((ticket) => ( 
            <SingleTicketItemCard
              key={ticket.id}
              ticket={ticket} 
              onSelectTicket={handleSelectTicket}
              isSelected={selectedTicket?.id === ticket.id && isDesktop} 
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>No hay tickets para mostrar con los filtros actuales.</p>
          </div>
        )}
      </div>

      {isDesktop ? (
        selectedTicket && ( 
          <div 
            className="shadow-lg rounded-lg sticky top-4 flex-shrink-0 md:w-[35%] lg:w-[30%]"
            style={{ maxHeight: `calc(100vh - ${HEADER_AND_PAGE_PADDING_OFFSET})`, overflowY: 'hidden' }}
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
                  <SelectedTicketPanel
                    selectedTicket={selectedTicket} 
                    onTicketUpdated={handleTicketUpdated}
                    headerAndPagePaddingOffset="0px" 
                  />
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
