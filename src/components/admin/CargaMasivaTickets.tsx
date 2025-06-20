// RUTA: src/components/admin/CargaMasivaTickets.tsx
'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, Loader2, CheckCircle, XCircle } from 'lucide-react';
import Papa from 'papaparse';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '../ui/scroll-area';
import * as z from 'zod';

// --- ESTADOS Y TIPOS ---
type UploadStatus = 'idle' | 'parsing' | 'client-validating' | 'uploading' | 'success' | 'error';

interface ValidationError {
  row: number;
  error: string;
  data: any;
}

interface UploadResult {
  successfulCount: number;
  failedCount: number;
  errors: ValidationError[];
  message?: string;
}

// --- ESQUEMAS DE VALIDACIÓN SIMPLIFICADOS PARA EL CLIENTE ---
// La validación principal ahora se hace en el backend. El cliente solo chequeará formatos básicos.

const ticketCsvRowSchema = z.object({
  tipo_registro: z.literal("TICKET"),
  numero_ticket_asociado: z.string().optional().nullable(),
  titulo: z.string().min(1, "El título es obligatorio."),
  descripcionDetallada: z.string().min(1, "La descripción es obligatoria."),
  tipoIncidente: z.string().min(1, "El tipo de incidente es obligatorio."),
  prioridad: z.string().min(1, "La prioridad es obligatoria."),
  estado: z.string().min(1, "El estado es obligatorio."),
  solicitanteNombre: z.string().min(1, "El nombre del solicitante es obligatorio."),
  empresaClienteNombre: z.string().min(1, "El nombre de la empresa es obligatorio."),
  tecnicoAsignadoEmail: z.string().email("Email del técnico inválido o vacío.").min(1),
  ubicacionNombre: z.string().min(1, "El nombre de la ubicación es obligatorio."),
  fechaCreacion: z.string().min(1, "La fecha de creación es obligatoria."),
});

const accionCsvRowSchema = z.object({
    tipo_registro: z.literal("ACCION"),
    numero_ticket_asociado: z.string().min(1, "El número de ticket asociado es obligatorio para acciones."),
    accion_descripcion: z.string().min(1, "La descripción de la acción es obligatoria."),
    accion_fecha: z.string().min(1, "La fecha de la acción es obligatoria."),
    accion_usuario_email: z.string().email("Email del usuario de acción inválido o vacío.").min(1),
    accion_categoria: z.string().min(1, "La categoría de la acción es obligatoria."),
});


