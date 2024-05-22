// Componete que renderiza un ticket en la lista de tickets de un proyecto en el dashboard del usuario logeado
function TaskCard({ ticket }) {
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
