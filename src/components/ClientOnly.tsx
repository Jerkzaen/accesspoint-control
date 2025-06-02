// src/components/ClientOnly.tsx
"use client";

import React, { useState, useEffect } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode; // Un placeholder opcional mientras no está montado
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>; // Renderiza el fallback (o null) en el servidor y en la hidratación inicial
  }

  return <>{children}</>; // Renderiza los hijos solo en el cliente después de montar
}
