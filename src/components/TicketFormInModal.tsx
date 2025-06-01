"use client";

import * as React from "react";
import { useState, useRef } from "react";
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
import { createNewTicketAction } from "@/app/actions/ticketActions"; // Importar la Server Action

interface TicketFormInModalProps {
  nextNroCaso: number;
  onFormSubmitSuccess: () => void;
  onCancel: () => void;
}

export function TicketFormInModal({ 
  nextNroCaso, 
  onFormSubmitSuccess, 
  onCancel 
}: TicketFormInModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formRef.current) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    const formData = new FormData(formRef.current);
    
    const result = await createNewTicketAction(formData);
    setIsSubmitting(false);

    if (result.success) {
      onFormSubmitSuccess();
    } else if (result.error) {
      setErrorMessage(result.error);
      console.error("Error desde la acción del formulario:", result.error);
    }
  };

  return (
    <Card className="overflow-hidden shadow-none border-none"> {/* Ajustar estilos para modal si es necesario */}
      <CardHeader>
        <CardTitle>Crear Nuevo Ticket</CardTitle>
        <CardDescription>Ingresa la información detallada del problema.</CardDescription>
      </CardHeader>
      <CardContent className="max-h-[70vh] overflow-y-auto p-4 sm:p-6">
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nroCasoModal">N° de Caso</Label>
              <Input name="nroCaso" id="nroCasoModal" defaultValue={nextNroCaso} readOnly className="bg-muted dark:bg-gray-800"/>
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
          {errorMessage && (
            <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
          )}
          <CardFooter className="px-0 pt-6 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar Ticket"}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
