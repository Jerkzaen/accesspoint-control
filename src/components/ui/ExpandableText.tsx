// src/components/ui/ExpandableText.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableTextProps {
  text: string | null | undefined;
  initialHeightPx?: number; // Altura inicial en píxeles (ej. 80 para 80px)
  initialLines?: number; // Número de líneas iniciales (alternativa a initialHeightPx)
  showFade?: boolean; // Si mostrar el efecto de desvanecimiento
}

const ExpandableText: React.FC<ExpandableTextProps> = ({
  text,
  initialHeightPx,
  initialLines = 3, // Por defecto, 3 líneas si no se especifica altura
  showFade = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  useEffect(() => {
    if (contentRef.current && text) {
      // Para calcular si se necesita el botón, necesitamos que el texto no esté truncado
      // Temporalmente ajustamos la altura máxima para medir el scrollHeight
      const originalMaxHeight = contentRef.current.style.maxHeight;
      contentRef.current.style.maxHeight = 'none';

      const contentHeight = contentRef.current.scrollHeight;
      const visibleHeight = contentRef.current.offsetHeight; // Altura visible sin scroll

      // Calcular la altura basada en líneas iniciales si initialHeightPx no está definido
      let calculatedInitialHeight = initialHeightPx;
      if (calculatedInitialHeight === undefined && initialLines !== undefined) {
        const lineHeight = parseFloat(getComputedStyle(contentRef.current).lineHeight);
        if (lineHeight) {
          calculatedInitialHeight = lineHeight * initialLines;
        }
      }

      if (calculatedInitialHeight !== undefined && contentHeight > calculatedInitialHeight) {
        setShowButton(true);
      } else {
        setShowButton(false);
      }

      // Restaurar la altura máxima original
      contentRef.current.style.maxHeight = originalMaxHeight;
    }
  }, [text, initialHeightPx, initialLines]); // Recalcular cuando el texto o las propiedades iniciales cambien

  if (!text) {
    return <p className="text-muted-foreground italic text-xs">No se proporcionó descripción detallada.</p>;
  }

  // Determinar la altura máxima si está colapsado
  let maxHeightStyle: React.CSSProperties = {};
  if (!isExpanded) {
    if (initialHeightPx !== undefined) {
      maxHeightStyle = { maxHeight: `${initialHeightPx}px` };
    } else if (initialLines !== undefined) {
      maxHeightStyle = {
        maxHeight: `${initialLines * 1.5}em`, // Aproximado 1.5em por línea
        lineHeight: '1.5em', // Asegurar line-height para un cálculo más preciso
      };
    }
  }

  return (
    <div className="relative">
      <div
        ref={contentRef}
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          {
            "relative": showButton && !isExpanded && showFade, // Añadir fade solo si hay botón y no expandido
          }
        )}
        style={maxHeightStyle}
      >
        <p className="text-xs text-foreground/80 whitespace-pre-wrap">{text}</p>
        {showButton && !isExpanded && showFade && (
          // Overlay para el efecto de desvanecimiento
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent pointer-events-none" />
        )}
      </div>

      {showButton && (
        <Button
          variant="link"
          size="sm"
          onClick={toggleExpanded}
          className="p-0 h-auto text-xs justify-start mt-1 text-primary hover:text-primary/80"
          aria-expanded={isExpanded}
          aria-controls="expandable-text-content" // Se podría añadir un ID al div del contenido
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" /> Mostrar menos
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" /> Mostrar más
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default ExpandableText;
