// src/hooks/useTickets.ts
import { useState, useEffect, useCallback } from 'react';
import { Ticket } from '@/types/ticket'; // Asegúrate que la ruta a tus tipos sea correcta

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tickets');
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

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return {
    tickets,
    setTickets, // Para permitir actualizaciones desde fuera si es necesario (ej. después de un POST/PUT)
    isLoading,
    error,
    refreshTickets: fetchTickets, // Para poder recargar la lista manualmente
  };
}
