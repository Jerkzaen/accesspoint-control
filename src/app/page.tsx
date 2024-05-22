// Importar conexion a la base de datos de mongoose
import { connectDB } from "@/utils/mongoose";
// Importar modelo de Ticket
import Ticket from "@/models/Ticket";
// Importar componente TaskCard
import TaskCard from "@/components/TicketCard";

// Funcion para cargar los tickets de la base de datos
async function loadTickets() {
  //conexion a la base de datos
  connectDB();
  //buscar todos los tickets en la base de datos
  const tickets = await Ticket.find();
  //retornar los tickets 
  return tickets;
}
// Funcion para renderizar la pagina principal 
async function HomePage() {
  //cargar los tickets de la base de datos 
  const tickets = await loadTickets();
  //retornar los tickets 
  return (
    //renderizar los tickets en el componente TaskCard 
    //grid de 3 columnas y espacio de 2 entre las columnas 
    <div className="grid grid-cols-3 gap-2">  
      {tickets.map(ticket => ( //mapear los tickets y renderizarlos en el componente TaskCard
        //renderizar el componente TaskCard con el ticket como parametro y la key como el id del ticket 
        <TaskCard ticket={ticket} key={ticket._id}/>
      ))}
    </div>
  );
}

//exportar la pagina principal 
export default HomePage;
