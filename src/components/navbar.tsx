// Import the ModeToggle component and use it in the Navbar component
import { ModeToggle } from "./theme-toggle-button";
import { Separator } from "./ui/separator";

// Define the Navbar component
function Navbar() {
  return (
    <div className="h-full px-3 py-4 flex justify-end my-2">
      <div className="flex gap-x-2 mb-1 mt-1 items-center">
        <ModeToggle />
      </div>
    </div>
  );
}
export default Navbar;
