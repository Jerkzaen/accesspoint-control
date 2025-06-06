// src/hooks/useTicketEditor.ts
import { useState, useEffect, useCallback } from 'react';
import { Ticket } from '@/types/ticket'; // Esta interfaz ya debería estar actualizada con los nuevos nombres

// Interfaz para los campos que son editables en el ticket principal
// ACTUALIZADA con los nuevos nombres de campo
export interface EditableTicketFields {
  tecnicoAsignado: string; // Espera el ID del técnico o un valor representativo
  prioridad: string;
  solicitante: string;   // Espera el nombre del solicitante
  estado: string;
}

interface UseTicketEditorProps {
  selectedTicket: Ticket | null; // Ticket aquí ya debería tener los nuevos nombres de la interfaz Ticket
  onTicketUpdated: (updatedTicket: Ticket) => void;
}

export function useTicketEditor({ selectedTicket, onTicketUpdated }: UseTicketEditorProps) {
  const [isEditingTicket, setIsEditingTicket] = useState<boolean>(false);
  const [editableTicketData, setEditableTicketData] = useState<EditableTicketFields | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedTicket && isEditingTicket) {
      setEditableTicketData({
        // CORRECCIÓN: Acceder a la propiedad de ID del técnico asignado o un string de fallback
        tecnicoAsignado: selectedTicket.tecnicoAsignado?.id || 'No Asignado', // Pasa el ID si existe, o 'No Asignado'
        prioridad: selectedTicket.prioridad,
        // CORRECCIÓN: Usar solicitanteNombre
        solicitante: selectedTicket.solicitanteNombre,
        estado: selectedTicket.estado,
      });
    } else if (!selectedTicket) {
      setIsEditingTicket(false);
      setEditableTicketData(null);
    }
  }, [selectedTicket, isEditingTicket]);


  const startEditingTicket = useCallback(() => {
    if (selectedTicket) {
      setEditableTicketData({
        // CORRECCIÓN: Acceder a la propiedad de ID del técnico asignado o un string de fallback
        tecnicoAsignado: selectedTicket.tecnicoAsignado?.id || 'No Asignado', // Pasa el ID si existe, o 'No Asignado'
        prioridad: selectedTicket.prioridad,
        // CORRECCIÓN: Usar solicitanteNombre
        solicitante: selectedTicket.solicitanteNombre,
        estado: selectedTicket.estado,
      });
      setIsEditingTicket(true);
      setError(null); // Limpiar errores previos
    }
  }, [selectedTicket]);

  const cancelEditingTicket = useCallback(() => {
    setIsEditingTicket(false);
    setError(null);
  }, []);

  const handleTicketInputChange = useCallback((field: keyof EditableTicketFields, value: string) => {
    setEditableTicketData(prev => {
      if (!prev) return null; // No debería pasar si isEditingTicket es true y hay un selectedTicket
      return { ...prev, [field]: value };
    });
  }, []);

  const saveTicketChanges = useCallback(async () => {
    if (!selectedTicket || !editableTicketData) {
      setError("No hay datos de ticket para guardar.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // Asegúrate de que el backend pueda recibir el ID del técnico o el nombre del solicitante
        // como un string si es lo que editableTicketData.tecnicoAsignado contiene.
        // Si el backend espera un objeto para tecnicoAsignado, esta lógica debe ser revisada.
        // Basado en el `route.js` que enviaste antes, el PUT de `/api/tickets/[id]` espera un string.
        body: JSON.stringify(editableTicketData), 
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Error HTTP: ${response.status}` }));
        throw new Error(errorData.message || 'Error al actualizar el ticket');
      }

      const updatedTicketData: Ticket = await response.json(); 
      onTicketUpdated(updatedTicketData); 
      setIsEditingTicket(false); 
    } catch (err: any) {
      console.error("Error al actualizar ticket:", err);
      setError(err.message || "Ocurrió un error desconocido al guardar los cambios.");
    } finally {
      setIsSaving(false);
    }
  }, [selectedTicket, editableTicketData, onTicketUpdated]);

  return {
    isEditingTicket,
    editableTicketData,
    isSaving,
    error,
    startEditingTicket,
    cancelEditingTicket,
    handleTicketInputChange,
    saveTicketChanges,
    setEditableTicketData,
  };
}
