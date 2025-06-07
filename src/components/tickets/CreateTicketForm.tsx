// RUTA: src/components/tickets/CreateTicketForm.tsx
'use client';

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { FormSubmitButton } from "@/components/ui/FormSubmitButton";
import { PrioridadTicket } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const getLocalDateTimeString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().slice(0, 16);
};

// --- Interfaces ---
interface EmpresaClienteOption { id: string; nombre: string; }
interface UbicacionOption { id: string; nombreReferencial: string | null; direccionCompleta: string; }

interface CreateTicketFormProps {
  nextNroCaso: number;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  serverError: string | null;
  empresasClientes: EmpresaClienteOption[];
  ubicacionesDisponibles: UbicacionOption[];
  initialData: FormData | null;
}

// --- Esquema de Validación Zod ---
const ticketFormSchema = z.object({
  fechaCreacion: z.string().min(1, { message: "La fecha es obligatoria." }),
  empresaClienteId: z.string().optional(),
  tipoIncidente: z.string().min(1, { message: "El tipo de incidente es obligatorio." }),
  prioridad: z.nativeEnum(PrioridadTicket, { message: "Prioridad inválida." }),
  ubicacionId: z.string().optional(),
  solicitanteNombre: z.string().min(1, { message: "El nombre del solicitante es obligatorio." }),
  solicitanteTelefono: z.string().optional(),
  solicitanteCorreo: z.string().email({ message: "Formato de correo inválido." }).optional().or(z.literal('')),
  titulo: z.string().min(1, { message: "El título es obligatorio." }).max(200, { message: "Título demasiado largo." }),
  descripcionDetallada: z.string().optional(),
  accionInicial: z.string().optional(),
  fechaSolucionEstimada: z.string().optional().or(z.literal('')),
});

type TicketFormInput = z.infer<typeof ticketFormSchema>;

