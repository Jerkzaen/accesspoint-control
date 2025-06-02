// src/components/TicketCard.tsx
'use client';

import { useState, useCallback } from 'react';
import SingleTicketItemCard from './SingleTicketItemCard';
import SelectedTicketPanel from './SelectedTicketPanel'; // Importamos el nuevo panel
import { useTickets } from '@/hooks/useTickets'; // Importamos el hook de tickets
import { Ticket } from '@/types/ticket';
import { AlertTriangle, Loader2 } from 'lucide-react'; // Para indicador de carga y error

// Este valor debe coincidir o ser calculado en base a la altura de tu Header y el padding de la página.
// Es el espacio vertical que NO está disponible para el contenido de las columnas.
const HEADER_AND_PAGE_PADDING_OFFSET = '100px'; // Ejemplo: 60px cabecera + 2rem (32px) padding de página arriba/abajo

export default function TicketCard() {
  const {
    tickets,
    setTickets, // La función para actualizar la lista de tickets
    isLoading,
    error: fetchTicketsError,
    refreshTickets, // Para recargar la lista si es necesario
  } = useTickets();

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Callback para manejar la actualización de un ticket desde SelectedTicketPanel
  const handleTicketUpdated = useCallback((updatedTicket: Ticket) => {
    // Actualizar el ticket en la lista local
    setTickets(prevTickets =>
      prevTickets.map(t => (t.id === updatedTicket.id ? updatedTicket : t))
    );
    // Actualizar el ticket seleccionado si es el mismo
    if (selectedTicket?.id === updatedTicket.id) {
      setSelectedTicket(updatedTicket);
    }
  }, [selectedTicket, setTickets]);

  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
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
    <div className="flex flex-grow flex-shrink flex-wrap h-full p-4 gap-4">
      {/* Columna de Tarjetas de Tickets */}
      <div
        className="flex-grow overflow-y-auto pr-2 space-y-2"
        style={{
          width: 'calc(70% - 0.5rem)', // 0.5rem es la mitad del gap-4 (1rem)
          maxHeight: `calc(100vh - ${HEADER_AND_PAGE_PADDING_OFFSET})`,
        }}
      >
        {tickets.length > 0 ? (
          tickets.map((ticket) => (
            <SingleTicketItemCard
              key={ticket.id}
              ticket={ticket}
              onSelectTicket={handleSelectTicket}
              isSelected={selectedTicket?.id === ticket.id}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>No hay tickets para mostrar.</p>
            {/* Podrías añadir un botón para crear un nuevo ticket aquí si es relevante */}
          </div>
        )}
      </div>

      {/* Panel Lateral para Detalles del Ticket Seleccionado y Acciones */}
      <SelectedTicketPanel
        selectedTicket={selectedTicket}
        onTicketUpdated={handleTicketUpdated}
        headerAndPagePaddingOffset={HEADER_AND_PAGE_PADDING_OFFSET}
      />
    </div>
  );
}