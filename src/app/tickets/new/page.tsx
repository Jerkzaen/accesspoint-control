// Importar el componente TicketForm y renderizarlo en la página NewPage.
import { TicketForm } from "@/components/ticket-form";

// Definir la función NewPage que renderiza el componente TicketForm.  
function NewPage() {
  return (
    <div className="flex justify-center items-center h-screen">
      <TicketForm />
    </div>
  );
}
// Exportar la función NewPage.
export default NewPage;
