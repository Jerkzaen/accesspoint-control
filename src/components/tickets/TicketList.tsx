// RUTA: src/components/tickets/TicketList.tsx
'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Ticket } from '@/types/ticket';
// --- ¡IMPORTANTE! ASEGÚRATE DE QUE ESTA LÍNEA ES ASÍ! ---
import TicketListItem from './TicketListItem'; // <--- CORRECCIÓN DE LA RUTA DE IMPORTACIÓN

interface TicketListProps {
    tickets: Ticket[];
    isLoading: boolean;
    selectedTicket: Ticket | null;
    isDesktop: boolean;
    newlyCreatedTicketId: string | null;
    onSelectTicket: (ticket: Ticket) => void;
    onTicketUpdated: (ticket: Ticket) => void;
    listHeightStyle: React.CSSProperties;
}

const TicketListComponent: React.FC<TicketListProps> = ({
    tickets,
    isLoading,
    selectedTicket,
    isDesktop,
    newlyCreatedTicketId,
    onSelectTicket,
    onTicketUpdated,
    listHeightStyle,
}) => {
    return (
        <div className="flex-grow overflow-y-auto space-y-2 pb-4 pr-2 relative" style={listHeightStyle}>
            {/* Contenedor que se atenúa durante la carga */}
            <div className={cn({ "opacity-40 transition-opacity duration-300": isLoading })}>
                {tickets.length > 0 ? (
                    // Se utiliza el operador spread para crear una copia del array antes de sortear,
                    // para evitar mutar el array original y posibles problemas de re-renderizado
                    // Se utiliza 'TicketListItem' directamente aquí, no 'SingleTicketItemCard'
                    [...tickets].sort((a,b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()).map(ticket => (
                        <TicketListItem 
                            key={ticket.id} 
                            ticket={ticket} 
                            onSelectTicket={onSelectTicket} 
                            onTicketUpdatedInList={onTicketUpdated} 
                            isSelected={selectedTicket?.id === ticket.id && isDesktop} 
                            isNew={newlyCreatedTicketId === ticket.id} 
                        />
                    ))
                ) : (
                    // Mensaje de "No encontrados" solo si no está cargando
                    !isLoading && <div className="text-center text-muted-foreground pt-10">No se encontraron tickets.</div>
                )}
            </div>

            {/* Overlay de carga que solo cubre esta lista */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-lg animate-shimmer"> {/* Aplicamos shimmer aquí */}
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
            )}
        </div>
    );
};

// Memoizamos el componente de la lista para optimizar el rendimiento
export const TicketList = React.memo(TicketListComponent);
