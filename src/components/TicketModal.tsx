"use client";

import * as React from "react";
import { useEffect } from "react";
import { TicketFormInModal } from "./TicketFormInModal"; // Ajusta la ruta si es necesario

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextNroCaso: number;
  onFormSubmitSuccess: () => void;
}

export function TicketModal({ 
  isOpen, 
  onClose, 
  nextNroCaso, 
  onFormSubmitSuccess 
}: TicketModalProps) {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose} // Cierra el modal si se hace clic en el overlay
    >
      <div 
        className="bg-card dark:bg-gray-800 text-card-foreground w-full max-w-2xl max-h-[90vh] rounded-lg shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal lo cierre
      >
        <TicketFormInModal
          nextNroCaso={nextNroCaso}
          onFormSubmitSuccess={() => {
            onFormSubmitSuccess();
            // onClose(); // El cierre ahora se maneja en onFormSubmitSuccess en la página del dashboard
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