// El componente ahora se llama CreateTicketForm y se exporta para ser usado por CreateTicketModal
export const CreateTicketForm = React.forwardRef<HTMLFormElement, CreateTicketFormProps>(({
  nextNroCaso,
  onSubmit,
  onCancel,
  isSubmitting,
  serverError,
  empresasClientes,
  ubicacionesDisponibles,
  initialData,
}, ref) => {

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
  } = useForm<TicketFormInput>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      fechaCreacion: (initialData?.get('fechaCreacion')?.toString() || getLocalDateTimeString()),
      empresaClienteId: initialData?.get('empresaClienteId')?.toString() || '',
      tipoIncidente: initialData?.get('tipoIncidente')?.toString() || "Software",
      prioridad: (initialData?.get('prioridad')?.toString() as PrioridadTicket) || PrioridadTicket.MEDIA,
      ubicacionId: initialData?.get('ubicacionId')?.toString() || '',
      solicitanteNombre: initialData?.get('solicitanteNombre')?.toString() || "",
      solicitanteTelefono: initialData?.get('solicitanteTelefono')?.toString() || "",
      solicitanteCorreo: initialData?.get('solicitanteCorreo')?.toString() || "",
      titulo: initialData?.get('titulo')?.toString() || "",
      descripcionDetallada: initialData?.get('descripcionDetallada')?.toString() || "",
      accionInicial: initialData?.get('accionInicial')?.toString() || "",
      fechaSolucionEstimada: initialData?.get('fechaSolucionEstimada')?.toString() || "",
    }
  });
  
  React.useEffect(() => {
    if (initialData) {
      const dataToReset: Partial<TicketFormInput> = {};
      initialData.forEach((value, key) => {
        if (key in ticketFormSchema.shape) {
          dataToReset[key as keyof TicketFormInput] = value as any;
        }
      });
      reset(dataToReset);
    }
  }, [initialData, reset]);

  const onFormSubmit = async (data: TicketFormInput) => {
    const formData = new FormData();
    formData.append('nroCaso', nextNroCaso.toString());
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    await onSubmit(formData);
  };

  return (
    <Card className="overflow-hidden shadow-none border-none bg-transparent flex flex-col h-full">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Crear Nuevo Ticket</CardTitle>
        <CardDescription>Ingresa la información detallada del problema.</CardDescription>
      </CardHeader>

      <CardContent className="flex-grow overflow-y-auto p-4 sm:p-6">
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6" ref={ref}>
          <input type="hidden" name="nroCaso" value={nextNroCaso} />

          {serverError && (
            <div className="p-3 mb-4 text-sm text-destructive bg-destructive/10 rounded-lg flex items-center gap-2" role="alert">
              <AlertCircle className="h-5 w-5" />
              <div><span className="font-medium">Error:</span> {serverError}</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nroCasoModalDisplay">N° de Caso</Label>
              <Input id="nroCasoModalDisplay" value={nextNroCaso} readOnly className="bg-muted" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fechaCreacionModal">Fecha Reporte</Label>
              <Input type="datetime-local" id="fechaCreacionModal" {...register("fechaCreacion")} required className={errors.fechaCreacion ? "border-destructive" : ""} />
              {errors.fechaCreacion && <p className="text-destructive text-xs mt-1">{errors.fechaCreacion.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="empresaClienteId">Empresa Cliente</Label>
              <Controller control={control} name="empresaClienteId" render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="empresaClienteId"><SelectValue placeholder="Seleccione Empresa" /></SelectTrigger>
                    <SelectContent>{empresasClientes.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
                  </Select>
              )} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tipoIncidente">Tipo de Incidente</Label>
              <Controller control={control} name="tipoIncidente" render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="tipoIncidente"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Software">Software</SelectItem>
                        <SelectItem value="Hardware">Hardware</SelectItem>
                        <SelectItem value="Aplicaciones">Aplicaciones</SelectItem>
                        <SelectItem value="Red">Red</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
              )} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prioridad">Prioridad</Label>
              <Controller control={control} name="prioridad" render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="prioridad"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value={PrioridadTicket.BAJA}>BAJA</SelectItem>
                        <SelectItem value={PrioridadTicket.MEDIA}>MEDIA</SelectItem>
                        <SelectItem value={PrioridadTicket.ALTA}>ALTA</SelectItem>
                        <SelectItem value={PrioridadTicket.URGENTE}>URGENTE</SelectItem>
                    </SelectContent>
                  </Select>
              )} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="ubicacionId">Ubicación</Label>
              <Controller control={control} name="ubicacionId" render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="ubicacionId"><SelectValue placeholder="Seleccione Ubicación (Opcional)" /></SelectTrigger>
                    <SelectContent>{ubicacionesDisponibles.map(u => <SelectItem key={u.id} value={u.id}>{u.nombreReferencial || u.direccionCompleta}</SelectItem>)}</SelectContent>
                  </Select>
              )} />
            </div>
            <div className="md:col-span-2 text-sm font-medium text-foreground mb-1 mt-3 border-t pt-3">Información del Solicitante</div>
            <div className="space-y-1.5">
              <Label htmlFor="solicitanteNombre">Nombre Solicitante</Label>
              <Input id="solicitanteNombre" placeholder="Nombre completo" {...register("solicitanteNombre")} required className={errors.solicitanteNombre ? "border-destructive" : ""} />
              {errors.solicitanteNombre && <p className="text-destructive text-xs mt-1">{errors.solicitanteNombre.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="solicitanteTelefono">Teléfono (Opcional)</Label>
              <Input type="tel" id="solicitanteTelefono" placeholder="+56912345678" {...register("solicitanteTelefono")} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="solicitanteCorreo">Correo (Opcional)</Label>
              <Input type="email" id="solicitanteCorreo" placeholder="contacto@empresa.com" {...register("solicitanteCorreo")} className={errors.solicitanteCorreo ? "border-destructive" : ""} />
              {errors.solicitanteCorreo && <p className="text-destructive text-xs mt-1">{errors.solicitanteCorreo.message}</p>}
            </div>
            <div className="md:col-span-2 text-sm font-medium text-foreground mb-1 mt-3 border-t pt-3">Detalles del Ticket</div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="titulo">Título del Ticket</Label>
              <Input id="titulo" placeholder="Ej: Impresora no enciende" {...register("titulo")} required className={errors.titulo ? "border-destructive" : ""} />
              {errors.titulo && <p className="text-destructive text-xs mt-1">{errors.titulo.message}</p>}
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="descripcionDetallada">Descripción Detallada</Label>
              <Textarea id="descripcionDetallada" placeholder="Proporcione todos los detalles relevantes..." rows={4} {...register("descripcionDetallada")} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="accionInicial">Acción Inicial Realizada (Si aplica)</Label>
              <Textarea id="accionInicial" placeholder="Si ya realizaste alguna acción..." rows={3} {...register("accionInicial")} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="fechaSolucionEstimada">Fecha Estimada Solución (Opcional)</Label>
              <Input type="date" id="fechaSolucionEstimada" {...register("fechaSolucionEstimada")} />
            </div>
          </div>
          <CardFooter className="px-0 pt-6 flex justify-end gap-3 flex-shrink-0">
            <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
            <FormSubmitButton pending={isSubmitting}>Guardar Ticket</FormSubmitButton>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
});
