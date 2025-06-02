// src/components/ClientOnly.tsx
"use client";

import React, { useState, useEffect } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode; 
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    // Si fallback es un elemento React válido (incluyendo null), retornarlo directamente.
    // React maneja bien los fragments si children/fallback es un array.
    return fallback; 
  }

  return <>{children}</>; // Mantener el fragmento aquí está bien si children puede ser múltiple.
                          // O también podrías retornar 'children' directamente si siempre es un solo nodo.
}
