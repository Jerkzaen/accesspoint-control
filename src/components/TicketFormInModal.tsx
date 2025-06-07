// src/components/TicketFormInModal.tsx
'use client';

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
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
import { AlertCircle } from "lucide-react";
import { FormSubmitButton } from "@/components/ui/FormSubmitButton";
import { PrioridadTicket } from "@prisma/client";
import { Button } from "./ui/button";

// --- INTERFACES ---
interface EmpresaClienteOption {
  id: string;
  nombre: string;
}

interface UbicacionOption {
  id: string;
  nombreReferencial: string | null;
  direccionCompleta: string;
}

// Props actualizadas para un componente controlado por el orquestador.
interface TicketFormInModalProps {
  nextNroCaso: number;
  onSubmit: (formData: FormData) => Promise<void>; // Función para manejar el envío, pasada desde el padre.
  onCancel: () => void;
  isSubmitting: boolean; // Prop para controlar el estado de envío del botón.
  serverError: string | null; // Para mostrar errores del servidor.
  empresasClientes: EmpresaClienteOption[];
  ubicacionesDisponibles: UbicacionOption[];
  initialData: FormData | null; // Para rellenar el formulario en caso de reintento.
}

// --- COMPONENTE ---
export function TicketFormInModal({
  nextNroCaso,
  onSubmit,
  onCancel,
  isSubmitting,
  serverError,
  empresasClientes,
  ubicacionesDisponibles,
  initialData,
}: TicketFormInModalProps) {
  
  // El manejo del envío ahora se hace a través de un simple `onSubmit` de React.
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await onSubmit(formData); // Llama a la función del orquestador.
  };
  
  // Función para obtener el valor por defecto de un campo desde el FormData guardado
  const getDefaultValue = (fieldName: string) => initialData?.get(fieldName)?.toString() || '';

  // Función para obtener la fecha y hora local actual en el formato correcto.
  const getLocalDateTimeString = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().slice(0, 16);
  };

  return (
    <Card className="overflow-hidden shadow-none border-none bg-transparent flex flex-col h-full">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Crear Nuevo Ticket</CardTitle>
        <CardDescription>Ingresa la información detallada del problema.</CardDescription>
      </CardHeader>

      <CardContent className="flex-grow overflow-y-auto p-4 sm:p-6">
        {/* El formulario ya no usa `action`, sino `onSubmit` */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="hidden" name="nroCaso" value={nextNroCaso} />

          {serverError && (
            <div className="p-3 mb-4 text-sm text-destructive bg-destructive/10 rounded-lg flex items-center gap-2" role="alert">
              <AlertCircle className="h-5 w-5" />
              <div>
                <span className="font-medium">Error:</span> {serverError}
              </div>
            </div>
          )}

          {/* Resto del formulario (sin cambios en los campos) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nroCasoModalDisplay">N° de Caso</Label>
              <Input id="nroCasoModalDisplay" value={nextNroCaso} readOnly className="bg-muted" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fechaCreacionModal">Fecha Reporte</Label>
              <Input type="datetime-local" name="fechaCreacion" id="fechaCreacionModal" defaultValue={getDefaultValue('fechaCreacion') || getLocalDateTimeString()} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="empresaClienteId">Empresa Cliente</Label>
              <Select name="empresaClienteId" defaultValue={getDefaultValue('empresaClienteId')}>
                <SelectTrigger id="empresaClienteId"><SelectValue placeholder="Seleccione Empresa" /></SelectTrigger>
                <SelectContent>
                  {empresasClientes.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tipoIncidente">Tipo de Incidente</Label>
              <Select name="tipoIncidente" required defaultValue={getDefaultValue('tipoIncidente') || "Software"}>
                <SelectTrigger id="tipoIncidente"><SelectValue placeholder="Seleccione Tipo" /></SelectTrigger>
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
              <Label htmlFor="prioridad">Prioridad</Label>
              <Select name="prioridad" required defaultValue={getDefaultValue('prioridad') || PrioridadTicket.MEDIA}>
                <SelectTrigger id="prioridad"><SelectValue placeholder="Prioridad" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value={PrioridadTicket.BAJA}>BAJA</SelectItem>
                    <SelectItem value={PrioridadTicket.MEDIA}>MEDIA</SelectItem>
                    <SelectItem value={PrioridadTicket.ALTA}>ALTA</SelectItem>
                    <SelectItem value={PrioridadTicket.URGENTE}>URGENTE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="ubicacionId">Ubicación</Label>
              <Select name="ubicacionId" defaultValue={getDefaultValue('ubicacionId')}>
                <SelectTrigger id="ubicacionId"><SelectValue placeholder="Seleccione Ubicación (Opcional)" /></SelectTrigger>
                <SelectContent>
                  {ubicacionesDisponibles.map(u => <SelectItem key={u.id} value={u.id}>{u.nombreReferencial || u.direccionCompleta}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 text-sm font-medium text-foreground mb-1 mt-3 border-t pt-3">Información del Solicitante</div>
            <div className="space-y-1.5">
              <Label htmlFor="solicitanteNombre">Nombre Solicitante</Label>
              <Input name="solicitanteNombre" id="solicitanteNombre" placeholder="Nombre completo" required defaultValue={getDefaultValue('solicitanteNombre')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="solicitanteTelefono">Teléfono (Opcional)</Label>
              <Input type="tel" name="solicitanteTelefono" id="solicitanteTelefono" placeholder="+56912345678" defaultValue={getDefaultValue('solicitanteTelefono')} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="solicitanteCorreo">Correo (Opcional)</Label>
              <Input type="email" name="solicitanteCorreo" id="solicitanteCorreo" placeholder="contacto@empresa.com" defaultValue={getDefaultValue('solicitanteCorreo')} />
            </div>

            <div className="md:col-span-2 text-sm font-medium text-foreground mb-1 mt-3 border-t pt-3">Detalles del Ticket</div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="titulo">Título del Ticket</Label>
              <Input name="titulo" id="titulo" placeholder="Ej: Impresora no enciende" required defaultValue={getDefaultValue('titulo')} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="descripcionDetallada">Descripción Detallada</Label>
              <Textarea name="descripcionDetallada" id="descripcionDetallada" placeholder="Proporcione todos los detalles relevantes..." rows={4} defaultValue={getDefaultValue('descripcionDetallada')} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="accionInicial">Acción Inicial Realizada (Si aplica)</Label>
              <Textarea name="accionInicial" id="accionInicial" placeholder="Si ya realizaste alguna acción..." rows={3} defaultValue={getDefaultValue('accionInicial')} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="fechaSolucionEstimada">Fecha Estimada Solución (Opcional)</Label>
              <Input type="date" name="fechaSolucionEstimada" id="fechaSolucionEstimada" defaultValue={getDefaultValue('fechaSolucionEstimada')} />
            </div>
          </div>
          
          <CardFooter className="px-0 pt-6 flex justify-end gap-3 flex-shrink-0">
            <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
            {/* El botón de envío ahora usa la prop `pending` para mostrar su estado de carga */}
            <FormSubmitButton pending={isSubmitting}>Guardar Ticket</FormSubmitButton>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
