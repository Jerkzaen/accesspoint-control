// aqui es donde se crea el formato del ticket donde muestra 2 datos el titulo y la descripcion del ticket
// Importar React y el hook de estado de React para la aplicacion

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";

// Definir la  interfaz de ticket para el componente de tarjeta de ticket
interface Ticket {
  title: string;
  description: string;
  priority: string;
  createAt: string;
}
// Definir el componente de la tarjeta de ticket  en el dashboard del usuario logeado en la aplicacion
function TaskCard({ ticket }: { ticket: Ticket }) {
  // Renderiza el componente
  return (
    <div className="bg-gray-800 py-5 text-white rounded-md hover:cursor-pointer hover:bg-gray-700">
      <Card key={ticket.title}>
        <CardHeader><CardTitle>{ticket.title}</CardTitle></CardHeader>
        <Badge>{ticket.priority}</Badge>
        <CardContent>
          <p>{ticket.description}</p>
          <span>{new Date(ticket.createAt).toDateString()}</span>
        </CardContent>
        <CardFooter className="flex gap-x-2 justify-end">
          <Button variant="destructive">Eliminar</Button>
          <Button>Modificar</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
// Exporta el componente
export default TaskCard;
