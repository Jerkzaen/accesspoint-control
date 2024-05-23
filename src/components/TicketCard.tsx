// aqui es donde se crea el formato del ticket donde muestra 2 datos el titulo y la descripcion del ticket
// Importar React y el hook de estado de React para la aplicacion
// Definir la  interfaz de ticket para el componente de tarjeta de ticket
interface Ticket {
  title: string;
  description: string;
}
// Definir el componente de la tarjeta de ticket  en el dashboard del usuario logeado en la aplicacion
function TaskCard({ ticket }: { ticket: Ticket }) {
  // Renderiza el componente
  return (
    <div className="bg-gray-800 p-10 text-white rounded-md hover:cursor-pointer hover:bg-gray-700">
      <h3> {ticket.title} </h3>
      <p> {ticket.description} </p>
    </div>
  );
}
// Exporta el componente
export default TaskCard;
