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
import { Button } from "@/components/ui/button";

// Importaciones para React Hook Form y Zod
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Función para obtener la fecha y hora local actual en el formato correcto.
const getLocalDateTimeString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().slice(0, 16);
};

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
  // Añadir la prop 'ref' para que el componente pueda ser referenciado por el padre (TicketModal)
  ref?: React.Ref<HTMLFormElement>; 
}

// --- ESQUEMA DE VALIDACIÓN ZOD ---
const ticketFormSchema = z.object({
  fechaCreacion: z.string().min(1, { message: "Fecha de reporte es obligatoria." }),
  empresaClienteId: z.string().optional(),
  tipoIncidente: z.string().min(1, { message: "Tipo de incidente es obligatorio." }),
  prioridad: z.nativeEnum(PrioridadTicket, { message: "Prioridad inválida." }),
  ubicacionId: z.string().optional(),
  solicitanteNombre: z.string().min(1, { message: "Nombre del solicitante es obligatorio." }),
  solicitanteTelefono: z.string().optional(),
  solicitanteCorreo: z.string().email({ message: "Formato de correo inválido." }).optional().or(z.literal('')),
  titulo: z.string().min(1, { message: "Título del ticket es obligatorio." }).max(200, { message: "Título demasiado largo." }),
  descripcionDetallada: z.string().optional(),
  accionInicial: z.string().optional(),
  fechaSolucionEstimada: z.string().optional().or(z.literal('')),
});

type TicketFormInput = z.infer<typeof ticketFormSchema>;

