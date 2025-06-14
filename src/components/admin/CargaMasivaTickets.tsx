// RUTA: src/components/admin/CargaMasivaTickets.tsx
'use client';

import { useState, useRef, ChangeEvent } from 'react';
// ======================= INICIO DE LA SOLUCIÓN =======================
// 1. Importamos el hook useRouter de Next.js para poder interactuar con el router.
import { useRouter } from 'next/navigation';
// ======================== FIN DE LA SOLUCIÓN =========================
import { CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, Loader2, CheckCircle, XCircle } from 'lucide-react';
import Papa from 'papaparse';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '../ui/scroll-area';
import { EstadoTicket, PrioridadTicket } from '@prisma/client';
import * as z from 'zod';

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

const ticketCsvRowSchema = z.object({
  titulo: z.string().min(1, "El título es obligatorio."),
  descripcionDetallada: z.string().optional().nullable(),
  tipoIncidente: z.string().min(1, "El tipo de incidente es obligatorio."),
  prioridad: z.nativeEnum(PrioridadTicket, { errorMap: () => ({ message: "Prioridad inválida. Valores permitidos: BAJA, MEDIA, ALTA, URGENTE." }) }),
  estado: z.nativeEnum(EstadoTicket, { errorMap: () => ({ message: "Estado inválido. Valores permitidos: ABIERTO, CERRADO, EN_PROGRESO, PENDIENTE_TERCERO, PENDIENTE_CLIENTE, RESUELTO, CANCELADO." }) }),
  solicitanteNombre: z.string().min(1, "El nombre del solicitante es obligatorio."),
  solicitanteTelefono: z.string().optional().nullable(),
  solicitanteCorreo: z.string().email("Correo del solicitante inválido.").optional().or(z.literal('')).nullable(),
  empresaClienteNombre: z.string().optional().nullable(),
  tecnicoAsignadoEmail: z.string().email("Email del técnico inválido.").optional().or(z.literal('')).nullable(),
  fechaCreacion: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Formato de fecha de creación inválido (YYYY-MM-DD HH:MM:SS)." }),
  fechaSolucionEstimada: z.string().refine((val) => val === '' || val === null || !isNaN(Date.parse(val)), { message: "Formato de fecha de solución estimada inválido (YYYY-MM-DD)." }).optional().nullable(),
});

