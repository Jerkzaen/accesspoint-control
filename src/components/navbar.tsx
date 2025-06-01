// Import the ModeToggle component and use it in the Navbar component
"use client";
// import { signIn } from "next-auth/react"; // Comentado temporalmente
import { ModeToggle } from "./theme-toggle-button";
import { Button } from "./ui/button";

// Define the Navbar component
function Navbar() {
  return (
    <div className="h-full px-3 py-1 flex justify-end my-2 border-2 border-r"> {/* Considera si este border-2 border-r es intencional aquí */}
      <div className="flex px-2 ">
        <Button 
          // onClick={() => signIn()} // Comentado temporalmente
          onClick={() => console.log("Sign in clickeado")} // Placeholder
        > 
          Sign in 
        </Button>
      </div>
      <div className="flex gap-x-2 mb-1 mt-1 items-center">
        <ModeToggle />
      </div>
    </div>
  );
}
export default Navbar;