export default function CargaMasivaTickets() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [serverResult, setServerResult] = useState<UploadResult | null>(null);
  const [clientValidationErrors, setClientValidationErrors] = useState<ValidationError[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setServerResult(null);
        setClientValidationErrors([]);
        setStatus('idle');
      } else {
        alert("Por favor, selecciona un archivo CSV válido.");
        event.target.value = '';
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setServerResult(null);
    setClientValidationErrors([]);
    setStatus('parsing');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      encoding: 'UTF-8',
      complete: async (results) => {
        const parsedData = results.data as any[];
        const currentClientErrors: ValidationError[] = [];

        setStatus('client-validating');

        // --- VALIDACIÓN EN EL CLIENTE ---
        for (let i = 0; i < parsedData.length; i++) {
          const rowData = parsedData[i];
          const tipoRegistro = rowData.tipo_registro;
          let validation;

          if (tipoRegistro === 'TICKET') {
            validation = ticketCsvRowSchema.safeParse(rowData);
          } else if (tipoRegistro === 'ACCION') {
            validation = accionCsvRowSchema.safeParse(rowData);
          } else {
            currentClientErrors.push({ row: i + 2, data: rowData, error: "El valor en 'tipo_registro' debe ser TICKET o ACCION." });
            continue;
          }

          if (!validation.success) {
            currentClientErrors.push({
              row: i + 2,
              data: rowData,
              error: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '),
            });
          }
        }

        if (currentClientErrors.length > 0) {
          setClientValidationErrors(currentClientErrors);
          setStatus('error');
          return;
        }

        // --- ENVÍO AL BACKEND ---
        setStatus('uploading');
        try {
          const response = await fetch('/api/admin/importar-tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsedData),
          });

          const data: UploadResult = await response.json();
          setServerResult(data);
          setStatus(data.failedCount > 0 ? 'error' : 'success');

          if (response.ok && data.failedCount === 0) {
            setTimeout(() => {
                router.push('/tickets/dashboard');
                router.refresh();
            }, 1500);
          }
        } catch (error: any) {
          setStatus('error');
          setServerResult({ successfulCount: 0, failedCount: parsedData.length, errors: [], message: error.message || "Error de red o del servidor." });
        }
      },
      error: (error: any) => {
        setStatus('error');
        setServerResult({ successfulCount: 0, failedCount: 0, errors: [], message: `Error de formato en el archivo CSV: ${error.message}` });
      }
    });
  };

  const handleDownloadTemplate = () => {
    // --- PLANTILLA ACTUALIZADA ---
    const headers = [
        "tipo_registro", "numero_ticket_asociado", "titulo", "descripcionDetallada", 
        "tipoIncidente", "prioridad", "estado", "solicitanteNombre", "solicitanteTelefono",
        "solicitanteCorreo", "empresaClienteNombre", "tecnicoAsignadoEmail", "ubicacionNombre",
        "fechaCreacion", "fechaSolucionReal", "accion_descripcion", "accion_fecha", 
        "accion_usuario_email", "accion_categoria", "equipo_afectado"
    ];

    const exampleTicket = [
        "TICKET", "1", "Pedal derecho no funciona", "Entrega Pedal FRD3-4926 con guía N 84. A la espera por la devolución del pedal malo.",
        "VTS", "MEDIA", "CERRADO", "Ana Cofré", "", "", "ACHS", "akihabarawaves@gmail.com",
        "ACHS Agencia Calama", "5/12/2020", "5/12/2020", "", "", "", "", "FTE1-1451"
    ];

    const exampleAction = [
        "ACCION", "1", "", "", "", "", "", "", "", "", "", "", "", "", "",
        "Se revisa el pedal y se confirma la falla.", "2020-12-05 10:00:00",
        "akihabarawaves@gmail.com", "SEGUIMIENTO", ""
    ];

    const csvContent = [
        headers.join(','),
        exampleTicket.join(','),
        exampleAction.join(',')
    ].join('\n');
    
    const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csvContent}`);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "plantilla_importacion.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isProcessing = status === 'parsing' || status === 'client-validating' || status === 'uploading';

  return (
    <>
      <CardContent className="p-6 space-y-6">
        <div>
          <Label htmlFor="csv-file" className="text-base font-medium">1. Selecciona el archivo CSV</Label>
          <p className="text-sm text-muted-foreground mb-2">
            El archivo debe tener el formato especificado en la plantilla.
          </p>
          <div className="flex items-center gap-4">
            <Input id="csv-file" type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} disabled={isProcessing} />
            <Button variant="outline" onClick={handleDownloadTemplate} disabled={isProcessing}>
              <Download className="mr-2 h-4 w-4" />
              Descargar Plantilla
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-base font-medium mb-2">2. Inicia la importación</h3>
          <Button onClick={handleUpload} disabled={!file || isProcessing} className="w-full sm:w-auto">
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {status === 'parsing' && 'Analizando archivo...'}
            {status === 'client-validating' && 'Validando datos...'}
            {status === 'uploading' && 'Importando...'}
            {!isProcessing && 'Importar Tickets'}
          </Button>
        </div>
      </CardContent>

      {(serverResult || clientValidationErrors.length > 0) && (
        <CardFooter className="flex flex-col items-start p-6 border-t">
            <h3 className="text-lg font-semibold mb-4">Resultados de la Importación</h3>
            
            {status === 'success' && (
                 <Alert variant="default" className="w-full bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle className="text-green-800 dark:text-green-300">¡Importación Exitosa!</AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-400">Se procesaron correctamente **{serverResult?.successfulCount}** registros.</AlertDescription>
                </Alert>
            )}
            
            {(status === 'error') && (
                <Alert variant="destructive" className="w-full">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Importación Fallida</AlertTitle>
                    <AlertDescription>
                        {serverResult?.message || "Se encontraron errores en el archivo. Revisa la tabla de detalles."}
                        {serverResult && ` Correctos: ${serverResult.successfulCount}. Fallidos: ${serverResult.failedCount}.`}
                    </AlertDescription>
                </Alert>
            )}

            {(clientValidationErrors.length > 0 || (serverResult?.errors && serverResult.errors.length > 0)) && (
                <div className="w-full mt-4">
                    <h4 className="font-semibold mb-2">Detalle de Errores:</h4>
                    <ScrollArea className="h-48 w-full border rounded-md">
                         <Table>
                            <TableHeader><TableRow><TableHead>Línea</TableHead><TableHead>Error</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {clientValidationErrors.map((err, i) =>(
                                    <TableRow key={`client-err-${i}`}><TableCell>{err.row}</TableCell><TableCell className="text-xs text-destructive">{err.error}</TableCell></TableRow>
                                ))}
                                {serverResult?.errors?.map((err, i) =>(
                                    <TableRow key={`server-err-${i}`}><TableCell>{err.row}</TableCell><TableCell className="text-xs text-destructive">{err.error}</TableCell></TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
            )}
        </CardFooter>
      )}
    </>
  );
}
