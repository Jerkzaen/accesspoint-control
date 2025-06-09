// RUTA: src/hooks/useTicketActionsManager.ts
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Ticket, ActionEntry, UsuarioBasico } from '@/types/ticket'; // Asegúrate que ActionEntry y UsuarioBasico estén bien definidos

// Se elimina la interfaz redundante ActionEntryWithUser

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

  const actionsForSelectedTicket = useMemo((): ActionEntry[] => {
    // CORRECCIÓN: Se usa directamente el tipo ActionEntry, que ya incluye el usuario.
    if (selectedTicket && Array.isArray(selectedTicket.acciones)) {
      return selectedTicket.acciones as ActionEntry[];
    }
    return [];
  }, [selectedTicket]);


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

    try {
      const response = await fetch(`/api/tickets/${selectedTicket.id}/accion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: newActionDescription.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Error HTTP: ${response.status}` }));
        throw new Error(errorData.message || 'Error al agregar la acción');
      }

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
