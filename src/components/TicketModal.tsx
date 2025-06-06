// src/components/TicketModal.tsx
"use client";

import * as React from "react";
import { useEffect } from "react";
import { TicketFormInModal } from "./TicketFormInModal"; 

// Definimos los tipos para las props aquí también para que TicketModal sepa qué esperar
interface EmpresaClienteOption {
  id: string;
  nombre: string;
}

interface UbicacionOption {
  id: string;
  nombreReferencial: string | null;
  direccionCompleta: string;
}

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextNroCaso: number;
  onFormSubmitSuccess: () => void;
  // Nuevas props para pasar los datos a TicketFormInModal
  empresasClientes: EmpresaClienteOption[];
  ubicacionesDisponibles: UbicacionOption[];
}

export function TicketModal({ 
  isOpen, 
  onClose, 
  nextNroCaso, 
  onFormSubmitSuccess,
  empresasClientes,      // Recibir la lista de empresas
  ubicacionesDisponibles // Recibir la lista de ubicaciones
}: TicketModalProps) {
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Evitar scroll del body cuando el modal está abierto
      document.addEventListener('keydown', handleEsc);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose} 
    >
      <div 
        className="bg-card dark:bg-slate-800 text-card-foreground w-full max-w-2xl max-h-[90vh] rounded-lg shadow-xl overflow-hidden flex flex-col" // Añadido flex flex-col
        onClick={(e) => e.stopPropagation()} 
      >
        {/* TicketFormInModal ahora recibe las props necesarias */}
        <TicketFormInModal
          nextNroCaso={nextNroCaso}
          onFormSubmitSuccess={onFormSubmitSuccess}
          onCancel={onClose}
          empresasClientes={empresasClientes}          // Pasar la prop
          ubicacionesDisponibles={ubicacionesDisponibles} // Pasar la prop
        />
      </div>
    </div>
  );
}
