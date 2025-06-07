// src/components/ui/FormSubmitButton.tsx
'use client';

import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Se extiende ButtonProps para incluir una prop 'pending' que controlará el estado de carga desde fuera.
interface FormSubmitButtonProps extends ButtonProps {
  children: React.ReactNode;
  pending?: boolean; // La prop que controlará el estado de carga, ya no depende de useFormStatus.
}

export function FormSubmitButton({ children, pending, ...props }: FormSubmitButtonProps) {
  return (
    <Button type="submit" {...props} aria-disabled={pending} disabled={pending}>
      {/* Muestra el loader si la prop 'pending' es verdadera */}
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
