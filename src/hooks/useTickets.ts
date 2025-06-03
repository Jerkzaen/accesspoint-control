// src/hooks/useTickets.ts (ACTUALIZADO)
import { useState, useEffect, useCallback } from 'react';
import { Ticket } from '@/types/ticket'; // Asegúrate que la ruta a tus tipos sea correcta

// Definir la interfaz para los filtros
export interface TicketFilters {
  searchText?: string;
  estado?: string;
  prioridad?: string;
}

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Estado para almacenar los filtros actuales
  const [currentFilters, setCurrentFilters] = useState<TicketFilters>({});

  const fetchTickets = useCallback(async (filters: TicketFilters = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      // Construir los parámetros de la URL a partir de los filtros
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

      const url = `/api/tickets?${queryParams.toString()}`;
      const res = await fetch(url);
      
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

  // Efecto para cargar tickets cuando los filtros cambian o al montar
  useEffect(() => {
    fetchTickets(currentFilters);
  }, [fetchTickets, currentFilters]); // Dependencia de currentFilters

  // Función para actualizar los filtros y recargar los tickets
  const applyFilters = useCallback((filters: TicketFilters) => {
    setCurrentFilters(filters);
  }, []);

  // `refreshTickets` ahora simplemente recarga con los filtros actuales
  const refreshTickets = useCallback(() => {
    fetchTickets(currentFilters);
  }, [fetchTickets, currentFilters]);


  return {
    tickets,
    setTickets,
    isLoading,
    error,
    refreshTickets, // Para recargar la lista manualmente
    applyFilters,   // Para aplicar nuevos filtros
    currentFilters, // Exponer los filtros actuales si es necesario para la UI
  };
}
