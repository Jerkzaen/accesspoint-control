// src/hooks/useTicketEditor.ts
import { useState, useEffect, useCallback } from 'react';
import { Ticket } from '@/types/ticket'; // Esta interfaz ya debería estar actualizada con los nuevos nombres

// Interfaz para los campos que son editables en el ticket principal
// ACTUALIZADA con los nuevos nombres de campo
export interface EditableTicketFields {
  tecnicoAsignado: string; // Antes tecnico
  prioridad: string;
  solicitante: string;   // Antes contacto
  estado: string;
}

interface UseTicketEditorProps {
  selectedTicket: Ticket | null; // Ticket aquí ya debería tener los nuevos nombres
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
        // ACTUALIZADO: Usar nuevos nombres de campo de selectedTicket
        tecnicoAsignado: selectedTicket.tecnicoAsignado,
        prioridad: selectedTicket.prioridad,
        solicitante: selectedTicket.solicitante,
        estado: selectedTicket.estado,
      });
    } else if (!selectedTicket) {
      setIsEditingTicket(false);
      setEditableTicketData(null);
    }
  }, [selectedTicket, isEditingTicket]); // Añadido isEditingTicket a las dependencias para resetear si salimos del modo edición y el ticket cambia


  const startEditingTicket = useCallback(() => {
    if (selectedTicket) {
      setEditableTicketData({
        // ACTUALIZADO: Usar nuevos nombres de campo de selectedTicket
        tecnicoAsignado: selectedTicket.tecnicoAsignado,
        prioridad: selectedTicket.prioridad,
        solicitante: selectedTicket.solicitante,
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

  // handleTicketInputChange debería funcionar como está, ya que 'field' será una key de la nueva EditableTicketFields
  const handleTicketInputChange = useCallback((field: keyof EditableTicketFields, value: string) => {
    setEditableTicketData(prev => {
      if (!prev) return null;
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
      // IMPORTANTE: El backend (API endpoint PUT /api/tickets/[id])
      // ahora recibirá un cuerpo con { tecnicoAsignado, solicitante, prioridad, estado }
      // y debe estar preparado para manejar estos nuevos nombres de campo.
      const response = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editableTicketData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Error HTTP: ${response.status}` }));
        throw new Error(errorData.message || 'Error al actualizar el ticket');
      }

      const updatedTicketData: Ticket = await response.json(); // El backend debería devolver el ticket con los nuevos nombres
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