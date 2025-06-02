// src/components/TicketCard.tsx
'use client';

import * as React from 'react'; // Asegúrate de tener esta importación
import { useState, useEffect } from 'react';
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
  SheetClose, // Para un botón de cierre opcional dentro del Sheet
} from '@/components/ui/sheet'; // Cambiado de Drawer a Sheet
import { AlertTriangle, Loader2, X as CloseIcon } from 'lucide-react'; // X para el botón de cierre
import { Button } from './ui/button';

// Asumiendo que tienes un hook useTickets. Si no, necesitas importarlo o definirlo.
// import { useTickets } from '@/hooks/useTickets'; 

const HEADER_AND_PAGE_PADDING_OFFSET = '100px'; // Ajusta según tu layout

export default function TicketCard() {
  // Asegúrate de que useTickets esté disponible. Si no, descomenta la importación o usa el de abajo.
  const {
    tickets,
    setTickets, 
    isLoading,
    error: fetchTicketsError,
    refreshTickets, 
  } = useTickets(); 

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false); // Cambiado de isDrawerOpen a isSheetOpen

  const isDesktop = useMediaQuery('(min-width: 768px)'); // md breakpoint

  useEffect(() => {
    if (!isDesktop && selectedTicket) {
      setIsSheetOpen(true);
    } else if (isDesktop) { // Si cambiamos a desktop, cerramos el sheet
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
    // Opcional: Deseleccionar el ticket cuando el sheet se cierra para que no se reabra si se rota la pantalla
    // setSelectedTicket(null); 
  };

  const handleTicketUpdated = (updatedTicket: Ticket) => {
    setTickets(prevTickets =>
      prevTickets.map(t => (t.id === updatedTicket.id ? updatedTicket : t))
    );
    if (selectedTicket?.id === updatedTicket.id) {
      setSelectedTicket(updatedTicket);
    }
    // No cerramos el sheet automáticamente tras la actualización, el usuario puede querer seguir viendo/editando.
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
        <button 
          onClick={refreshTickets} 
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row flex-grow h-full p-1 sm:p-4 gap-4"> {/* Ajuste de padding y flex-direction */}
      {/* Columna de Tarjetas de Tickets */}
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

      {/* Panel Lateral para Detalles (Desktop) o Sheet (Móvil) */}
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
        // Vista Móvil: Sheet desde la derecha
        <Sheet open={isSheetOpen} onOpenChange={(open) => {
          if (!open) {
            handleCloseSheet();
          } else {
            setIsSheetOpen(true); // Asegurar que el estado se actualice si se abre por otros medios
          }
        }}>
          <SheetContent side="right" className="w-[90vw] sm:w-[75vw] p-0 flex flex-col"> {/* Ancho del Sheet y sin padding inicial */}
            {selectedTicket && ( // Solo renderizar el contenido si hay un ticket
              <>
                <SheetHeader className="p-4 border-b flex-row justify-between items-center">
                  <div>
                    <SheetTitle>Detalles del Ticket #{selectedTicket.nroCaso}</SheetTitle>
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
                <div className="flex-grow overflow-y-auto"> {/* Div para scroll interno */}
                  <SelectedTicketPanel
                    selectedTicket={selectedTicket}
                    onTicketUpdated={handleTicketUpdated}
                    // El offset aquí es relativo al Sheet, puede ser 0 si el panel ocupa todo
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

// --- Placeholder para useTickets ---
// Asegúrate de importar tu hook useTickets real
// import { useTickets } from '@/hooks/useTickets';
// Si no lo tienes, puedes usar este como base temporal:
function useTickets() {
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchTickets = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tickets'); // Ajusta tu endpoint
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: `Error HTTP: ${res.status}` }));
        throw new Error(errorData.message || `Error al cargar tickets: ${res.statusText}`);
      }
      const data: Ticket[] = await res.json();
      setTickets(data);
    } catch (err: any) {
      console.error("Error en fetchTickets:", err);
      setError(err.message || 'Ocurrió un error desconocido al cargar los tickets.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return { tickets, setTickets, isLoading, error, refreshTickets: fetchTickets };
}
// --- Fin Placeholder ---
