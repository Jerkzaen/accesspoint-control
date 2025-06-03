// src/components/TicketCard.tsx
'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import SingleTicketItemCard from './SingleTicketItemCard'; 
import SelectedTicketPanel from './SelectedTicketPanel';
import { Ticket } from '@/types/ticket'; // Esta interfaz ya tiene los nuevos nombres
import { useMediaQuery } from 'usehooks-ts';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet';
import { AlertTriangle, Loader2, X as CloseIcon } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Asegúrate que la ruta a ui/button es correcta

// Importa tu hook useTickets real desde su ubicación
import { useTickets } from '@/hooks/useTickets'; 

const HEADER_AND_PAGE_PADDING_OFFSET = '100px';

export default function TicketCard() {
  const {
    tickets,
    setTickets, 
    isLoading,
    error: fetchTicketsError,
    refreshTickets, 
  } = useTickets(); // Ahora usa el hook importado

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const isDesktop = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    if (!isDesktop && selectedTicket) {
      setIsSheetOpen(true);
    } else if (isDesktop) {
      setIsSheetOpen(false);
    }
  }, [selectedTicket, isDesktop]);

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
            <p>No hay tickets para mostrar.</p>
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