// CORRECCIÓN CLAVE: Envolver el componente en React.forwardRef y usar 'export const'
export const TicketFormInModal = React.forwardRef<HTMLFormElement, TicketFormInModalProps>(({
  nextNroCaso,
  onSubmit,
  onCancel,
  isSubmitting,
  serverError,
  empresasClientes,
  ubicacionesDisponibles,
  initialData,
}, ref) => { // Recibe la ref aquí

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
      
      if (!dataToReset.empresaClienteId) dataToReset.empresaClienteId = '';
      if (!dataToReset.ubicacionId) dataToReset.ubicacionId = '';
      if (!dataToReset.solicitanteTelefono) dataToReset.solicitanteTelefono = '';
      if (!dataToReset.solicitanteCorreo) dataToReset.solicitanteCorreo = '';
      if (!dataToReset.descripcionDetallada) dataToReset.descripcionDetallada = '';
      if (!dataToReset.accionInicial) dataToReset.accionInicial = '';
      if (!dataToReset.fechaSolucionEstimada) dataToReset.fechaSolucionEstimada = '';

      reset(dataToReset);
    } else {
      reset({
        fechaCreacion: getLocalDateTimeString(),
        empresaClienteId: '',
        tipoIncidente: "Software",
        prioridad: PrioridadTicket.MEDIA,
        ubicacionId: '',
        solicitanteNombre: "",
        solicitanteTelefono: "",
        solicitanteCorreo: "",
        titulo: "",
        descripcionDetallada: "",
        accionInicial: "",
        fechaSolucionEstimada: "",
      });
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
        {/* Pasar la ref al elemento form */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6" ref={ref}> 
          <input type="hidden" name="nroCaso" value={nextNroCaso} />

          {serverError && (
            <div className="p-3 mb-4 text-sm text-destructive bg-destructive/10 rounded-lg flex items-center gap-2" role="alert">
              <AlertCircle className="h-5 w-5" />
              <div>
                <span className="font-medium">Error:</span> {serverError}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nroCasoModalDisplay">N° de Caso</Label>
              <Input id="nroCasoModalDisplay" value={nextNroCaso} readOnly className="bg-muted" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fechaCreacionModal">Fecha Reporte</Label>
              <Input
                type="datetime-local"
                id="fechaCreacionModal"
                {...register("fechaCreacion")}
                required
                className={errors.fechaCreacion ? "border-destructive" : ""}
              />
              {errors.fechaCreacion && <p className="text-destructive text-xs mt-1">{errors.fechaCreacion.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="empresaClienteId">Empresa Cliente</Label>
              <Controller
                control={control}
                name="empresaClienteId"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger id="empresaClienteId" className={errors.empresaClienteId ? "border-destructive" : ""}>
                      <SelectValue placeholder="Seleccione Empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {empresasClientes.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.empresaClienteId && <p className="text-destructive text-xs mt-1">{errors.empresaClienteId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tipoIncidente">Tipo de Incidente</Label>
              <Controller
                control={control}
                name="tipoIncidente"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger id="tipoIncidente" className={errors.tipoIncidente ? "border-destructive" : ""}>
                      <SelectValue placeholder="Seleccione Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Software">Software</SelectItem>
                        <SelectItem value="Hardware">Hardware</SelectItem>
                        <SelectItem value="Aplicaciones">Aplicaciones</SelectItem>
                        <SelectItem value="Red">Red</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.tipoIncidente && <p className="text-destructive text-xs mt-1">{errors.tipoIncidente.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prioridad">Prioridad</Label>
              <Controller
                control={control}
                name="prioridad"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger id="prioridad" className={errors.prioridad ? "border-destructive" : ""}>
                      <SelectValue placeholder="Prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={PrioridadTicket.BAJA}>BAJA</SelectItem>
                        <SelectItem value={PrioridadTicket.MEDIA}>MEDIA</SelectItem>
                        <SelectItem value={PrioridadTicket.ALTA}>ALTA</SelectItem>
                        <SelectItem value={PrioridadTicket.URGENTE}>URGENTE</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.prioridad && <p className="text-destructive text-xs mt-1">{errors.prioridad.message}</p>}
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="ubicacionId">Ubicación</Label>
              <Controller
                control={control}
                name="ubicacionId"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger id="ubicacionId" className={errors.ubicacionId ? "border-destructive" : ""}>
                      <SelectValue placeholder="Seleccione Ubicación (Opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {ubicacionesDisponibles.map(u => <SelectItem key={u.id} value={u.id}>{u.nombreReferencial || u.direccionCompleta}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.ubicacionId && <p className="text-destructive text-xs mt-1">{errors.ubicacionId.message}</p>}
            </div>

            <div className="md:col-span-2 text-sm font-medium text-foreground mb-1 mt-3 border-t pt-3">Información del Solicitante</div>
            <div className="space-y-1.5">
              <Label htmlFor="solicitanteNombre">Nombre Solicitante</Label>
              <Input
                id="solicitanteNombre"
                placeholder="Nombre completo"
                {...register("solicitanteNombre")}
                required
                className={errors.solicitanteNombre ? "border-destructive" : ""}
              />
              {errors.solicitanteNombre && <p className="text-destructive text-xs mt-1">{errors.solicitanteNombre.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="solicitanteTelefono">Teléfono (Opcional)</Label>
              <Input
                type="tel"
                id="solicitanteTelefono"
                placeholder="+56912345678"
                {...register("solicitanteTelefono")}
                className={errors.solicitanteTelefono ? "border-destructive" : ""}
              />
              {errors.solicitanteTelefono && <p className="text-destructive text-xs mt-1">{errors.solicitanteTelefono.message}</p>}
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="solicitanteCorreo">Correo (Opcional)</Label>
              <Input
                type="email"
                id="solicitanteCorreo"
                placeholder="contacto@empresa.com"
                {...register("solicitanteCorreo")}
                className={errors.solicitanteCorreo ? "border-destructive" : ""}
              />
              {errors.solicitanteCorreo && <p className="text-destructive text-xs mt-1">{errors.solicitanteCorreo.message}</p>}
            </div>

            <div className="md:col-span-2 text-sm font-medium text-foreground mb-1 mt-3 border-t pt-3">Detalles del Ticket</div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="titulo">Título del Ticket</Label>
              <Input
                id="titulo"
                placeholder="Ej: Impresora no enciende"
                {...register("titulo")}
                required
                className={errors.titulo ? "border-destructive" : ""}
              />
              {errors.titulo && <p className="text-destructive text-xs mt-1">{errors.titulo.message}</p>}
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="descripcionDetallada">Descripción Detallada</Label>
              <Textarea
                id="descripcionDetallada"
                placeholder="Proporcione todos los detalles relevantes..."
                rows={4}
                {...register("descripcionDetallada")}
                className={errors.descripcionDetallada ? "border-destructive" : ""}
              />
              {errors.descripcionDetallada && <p className="text-destructive text-xs mt-1">{errors.descripcionDetallada.message}</p>}
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="accionInicial">Acción Inicial Realizada (Si aplica)</Label>
              <Textarea
                id="accionInicial"
                placeholder="Si ya realizaste alguna acción..."
                rows={3}
                {...register("accionInicial")}
                className={errors.accionInicial ? "border-destructive" : ""}
              />
              {errors.accionInicial && <p className="text-destructive text-xs mt-1">{errors.accionInicial.message}</p>}
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="fechaSolucionEstimada">Fecha Estimada Solución (Opcional)</Label>
              <Input
                type="date"
                id="fechaSolucionEstimada"
                {...register("fechaSolucionEstimada")}
                className={errors.fechaSolucionEstimada ? "border-destructive" : ""}
              />
              {errors.fechaSolucionEstimada && <p className="text-destructive text-xs mt-1">{errors.fechaSolucionEstimada.message}</p>}
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
