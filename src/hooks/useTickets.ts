// RUTA: src/hooks/useTickets.ts

import { useState, useEffect, useCallback } from 'react';
import { Ticket } from '@/types/ticket';

// Interfaz para los filtros, esto no cambia.
export interface TicketFilters {
  searchText?: string;
  estado?: string;
  prioridad?: string;
}

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<TicketFilters>({});

  const fetchTickets = useCallback(async (filters: TicketFilters = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      // La construcción de la URL es correcta.
      const queryParams = new URLSearchParams();
      if (filters.searchText) {
        queryParams.append("searchText", filters.searchText);
      }
      if (filters.estado) {
        queryParams.append("estado", filters.estado);
      }
      if (filters.prioridad) {
        queryParams.append("prioridad", filters.prioridad);
      }
      
      // Añadir un timestamp para evitar el caché
      queryParams.append("_t", Date.now().toString());

      const url = `/api/tickets?${queryParams.toString()}`;
      
      // Añadimos la opción { cache: 'no-store' } a la llamada fetch.
      // Esto le ordena a Next.js y al navegador que esta petición específica
      // siempre debe ir a la red y nunca debe usar una respuesta del caché.
      const res = await fetch(url, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        } 
      });
      
      if (!res.ok) {
        console.error("Response not OK:", res);
        try {
          const errorData = await res.json();
          throw new Error(errorData.message || `Error al cargar tickets: ${res.statusText}`);
        } catch (e) {
          console.error("Error parsing error response:", e);
          throw new Error(`Error al cargar tickets: ${res.statusText}`);
        }
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

  // La lógica de los efectos y callbacks se mantiene, ya que es correcta.
  useEffect(() => {
    fetchTickets(currentFilters);
  }, [fetchTickets, currentFilters]);

  const applyFilters = useCallback((filters: TicketFilters) => {
    setCurrentFilters(filters);
  }, []);

  const refreshTickets = useCallback(() => {
    fetchTickets(currentFilters);
  }, [fetchTickets, currentFilters]);


  return {
    tickets,
    setTickets,
    isLoading,
    error,
    refreshTickets,
    applyFilters,
    currentFilters,
  };
}
