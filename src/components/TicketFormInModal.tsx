// src/components/TicketFormInModal.tsx
"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react"; // useEffect para reaccionar al estado del formulario
import { useFormState, useFormStatus } from "react-dom"; // Importar useFormState
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createNewTicketAction } from "@/app/actions/ticketActions"; // Asegúrate que la ruta es correcta
import { AlertCircle, Loader2 } from "lucide-react"; // Para mostrar errores y estado de carga

// Componente interno para el botón de submit, para usar useFormStatus
function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}

interface TicketFormInModalProps {
  nextNroCaso: number;
  onFormSubmitSuccess: () => void;
  onCancel: () => void;
}

// Definir el tipo de estado para useFormState, debe coincidir con lo que devuelve la Server Action
interface ActionState {
  error?: string;
  success?: boolean;
  message?: string;
  ticketId?: string;
}

const initialState: ActionState = {
  error: undefined,
  success: undefined,
  message: undefined,
  ticketId: undefined,
};

export function TicketFormInModal({ 
  nextNroCaso, 
  onFormSubmitSuccess, 
  onCancel 
}: TicketFormInModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  // Usar useFormState con la Server Action y el estado inicial
  const [formState, formAction] = useFormState(createNewTicketAction, initialState);

  useEffect(() => {
    if (formState?.success) {
      onFormSubmitSuccess(); // Llama al callback de éxito (que probablemente cierra el modal)
      // Si el modal no se cierra automáticamente, podrías resetear aquí:
      // formRef.current?.reset(); 
    }
    // El mensaje de error se mostrará directamente desde formState en el JSX
  }, [formState, onFormSubmitSuccess]);

  return (
    <Card className="overflow-hidden shadow-none border-none">
      <CardHeader>
        <CardTitle>Crear Nuevo Ticket</CardTitle>
        <CardDescription>Ingresa la información detallada del problema.</CardDescription>
      </CardHeader>
      <CardContent className="max-h-[70vh] overflow-y-auto p-4 sm:p-6">
        {/* El 'action' del formulario ahora es el 'formAction' de useFormState */}
        <form ref={formRef} action={formAction} className="space-y-6">
          {/* Input oculto para nroCaso. El name es importante para FormData */}
          <input type="hidden" name="nroCaso" value={nextNroCaso} />

          {formState?.error && (
            <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800 flex items-center gap-2" role="alert">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Error:</span> {formState.error}
            </div>
          )}
          {/* Podrías mostrar un mensaje de éxito aquí también si el modal no se cierra inmediatamente */}
          {/* {formState?.success && formState.message && (
            <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-200 dark:text-green-800" role="alert">
              {formState.message}
            </div>
          )} */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nroCasoModalDisplay">N° de Caso</Label>
              <Input id="nroCasoModalDisplay" value={nextNroCaso} readOnly className="bg-muted dark:bg-gray-700"/>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="createdAtModal">Fecha Reporte</Label>
              <Input type="date" name="createdAt" id="createdAtModal" defaultValue={new Date().toISOString().split('T')[0]} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="empresaModal">Empresa</Label>
              <Select name="empresa" required defaultValue="Achs">
                <SelectTrigger id="empresaModal"><SelectValue placeholder="Seleccione Empresa" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Achs">ACHS</SelectItem>
                  <SelectItem value="Esachs">ESACHS</SelectItem>
                  <SelectItem value="CMT">CMT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tipoModal">Tipo de Incidente</Label>
              <Select name="tipo" required defaultValue="Software">
                <SelectTrigger id="tipoModal"><SelectValue placeholder="Seleccione Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Software">Software</SelectItem>
                  <SelectItem value="Hardware">Hardware</SelectItem>
                  <SelectItem value="Aplicaciones">Aplicaciones</SelectItem>
                  <SelectItem value="Red">Red</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prioridadModal">Prioridad</Label>
              <Select name="prioridad" defaultValue="media" required>
                <SelectTrigger id="prioridadModal"><SelectValue placeholder="Prioridad" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">BAJA</SelectItem>
                  <SelectItem value="media">MEDIA</SelectItem>
                  <SelectItem value="alta">ALTA</SelectItem>
                  <SelectItem value="urgente">URGENTE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tecnicoModal">Técnico Asignado</Label>
              <Select name="tecnico" required defaultValue="No Asignado">
                <SelectTrigger id="tecnicoModal"><SelectValue placeholder="Seleccione Técnico" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Miguel Chervellino">M.Chervellino</SelectItem>
                  <SelectItem value="Christian Torrenss">C. Torrens</SelectItem>
                  <SelectItem value="jerson Armijo">J. Armijo</SelectItem>
                  <SelectItem value="No Asignado">No Asignado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ubicacionModal">Ubicación (Ej: Oficina, Piso, Ciudad)</Label>
              <Input name="ubicacion" id="ubicacionModal" placeholder="Detalle de la ubicación" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactoModal">Contacto Solicitante (Nombre/Email)</Label>
              <Input name="contacto" id="contactoModal" placeholder="Persona que reporta" required />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="tituloDelTicketModal">Título del Ticket (Resumen Breve)</Label>
              <Input name="tituloDelTicket" id="tituloDelTicketModal" placeholder="Ej: Impresora no enciende en Contabilidad" required />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="detalleAdicionalModal">Descripción Detallada del Problema</Label>
              <Textarea name="detalleAdicional" id="detalleAdicionalModal" placeholder="Proporciona todos los detalles relevantes..." rows={4}/>
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="accionInicialModal">Acción Inicial Realizada (Si aplica)</Label>
              <Textarea name="accionInicial" id="accionInicialModal" placeholder="Si ya realizaste alguna acción..." rows={3}/>
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="fechaSolucionModal">Fecha Estimada/Solución (Opcional)</Label>
              <Input type="date" name="fechaSolucion" id="fechaSolucionModal" />
            </div>
          </div>
          
          <CardFooter className="px-0 pt-6 flex justify-end gap-3">
            {/* El botón de cancelar no debe ser de tipo submit y puede usar el estado `pending` de useFormStatus si es necesario deshabilitarlo */}
            <Button variant="outline" type="button" onClick={onCancel} >Cancelar</Button>
            <SubmitButton>Guardar Ticket</SubmitButton>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
