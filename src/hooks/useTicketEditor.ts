// src/hooks/useTicketEditor.ts
import { useState, useEffect, useCallback } from 'react';
import { Ticket } from '@/types/ticket'; // Esta interfaz ya debería estar actualizada con los nuevos nombres
import { EstadoTicket, PrioridadTicket } from '@prisma/client'; // Importar enums si se usan para validación interna aquí

// Interfaz para los campos que son editables en el ticket principal
// ACTUALIZADA con los nuevos nombres de campo
export interface EditableTicketFields {
  tecnicoAsignado: string; // Espera el ID del técnico o un valor representativo
  prioridad: PrioridadTicket; // Aseguramos que sea del tipo enum PrioridadTicket
  solicitante: string;   // Espera el nombre del solicitante
  estado: EstadoTicket;    // Aseguramos que sea del tipo enum EstadoTicket
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
        tecnicoAsignado: selectedTicket.tecnicoAsignado?.id || 'No Asignado', 
        prioridad: selectedTicket.prioridad, // Propiedad de enum directamente
        solicitante: selectedTicket.solicitanteNombre,
        estado: selectedTicket.estado, // Propiedad de enum directamente
      });
    } else if (!selectedTicket) {
      setIsEditingTicket(false);
      setEditableTicketData(null);
    }
  }, [selectedTicket, isEditingTicket]);


  const startEditingTicket = useCallback(() => {
    if (selectedTicket) {
      setEditableTicketData({
        tecnicoAsignado: selectedTicket.tecnicoAsignado?.id || 'No Asignado', 
        prioridad: selectedTicket.prioridad, 
        solicitante: selectedTicket.solicitanteNombre,
        estado: selectedTicket.estado,
      });
      setIsEditingTicket(true);
      setError(null); 
    }
  }, [selectedTicket]);

  const cancelEditingTicket = useCallback(() => {
    setIsEditingTicket(false);
    setError(null);
  }, []);

  const handleTicketInputChange = useCallback((field: keyof EditableTicketFields, value: any) => { // 'value' puede ser string o un miembro del enum
    setEditableTicketData(prev => {
      if (!prev) return null;
      // Para 'prioridad' y 'estado', aseguramos que el valor asignado sea del tipo enum si el campo lo requiere
      if (field === 'prioridad' && Object.values(PrioridadTicket).includes(value)) {
        return { ...prev, [field]: value as PrioridadTicket };
      }
      if (field === 'estado' && Object.values(EstadoTicket).includes(value)) {
        return { ...prev, [field]: value as EstadoTicket };
      }
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
      // Los valores de editableTicketData.prioridad y .estado ya son enums o string para tecnico/solicitante
      const response = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
