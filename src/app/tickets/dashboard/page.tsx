import LeftColumnTickets from "@/components/leftColumn";
import RightColumnTickets from "@/components/rightColumn";

export default function TicketsDashboardPage() {
  return (
    <div  className="flex pt-6">
      <LeftColumnTickets />
      <RightColumnTickets/>
    </div>
    
  );
}