export default function CargaMasivaTickets() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [serverResult, setServerResult] = useState<UploadResult | null>(null);
  const [clientValidationErrors, setClientValidationErrors] = useState<ValidationError[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ======================= INICIO DE LA SOLUCIÓN =======================
  // 2. Obtenemos la instancia del router.
  const router = useRouter();
  // ======================== FIN DE LA SOLUCIÓN =========================

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
    if (!file) {
      alert("Por favor, selecciona un archivo primero.");
      return;
    }

    setServerResult(null);
    setClientValidationErrors([]);
    setStatus('parsing');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: async (results) => {
        const parsedData = results.data;
        const currentClientErrors: ValidationError[] = [];

        setStatus('client-validating');

        for (let i = 0; i < parsedData.length; i++) {
          const rowData = parsedData[i];
          const cleanedRowData = Object.fromEntries(
            Object.entries(rowData as Record<string, unknown>).map(([key, value]) => [key, value === '' ? null : value])
          );

          const validation = ticketCsvRowSchema.safeParse(cleanedRowData);
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
          setServerResult({
            successfulCount: 0,
            failedCount: currentClientErrors.length,
            errors: currentClientErrors,
            message: "Errores de validación encontrados en el archivo CSV. Ningún ticket fue importado.",
          });
          return;
        }

        setStatus('uploading');
        try {
          const response = await fetch('/api/admin/importar-tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsedData),
          });

          const data: UploadResult = await response.json(); 

          if (!response.ok) {
            setServerResult(data);
            setStatus('error');
            return;
          }
          
          setServerResult(data);
          setStatus(data.failedCount > 0 ? 'error' : 'success');

          // ======================= INICIO DE LA SOLUCIÓN =======================
          // 3. Si la respuesta fue exitosa (código 2xx), le decimos al router
          // que refresque los datos. Esto invalidará el caché del cliente y forzará
          // una nueva obtención de datos para el dashboard, mostrando los nuevos tickets.
          if (response.ok) {
            console.log("Carga masiva exitosa. Refrescando datos del cliente...");
            router.refresh();
          }
          // ======================== FIN DE LA SOLUCIÓN =========================

        } catch (error: any) {
          console.error("Error al subir el archivo (frontend general catch):", error);
          setStatus('error');
          setServerResult({
            successfulCount: 0,
            failedCount: parsedData.length,
            errors: [],
            message: error.message || "Error de red o del servidor al contactar la API. Verifique su conexión.",
          });
        }
      },
      error: (error: any) => {
        console.error("Error al parsear CSV:", error);
        setStatus('error');
        setServerResult({ successfulCount: 0, failedCount: 0, errors: [], message: `Error de formato en el archivo CSV: ${error.message}` });
      }
    });
  };

  const handleDownloadTemplate = () => {
    const headers = "titulo,descripcionDetallada,tipoIncidente,prioridad,estado,solicitanteNombre,solicitanteTelefono,solicitanteCorreo,empresaClienteNombre,tecnicoAsignadoEmail,fechaCreacion,fechaSolucionEstimada";
    const exampleRow = "Problema con impresora,La impresora fiscal no enciende,Hardware,ALTA,ABIERTO,Juan Pérez,912345678,juan.perez@cliente.com,Cliente Ejemplo,tecnico@accesspoint.cl,2025-06-11 10:30:00,2025-06-12";
    
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${exampleRow}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "plantilla_tickets.csv");
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
            El archivo debe contener las columnas especificadas en la plantilla.
          </p>
          <div className="flex items-center gap-4">
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="flex-grow"
              disabled={isProcessing}
            />
            <Button variant="outline" onClick={handleDownloadTemplate} disabled={isProcessing}>
              <Download className="mr-2 h-4 w-4" />
              Plantilla
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-base font-medium mb-2">2. Inicia la importación</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Se procesarán todos los registros del archivo. Esta acción no se puede deshacer.
          </p>
          <Button onClick={handleUpload} disabled={!file || isProcessing} className="w-full sm:w-auto">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {status === 'parsing' && 'Parseando...'}
                {status === 'client-validating' && 'Validando en Cliente...'}
                {status === 'uploading' && 'Subiendo datos...'}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Importar Tickets
              </>
            )}
          </Button>
        </div>
      </CardContent>

      {(serverResult || clientValidationErrors.length > 0) && (
        <CardFooter className="flex flex-col items-start p-6 border-t">
            <h3 className="text-lg font-semibold mb-4">Resultados de la Importación</h3>
            
            {status === 'success' && serverResult?.failedCount === 0 && (
                 <Alert variant="default" className="w-full bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle className="text-green-800 dark:text-green-300">¡Importación Exitosa!</AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-400">
                        Se importaron correctamente **{serverResult.successfulCount}** de {serverResult.successfulCount} tickets.
                    </AlertDescription>
                </Alert>
            )}
            {clientValidationErrors.length > 0 && status === 'error' && (
                <Alert variant="destructive" className="w-full">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Errores de Validación en el Cliente</AlertTitle>
                    <AlertDescription>
                       Se encontraron errores en el archivo CSV antes de la importación. Por favor, corrígelos y vuelve a intentarlo.
                    </AlertDescription>
                </Alert>
            )}
            {serverResult && serverResult.failedCount > 0 && status === 'error' && clientValidationErrors.length === 0 && (
                <Alert variant="destructive" className="w-full">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Proceso Finalizado con Errores en el Servidor</AlertTitle>
                    <AlertDescription>
                        Correctos: **{serverResult.successfulCount}**. Fallidos: **{serverResult.failedCount}**. La operación pudo haber sido revertida. Revisa los errores y vuelve a intentarlo.
                    </AlertDescription>
                </Alert>
            )}
            {serverResult && status === 'error' && !serverResult.errors?.length && (
                <Alert variant="destructive" className="w-full">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Error General en la Importación</AlertTitle>
                    <AlertDescription>
                       {serverResult.message || "Ocurrió un error inesperado."}
                    </AlertDescription>
                </Alert>
            )}

            {((serverResult && Array.isArray(serverResult.errors) && serverResult.errors.length > 0) || clientValidationErrors.length > 0) && (
                <div className="w-full mt-4">
                    <h4 className="font-semibold mb-2">Detalle de Errores ({clientValidationErrors.length > 0 ? 'Cliente' : 'Servidor'}):</h4>
                    <ScrollArea className="h-48 w-full border rounded-md">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Línea</TableHead>
                                    <TableHead>Error</TableHead>
                                    <TableHead>Datos</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clientValidationErrors.length > 0 && clientValidationErrors.map((err, i) =>(
                                    <TableRow key={`client-error-${i}`}>
                                        <TableCell>{err.row}</TableCell>
                                        <TableCell className="text-xs text-destructive">{err.error}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{JSON.stringify(err.data)}</TableCell>
                                    </TableRow>
                                ))}
                                {clientValidationErrors.length === 0 && serverResult && Array.isArray(serverResult.errors) && serverResult.errors.length > 0 && serverResult.errors.map((err, i) =>( 
                                    <TableRow key={`server-error-${i}`}>
                                        <TableCell>{err.row}</TableCell>
                                        <TableCell className="text-xs text-destructive">{err.error}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{JSON.stringify(err.data)}</TableCell>
                                    </TableRow>
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
