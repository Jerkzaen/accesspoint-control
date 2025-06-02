// src/hooks/useTicketActionsManager.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Ticket, ActionEntry } from '@/types/ticket'; // Asegúrate que la ruta a tus tipos sea correcta

interface UseTicketActionsManagerProps {
  selectedTicket: Ticket | null;
  onTicketUpdated: (updatedTicket: Ticket) => void; // Callback para notificar al padre
}

export function useTicketActionsManager({ selectedTicket, onTicketUpdated }: UseTicketActionsManagerProps) {
  const [newActionDescription, setNewActionDescription] = useState<string>('');
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editedActionDescription, setEditedActionDescription] = useState<string>('');
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Parsear las acciones del ticket seleccionado
  const actionsForSelectedTicket = useMemo((): ActionEntry[] => {
    if (!selectedTicket || !selectedTicket.acciones) return [];
    try {
      const parsed = JSON.parse(selectedTicket.acciones);
      if (Array.isArray(parsed)) {
        return parsed.map(act => {
          // Asegurar que cada acción tenga la estructura esperada
          if (typeof act === 'object' && act !== null && typeof act.id === 'string') {
            return {
              id: act.id,
              fecha: typeof act.fecha === 'string' ? act.fecha : new Date().toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }),
              descripcion: typeof act.descripcion === 'string' ? act.descripcion : '',
            };
          }
          return null;
        }).filter(act => act !== null) as ActionEntry[];
      }
      return [];
    } catch (e) {
      console.error('Error al parsear acciones del ticket:', e);
      return [];
    }
  }, [selectedTicket]);

  // Resetear estados de edición cuando el ticket seleccionado cambia
  useEffect(() => {
    setNewActionDescription('');
    setEditingActionId(null);
    setEditedActionDescription('');
    setError(null);
  }, [selectedTicket]);

  const startEditingAction = useCallback((action: ActionEntry) => {
    setEditingActionId(action.id);
    setEditedActionDescription(action.descripcion);
    setError(null);
  }, []);

  const cancelEditingAction = useCallback(() => {
    setEditingActionId(null);
    setEditedActionDescription('');
    setError(null);
  }, []);

  const addAction = useCallback(async () => {
    if (!selectedTicket || !newActionDescription.trim()) {
      setError("La descripción de la nueva acción no puede estar vacía.");
      return;
    }

    setIsProcessingAction(true);
    setError(null);

    const newActionEntry: ActionEntry = {
      id: crypto.randomUUID(), // Generar ID único en el cliente
      fecha: new Date().toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }),
      descripcion: newActionDescription.trim(),
    };

    const updatedActions = [...actionsForSelectedTicket, newActionEntry];

    try {
      const response = await fetch(`/api/tickets/${selectedTicket.id}/accion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // El backend espera un objeto con una propiedad "acciones" que es el array completo
        body: JSON.stringify({ acciones: updatedActions }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Error HTTP: ${response.status}` }));
        throw new Error(errorData.message || 'Error al agregar la acción');
      }

      const updatedTicketData: Ticket = await response.json();
      onTicketUpdated(updatedTicketData); // Notificar al componente padre
      setNewActionDescription(''); // Limpiar el campo después de agregar
    } catch (err: any) {
      console.error('Error al agregar acción:', err);
      setError(err.message || "Ocurrió un error desconocido al agregar la acción.");
    } finally {
      setIsProcessingAction(false);
    }
  }, [selectedTicket, newActionDescription, actionsForSelectedTicket, onTicketUpdated]);

  const saveEditedAction = useCallback(async () => {
    if (!selectedTicket || !editingActionId || !editedActionDescription.trim()) {
      setError("La descripción de la acción editada no puede estar vacía.");
      return;
    }

    setIsProcessingAction(true);
    setError(null);

    try {
      // El endpoint PUT para editar una acción específica espera solo la descripción
      const response = await fetch(`/api/tickets/${selectedTicket.id}/accion/${editingActionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: editedActionDescription.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Error HTTP: ${response.status}` }));
        throw new Error(errorData.message || 'Error al guardar la acción editada');
      }

      const updatedTicketData: Ticket = await response.json();
      onTicketUpdated(updatedTicketData); // Notificar al componente padre
      setEditingActionId(null); // Salir del modo edición de acción
      setEditedActionDescription('');
    } catch (err: any) {
      console.error('Error al editar acción:', err);
      setError(err.message || "Ocurrió un error desconocido al guardar la acción editada.");
    } finally {
      setIsProcessingAction(false);
    }
  }, [selectedTicket, editingActionId, editedActionDescription, onTicketUpdated]);

  return {
    actionsForSelectedTicket,
    newActionDescription,
    setNewActionDescription,
    editingActionId,
    editedActionDescription,
    setEditedActionDescription,
    isProcessingAction,
    error,
    startEditingAction,
    cancelEditingAction,
    addAction,
    saveEditedAction,
  };
}
