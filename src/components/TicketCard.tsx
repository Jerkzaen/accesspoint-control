// src/components/TicketCard.tsx
'use client';

import { useState, useEffect } from 'react';
import SingleTicketItemCard from './SingleTicketItemCard'; 
import SelectedTicketPanel from './SelectedTicketPanel'; // Asumimos que este componente ya existe
import { Ticket } from '@/types/ticket'; 
import { useMediaQuery } from 'usehooks-ts'; // Para detectar el tamaño de pantalla
import {
  Drawer,
  DrawerContent,
  // DrawerTrigger, // No usaremos un trigger visible, se abrirá al seleccionar ticket
  // DrawerHeader, DrawerTitle, DrawerDescription, // Opcional si quieres un header en el drawer
} from '@/components/ui/drawer'; // Asegúrate que la ruta a ui/drawer sea correcta
import { AlertTriangle, Loader2 } from 'lucide-react';
import React from 'react';

const HEADER_AND_PAGE_PADDING_OFFSET = '100px'; 

export default function TicketCard() {
  const {
    tickets,
    setTickets, 
    isLoading,
    error: fetchTicketsError,
    refreshTickets, 
  } = useTickets(); // Asumiendo que useTickets está definido como antes

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isDesktop = useMediaQuery('(min-width: 768px)'); // md breakpoint

  useEffect(() => {
    // Si no estamos en desktop y se selecciona un ticket, abrir el drawer.
    // Si se deselecciona un ticket (o cambiamos a desktop), cerrar el drawer.
    if (!isDesktop && selectedTicket) {
      setIsDrawerOpen(true);
    } else {
      setIsDrawerOpen(false);
    }
  }, [selectedTicket, isDesktop]);

  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    if (!isDesktop) {
      setIsDrawerOpen(true);
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    // Opcionalmente, deseleccionar el ticket cuando el drawer se cierra
    // setSelectedTicket(null); 
  };

  const handleTicketUpdated = (updatedTicket: Ticket) => {
    setTickets(prevTickets =>
      prevTickets.map(t => (t.id === updatedTicket.id ? updatedTicket : t))
    );
    if (selectedTicket?.id === updatedTicket.id) {
      setSelectedTicket(updatedTicket);
    }
    // Podrías cerrar el drawer después de una actualización si es en móvil
    // if (!isDesktop) {
    //   setIsDrawerOpen(false);
    // }
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
    <div className="flex flex-grow flex-shrink flex-wrap h-full p-4 gap-4 md:flex-nowrap">
      {/* Columna de Tarjetas de Tickets */}
      <div 
        className={`flex-grow overflow-y-auto pr-2 space-y-2 ${isDesktop ? 'md:w-[calc(70%-0.5rem)]' : 'w-full'}`}
        style={{ maxHeight: `calc(100vh - ${HEADER_AND_PAGE_PADDING_OFFSET})` }} 
      >
        {tickets.length > 0 ? (
          tickets.map((ticket) => (
            <SingleTicketItemCard
              key={ticket.id}
              ticket={ticket}
              onSelectTicket={handleSelectTicket}
              isSelected={selectedTicket?.id === ticket.id && isDesktop} // Solo resaltar si está en desktop y visible
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>No hay tickets para mostrar.</p>
          </div>
        )}
      </div>

      {/* Panel Lateral para Detalles (Desktop) o Drawer (Móvil) */}
      {isDesktop ? (
        // Vista Desktop: Panel lateral fijo
        selectedTicket && ( // Solo mostrar si hay un ticket seleccionado
          <div 
            className="shadow-lg rounded-lg sticky top-4 flex-shrink-0 md:w-[30%]" // Asegurar que no se encoja
            style={{ maxHeight: `calc(100vh - ${HEADER_AND_PAGE_PADDING_OFFSET})`, overflowY: 'hidden' }}
          >
            <SelectedTicketPanel
              selectedTicket={selectedTicket}
              onTicketUpdated={handleTicketUpdated}
              headerAndPagePaddingOffset={HEADER_AND_PAGE_PADDING_OFFSET} // Pasar el offset
            />
          </div>
        )
      ) : (
        // Vista Móvil: Drawer
        <Drawer open={isDrawerOpen} onOpenChange={(open) => {
          if (!open) {
            handleCloseDrawer();
          } else {
            setIsDrawerOpen(true);
          }
        }}>
          {/* No necesitamos un DrawerTrigger visible aquí, se controla con isDrawerOpen */}
          <DrawerContent className="p-4 h-[85vh]"> {/* Altura del drawer */}
            {/* Podrías añadir un DrawerHeader aquí si lo deseas */}
            {/* <DrawerHeader><DrawerTitle>Detalles del Ticket</DrawerTitle></DrawerHeader> */}
            {selectedTicket && (
              <SelectedTicketPanel
                selectedTicket={selectedTicket}
                onTicketUpdated={handleTicketUpdated}
                // El offset aquí es relativo al drawer, podría ser menor o '0px'
                headerAndPagePaddingOffset="20px" // Ajusta según el padding del DrawerContent
              />
            )}
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}

// Asumiendo que tienes un hook useTickets similar a este:
function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = React.useCallback(async () => {
    // ... tu lógica de fetch ...
    // Ejemplo:
    setIsLoading(true);
    try {
      const res = await fetch('/api/tickets');
      if (!res.ok) throw new Error("Error al cargar tickets");
      const data = await res.json();
      setTickets(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return { tickets, setTickets, isLoading, error, refreshTickets: fetchTickets };
}

