// Import the ModeToggle component and use it in the Navbar component
import { ModeToggle } from "./theme-toggle-button";
import { Separator } from "./ui/separator";

// Define the Navbar component
function Navbar() {
  return (
    <nav className="flex justify-between my-2">
      <h1></h1>

      <div className="flex gap-x-2 mb-1 mt-1 items-center">
        <ModeToggle />
      </div>
    </nav>
  );
}
export default Navbar;
