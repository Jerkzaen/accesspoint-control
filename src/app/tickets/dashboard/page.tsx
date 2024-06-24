import LeftColumnTickets from "@/components/LeftColumnTickets";
import RightColumnTickets from "@/components/RightColumnTickets";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

export default function TicketsDashboardPage() {
  return (
    
      <ResizablePanelGroup
        direction="horizontal"
        className="flex pt-12 flex-wrap w-full h-full flex-row overflow-hidden border-y-2"
      >
        <ResizablePanel defaultSize={70}>
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-semibold"><LeftColumnTickets /></span>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={30}>
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-semibold"><RightColumnTickets/></span>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
     
      
      
   
    
  );
}