    import { TicketForm } from "@/components/ticket-form";

    export default function NewTicketPage() {
      return (
        // El padding general de la página se aplica aquí para centrar el formulario.
        // h-full y flex para que el centrado funcione bien dentro del <main> del layout.
        <div className="flex flex-col items-center justify-start h-full p-4 md:p-6">
          <TicketForm />
        </div>
      );
    }
    