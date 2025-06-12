// src/components/admin/CargaMasivaTickets.tsx
'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, Loader2, CheckCircle, XCircle, FileText } from 'lucide-react';
import Papa from 'papaparse';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '../ui/scroll-area';

// Define el estado del proceso de carga
type UploadStatus = 'idle' | 'parsing' | 'uploading' | 'success' | 'error';

// Define la estructura de la respuesta de la API
interface UploadResult {
  successfulCount: number;
  failedCount: number;
  errors: { row: number; data: any; error: string }[];
  message?: string;
}

// Componente principal de la interfaz de carga de archivos
export default function CargaMasivaTickets() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv') {
        setFile(selectedFile);
        setResult(null); // Limpiar resultados anteriores
        setStatus('idle');
      } else {
        alert("Por favor, selecciona un archivo CSV válido.");
        event.target.value = ''; // Limpiar el input
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Por favor, selecciona un archivo primero.");
      return;
    }

    setStatus('parsing');
    setResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        setStatus('uploading');
        try {
          const response = await fetch('/api/admin/importar-tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(results.data),
          });

          const data: UploadResult = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Error en el servidor');
          }
          
          setResult(data);
          setStatus('success');

        } catch (error: any) {
          console.error("Error al subir el archivo:", error);
          setStatus('error');
          setResult({
            successfulCount: 0,
            failedCount: results.data.length,
            errors: [],
            message: error.message || "Error de red o del servidor.",
          });
        }
      },
      error: (error: any) => {
        console.error("Error al parsear CSV:", error);
        setStatus('error');
        setResult({ successfulCount: 0, failedCount: 0, errors: [], message: `Error de formato en el archivo CSV: ${error.message}` });
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

  const isProcessing = status === 'parsing' || status === 'uploading';

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
                Procesando...
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

      {result && (
        <CardFooter className="flex flex-col items-start p-6 border-t">
            <h3 className="text-lg font-semibold mb-4">Resultados de la Importación</h3>
            {status === 'success' && result.failedCount === 0 && (
                 <Alert variant="default" className="w-full bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle className="text-green-800 dark:text-green-300">¡Importación Exitosa!</AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-400">
                        Se importaron correctamente **{result.successfulCount}** de {result.successfulCount} tickets.
                    </AlertDescription>
                </Alert>
            )}
             {status === 'success' && result.failedCount > 0 && (
                <Alert variant="destructive" className="w-full">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Proceso Finalizado con Errores</AlertTitle>
                    <AlertDescription>
                        Correctos: **{result.successfulCount}**. Fallidos: **{result.failedCount}**. La operación fue revertida. Revisa los errores y vuelve a intentarlo.
                    </AlertDescription>
                </Alert>
            )}
            {status === 'error' && (
                <Alert variant="destructive" className="w-full">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Error en la Importación</AlertTitle>
                    <AlertDescription>
                       {result.message}
                    </AlertDescription>
                </Alert>
            )}
            {result.errors.length > 0 && (
                <div className="w-full mt-4">
                    <h4 className="font-semibold mb-2">Detalle de Errores:</h4>
                    <ScrollArea className="h-48 w-full border rounded-md">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Fila</TableHead>
                                    <TableHead>Error</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {result.errors.map((err, i) =>(
                                    <TableRow key={i}>
                                        <TableCell>{err.row}</TableCell>
                                        <TableCell className="text-xs">{err.error}</TableCell>
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
