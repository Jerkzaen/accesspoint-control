// src/hooks/useTicketActionsManager.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Ticket, ActionEntry, UsuarioBasico } from '@/types/ticket'; // Asegúrate que ActionEntry y UsuarioBasico estén bien definidos

// Actualizar ActionEntry para que coincida con lo que devuelve la API
interface ActionEntryWithUser extends ActionEntry {
  realizadaPor?: UsuarioBasico | null; 
}

interface UseTicketActionsManagerProps {
  selectedTicket: Ticket | null;
  onTicketUpdated: (updatedTicket: Ticket) => void; 
}

export function useTicketActionsManager({ selectedTicket, onTicketUpdated }: UseTicketActionsManagerProps) {
  const [newActionDescription, setNewActionDescription] = useState<string>('');
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editedActionDescription, setEditedActionDescription] = useState<string>('');
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Las acciones ahora vendrán del ticket actualizado que incluye la relación 'acciones'
  // y cada acción incluye 'realizadaPor'.
  const actionsForSelectedTicket = useMemo((): ActionEntryWithUser[] => {
    // El tipo Ticket en el frontend debe reflejar que 'acciones' es un array de objetos
    // que ya vienen parseados desde la API, no un string JSON.
    // Si tu API devuelve el ticket con `include: { acciones: { include: { realizadaPor: true } } }`
    // entonces selectedTicket.acciones ya será el array correcto.
    if (selectedTicket && Array.isArray(selectedTicket.acciones)) {
      return selectedTicket.acciones as ActionEntryWithUser[]; // Castear si es necesario
    }
    return [];
  }, [selectedTicket]);


  useEffect(() => {
    setNewActionDescription('');
    setEditingActionId(null);
    setEditedActionDescription('');
    setError(null);
  }, [selectedTicket]);

  const startEditingAction = useCallback((action: ActionEntryWithUser) => {
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

    try {
      // Ahora solo enviamos la descripción de la nueva acción
      const response = await fetch(`/api/tickets/${selectedTicket.id}/accion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: newActionDescription.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Error HTTP: ${response.status}` }));
        throw new Error(errorData.message || 'Error al agregar la acción');
      }

      // La API ahora devuelve el ticket completo y actualizado con todas sus acciones
      const updatedTicketData: Ticket = await response.json();
      onTicketUpdated(updatedTicketData); 
      setNewActionDescription(''); 
    } catch (err: any) {
      console.error('Error al agregar acción:', err);
      setError(err.message || "Ocurrió un error desconocido al agregar la acción.");
    } finally {
      setIsProcessingAction(false);
    }
  }, [selectedTicket, newActionDescription, onTicketUpdated]);

  // La edición de una acción individual (PUT a /api/tickets/[id]/accion/[accionId])
  // también necesitará ajustes si el backend cambia.
  // Por ahora, asumimos que ese endpoint sigue funcionando como antes,
  // pero idealmente también debería devolver el ticket actualizado.
  const saveEditedAction = useCallback(async () => {
    if (!selectedTicket || !editingActionId || !editedActionDescription.trim()) {
      setError("La descripción de la acción editada no puede estar vacía.");
      return;
    }
    setIsProcessingAction(true);
    setError(null);
    try {
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
      onTicketUpdated(updatedTicketData);
      setEditingActionId(null);
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
