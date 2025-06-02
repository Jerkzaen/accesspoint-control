// src/hooks/useTicketEditor.ts
import { useState, useEffect, useCallback } from 'react';
import { Ticket } from '@/types/ticket'; // Asegúrate que la ruta a tus tipos sea correcta

// Interfaz para los campos que son editables en el ticket principal
export interface EditableTicketFields {
  tecnico: string;
  prioridad: string;
  contacto: string;
  estado: string;
}

interface UseTicketEditorProps {
  selectedTicket: Ticket | null;
  onTicketUpdated: (updatedTicket: Ticket) => void; // Callback para notificar al padre
}

export function useTicketEditor({ selectedTicket, onTicketUpdated }: UseTicketEditorProps) {
  const [isEditingTicket, setIsEditingTicket] = useState<boolean>(false);
  const [editableTicketData, setEditableTicketData] = useState<EditableTicketFields | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Efecto para inicializar/resetear el formulario cuando cambia el ticket seleccionado
  useEffect(() => {
    if (selectedTicket && isEditingTicket) {
      // Si ya estamos editando y cambia el ticket seleccionado,
      // reiniciamos el formulario con los datos del nuevo ticket.
      setEditableTicketData({
        tecnico: selectedTicket.tecnico,
        prioridad: selectedTicket.prioridad,
        contacto: selectedTicket.contacto,
        estado: selectedTicket.estado,
      });
    } else if (!selectedTicket) {
      // Si no hay ticket seleccionado, salimos del modo edición.
      setIsEditingTicket(false);
      setEditableTicketData(null);
    }
    // No incluimos isEditingTicket en las dependencias para evitar bucles
    // si se llama a startEditing desde fuera mientras selectedTicket cambia.
  }, [selectedTicket]);


  const startEditingTicket = useCallback(() => {
    if (selectedTicket) {
      setEditableTicketData({
        tecnico: selectedTicket.tecnico,
        prioridad: selectedTicket.prioridad,
        contacto: selectedTicket.contacto,
        estado: selectedTicket.estado,
      });
      setIsEditingTicket(true);
      setError(null); // Limpiar errores previos
    }
  }, [selectedTicket]);

  const cancelEditingTicket = useCallback(() => {
    setIsEditingTicket(false);
    // No es necesario resetear editableTicketData aquí,
    // el useEffect se encargará si selectedTicket cambia o se deselecciona.
    // Si selectedTicket sigue siendo el mismo, al volver a startEditingTicket se recargarán los datos originales.
    setError(null);
  }, []);

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
      const response = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editableTicketData), // Enviar solo los campos editables
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Error HTTP: ${response.status}` }));
        throw new Error(errorData.message || 'Error al actualizar el ticket');
      }

      const updatedTicketData: Ticket = await response.json();
      onTicketUpdated(updatedTicketData); // Notificar al componente padre
      setIsEditingTicket(false); // Salir del modo edición después de guardar
      // alert('Ticket actualizado correctamente!'); // Considera mover alertas a la UI
    } catch (err: any) {
      console.error("Error al actualizar ticket:", err);
      setError(err.message || "Ocurrió un error desconocido al guardar los cambios.");
      // alert(`Error al actualizar el ticket: ${err.message}`); // Considera mover alertas a la UI
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
    setEditableTicketData, // Exponer por si se necesita manipulación más directa
  };
}
