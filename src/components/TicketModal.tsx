// src/components/TicketModal.tsx
"use client";

import * as React from "react";
import { useEffect, useState, useRef } from "react"; 
import { TicketFormInModal } from "./TicketFormInModal"; 
import { Ticket } from '@/types/ticket'; 

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
  // MODIFICADO: Ahora pasa la prop onCompletion a TicketFormInModal
  onCompletion: (newTicket?: Ticket) => void; 
  empresasClientes: EmpresaClienteOption[];
  ubicacionesDisponibles: UbicacionOption[];
}

export function TicketModal({ 
  isOpen, 
  onClose, 
  nextNroCaso, 
  onCompletion, // MODIFICADO: Recibe onCompletion
  empresasClientes,      
  ubicacionesDisponibles 
}: TicketModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(isOpen);
  const [shouldRender, setShouldRender] = useState(isOpen); 
  const modalRef = useRef<HTMLDivElement>(null); 

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true); 
      const timer = setTimeout(() => {
        setInternalIsOpen(true); 
      }, 50); 
      return () => clearTimeout(timer); 
    } else {
      setInternalIsOpen(false); 
      const timer = setTimeout(() => {
        setShouldRender(false); 
      }, 300); 
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && internalIsOpen) { 
        onClose();
      }
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && internalIsOpen) {
        onClose();
      }
    };

    if (shouldRender) { 
      document.body.style.overflow = 'hidden'; 
      document.addEventListener('keydown', handleEsc);
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.body.style.overflow = 'unset'; 
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [shouldRender, internalIsOpen, onClose]); 

  if (!shouldRender) return null; 

  return (
    <div 
      className={`
        fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4
        transition-opacity duration-300 ease-out
        ${internalIsOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} 
      `}
    >
      <div 
        ref={modalRef} 
        className="bg-card dark:bg-slate-800 text-card-foreground w-full max-w-2xl max-h-[90vh] rounded-lg shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()} 
      >
        <TicketFormInModal
          nextNroCaso={nextNroCaso}
          // MODIFICADO: Pasa la prop onCompletion recibida
          onCompletion={onCompletion} // <--- MODIFICADO
          onCancel={onClose} 
          empresasClientes={empresasClientes}          
          ubicacionesDisponibles={ubicacionesDisponibles} 
        />
      </div>
    </div>
  );
}
