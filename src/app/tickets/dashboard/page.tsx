import LeftColumnTickets from "@/components/LeftColumnTickets";
import RightColumnTickets from "@/components/RightColumnTickets";

export default function TicketsDashboardPage() {
  return (
    <div  className="flex pt-6">
      <LeftColumnTickets />
      <RightColumnTickets/>
    </div>
    
  );
}