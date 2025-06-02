    // src/components/ui/FormSubmitButton.tsx
    'use client';

    import { useFormStatus } from 'react-dom';
    import { Button, ButtonProps } from '@/components/ui/button'; // Ajusta la ruta si es necesario
    import { Loader2 } from 'lucide-react';

    interface FormSubmitButtonProps extends ButtonProps {
      children: React.ReactNode;
    }

    export function FormSubmitButton({ children, ...props }: FormSubmitButtonProps) {
      const { pending } = useFormStatus();

      return (
        <Button type="submit" {...props} aria-disabled={pending} disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {children}
        </Button>
      );
    }
    