// RUTA: src/hooks/useTicketActionsManager.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Ticket, ActionEntry } from '@/types/ticket';

interface UseTicketActionsManagerProps {
  selectedTicket: Ticket | null;
}

export function useTicketActionsManager({ selectedTicket }: UseTicketActionsManagerProps) {
  const [actions, setActions] = useState<ActionEntry[]>([]);
  const [isLoadingActions, setIsLoadingActions] = useState<boolean>(false);
  const [newActionDescription, setNewActionDescription] = useState<string>('');
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editedActionDescription, setEditedActionDescription] = useState<string>('');
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActions = useCallback(async () => {
    if (!selectedTicket) {
      setActions([]);
      return;
    }
    setIsLoadingActions(true);
    setError(null);
    try {
      const response = await fetch(`/api/tickets/${selectedTicket.id}/accion`);
      if (!response.ok) {
        throw new Error('No se pudo cargar la bitácora.');
      }
      const data: ActionEntry[] = await response.json();
      setActions(data);
    } catch (err: any) {
      setError(err.message);
      setActions([]);
    } finally {
      setIsLoadingActions(false);
    }
  }, [selectedTicket]);

  useEffect(() => {
    fetchActions();
    setNewActionDescription('');
    setEditingActionId(null);
    setEditedActionDescription('');
    setError(null);
  }, [selectedTicket, fetchActions]);

  // ======================= INICIO DE LA CORRECCIÓN =======================
  // Se añade el array de dependencias vacío a las funciones useCallback
  // que no dependen de ningún estado o prop externo. Esto elimina el error.
  const startEditingAction = useCallback((action: ActionEntry) => {
    setEditingActionId(action.id);
    setEditedActionDescription(action.descripcion);
    setError(null);
  }, []); // Array de dependencias añadido.

  const cancelEditingAction = useCallback(() => {
    setEditingActionId(null);
    setEditedActionDescription('');
    setError(null);
  }, []); // Array de dependencias añadido.
  // ======================== FIN DE LA CORRECCIÓN =========================

  const addAction = useCallback(async () => {
    if (!selectedTicket || !newActionDescription.trim()) return;
    setIsProcessingAction(true);
    setError(null);
    try {
      const response = await fetch(`/api/tickets/${selectedTicket.id}/accion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: newActionDescription.trim() }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al agregar la acción');
      }
      setNewActionDescription('');
      await fetchActions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessingAction(false);
    }
  }, [selectedTicket, newActionDescription, fetchActions]);

  const saveEditedAction = useCallback(async () => {
    if (!selectedTicket || !editingActionId || !editedActionDescription.trim()) return;
    
    setIsProcessingAction(true);
    setError(null);
    try {
        const response = await fetch(`/api/tickets/${selectedTicket.id}/accion/${editingActionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descripcion: editedActionDescription.trim() }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al guardar la acción');
        }
        await fetchActions(); // Recarga las acciones para ver la edición.
        setEditingActionId(null);
        setEditedActionDescription('');
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsProcessingAction(false);
    }
  }, [selectedTicket, editingActionId, editedActionDescription, fetchActions]);

  return {
    actions: actions,
    isLoadingActions,
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
