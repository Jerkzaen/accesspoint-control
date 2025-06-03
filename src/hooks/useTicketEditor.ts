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
  selectedTicket: Ticket | null; // Ticket aquí ya debería tener los nuevos nombres de la interfaz Ticket
  onTicketUpdated: (updatedTicket: Ticket) => void;
}

export function useTicketEditor({ selectedTicket, onTicketUpdated }: UseTicketEditorProps) {
  const [isEditingTicket, setIsEditingTicket] = useState<boolean>(false);
  const [editableTicketData, setEditableTicketData] = useState<EditableTicketFields | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Solo actualiza editableTicketData si estamos en modo edición.
    // Si salimos del modo edición (isEditingTicket se vuelve false),
    // editableTicketData se mantendrá con su último valor hasta que
    // se vuelva a entrar en modo edición o se deseleccione el ticket.
    if (selectedTicket && isEditingTicket) {
      setEditableTicketData({
        // ACTUALIZADO: Usar nuevos nombres de campo de selectedTicket
        tecnicoAsignado: selectedTicket.tecnicoAsignado,
        prioridad: selectedTicket.prioridad,
        solicitante: selectedTicket.solicitante,
        estado: selectedTicket.estado,
      });
    } else if (!selectedTicket) {
      // Si no hay ticket seleccionado, salimos del modo edición y limpiamos los datos.
      setIsEditingTicket(false);
      setEditableTicketData(null);
    }
    // La dependencia de isEditingTicket aquí es importante para que si
    // externamente se cambia isEditingTicket a false, pero selectedTicket
    // sigue siendo el mismo, no intentemos rellenar el formulario.
  }, [selectedTicket, isEditingTicket]);


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
      setError(null); // Limpiar errores previos
    }
  }, [selectedTicket]);

  const cancelEditingTicket = useCallback(() => {
    setIsEditingTicket(false);
    // No es necesario resetear editableTicketData aquí si no queremos perder los cambios no guardados
    // al volver a entrar en modo edición para el mismo ticket.
    // Si se selecciona otro ticket, el useEffect de arriba se encargará.
    setError(null);
  }, []);

  // handleTicketInputChange debería funcionar como está, ya que 'field' será una key de la nueva EditableTicketFields
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
      // IMPORTANTE: El backend (API endpoint PUT /api/tickets/[id])
      // ahora recibirá un cuerpo con { tecnicoAsignado, solicitante, prioridad, estado }
      // y debe estar preparado para manejar estos nuevos nombres de campo.
      // El archivo en el Canvas 'api_tickets_id_route_js_updated' ya está preparado para esto.
      const response = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editableTicketData), // editableTicketData ahora tiene los nombres nuevos
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Error HTTP: ${response.status}` }));
        throw new Error(errorData.message || 'Error al actualizar el ticket');
      }

      const updatedTicketData: Ticket = await response.json(); // El backend debería devolver el ticket con los nuevos nombres
      onTicketUpdated(updatedTicketData); // Notificar al componente padre
      setIsEditingTicket(false); // Salir del modo edición después de guardar
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
    setEditableTicketData, // Exponer por si se necesita manipulación más directa
  };
}
