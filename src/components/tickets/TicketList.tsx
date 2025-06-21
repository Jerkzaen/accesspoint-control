// RUTA: src/components/tickets/TicketList.tsx
'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Ticket } from '@/types/ticket';
import TicketListItem from './TicketListItem';

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
            <div className={cn({ "opacity-40 transition-opacity duration-300": isLoading })}>
                {tickets.length > 0 ? (
                    // --- CAMBIO UX: ELIMINACIÓN DE ORDENAMIENTO EN FRONTEND ---
                    // Se elimina la línea [...tickets].sort(...) para respetar el orden
                    // que ya viene desde la API (ordenado por numeroCaso, descendente).
                    tickets.map(ticket => (
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
                    !isLoading && <div className="text-center text-muted-foreground pt-10">No se encontraron tickets.</div>
                )}
            </div>

            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-lg animate-shimmer">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
            )}
        </div>
    );
};

export const TicketList = React.memo(TicketListComponent);
