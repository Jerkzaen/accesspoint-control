// Import the ModeToggle component and use it in the Navbar component
import Link from "next/link";
import { ModeToggle } from "./theme-toggle-button";
import { buttonVariants } from "./ui/button";

// Define the Navbar component
function Navbar() {
  return (
    <nav className="flex justify-between my-2">
      <h1>AccessPoint Control</h1>

      <div className="flex gap-x-2 items-center">
        <Link href="tickets/new" className={buttonVariants({variant: "secondary"})}>  Nuevo Ticket </Link>
        <ModeToggle />
      </div>
    </nav>
  );
}
export default Navbar;
