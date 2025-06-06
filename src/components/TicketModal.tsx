// src/components/TicketModal.tsx
"use client";

import * as React from "react";
import { useEffect, useState, useRef } from "react"; // Add useRef
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
  onFormSubmitSuccess: (newTicket?: Ticket) => void;
  empresasClientes: EmpresaClienteOption[];
  ubicacionesDisponibles: UbicacionOption[];
}

export function TicketModal({ 
  isOpen, 
  onClose, 
  nextNroCaso, 
  onFormSubmitSuccess,
  empresasClientes,      
  ubicacionesDisponibles 
}: TicketModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(isOpen);
  const [shouldRender, setShouldRender] = useState(isOpen); // Controls actual DOM rendering
  const modalRef = useRef<HTMLDivElement>(null); // Ref to detect click outside

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true); // Mount the modal content (makes it visible for transition)
      // Give a small delay to ensure modal is mounted before applying opacity-100
      const timer = setTimeout(() => {
        setInternalIsOpen(true); // Start fade-in animation
      }, 50); // Small delay to allow DOM to render
      return () => clearTimeout(timer); // Clear timeout on cleanup
    } else {
      setInternalIsOpen(false); // Start fade-out animation
      // After transition, unmount the modal content from DOM
      const timer = setTimeout(() => {
        setShouldRender(false); // Unmount after transition
      }, 300); // Duration of the fade-out transition (match CSS 'duration-300')
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && internalIsOpen) { // Only close if it's truly open
        onClose();
      }
    };
    const handleClickOutside = (event: MouseEvent) => {
      // Check if modalRef.current exists (i.e., modal is mounted)
      // and if the click is outside the modal content, AND the modal is truly open
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && internalIsOpen) {
        onClose();
      }
    };

    if (shouldRender) { // Only attach listeners if it's going to be rendered
      document.body.style.overflow = 'hidden'; // Prevent body scroll
      document.addEventListener('keydown', handleEsc);
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.body.style.overflow = 'unset'; // Re-enable body scroll
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [shouldRender, internalIsOpen, onClose]); // Depend on shouldRender and internalIsOpen to re-attach listeners

  if (!shouldRender) return null; // Don't render anything if not supposed to be in DOM

  return (
    <div 
      className={`
        fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4
        transition-opacity duration-300 ease-out
        ${internalIsOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} 
      `}
      // The onClick for closing outside is now handled by handleClickOutside
      // We explicitly stop propagation on the content div itself
    >
      <div 
        ref={modalRef} // Attach ref here for click outside detection
        className="bg-card dark:bg-slate-800 text-card-foreground w-full max-w-2xl max-h-[90vh] rounded-lg shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent clicks on modal content from closing the modal
      >
        <TicketFormInModal
          nextNroCaso={nextNroCaso}
          onFormSubmitSuccess={onFormSubmitSuccess}
          onCancel={onClose} // Pass original onClose callback
          empresasClientes={empresasClientes}          
          ubicacionesDisponibles={ubicacionesDisponibles} 
        />
      </div>
    </div>
  );
}
