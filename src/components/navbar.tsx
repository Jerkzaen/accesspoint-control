// Import the ModeToggle component and use it in the Navbar component
"use client";
import { signIn } from "next-auth/react";
import { ModeToggle } from "./theme-toggle-button";
import { Button } from "./ui/button";

// Define the Navbar component
function Navbar() {
  return (
    <div className="h-full px-3 py-1 flex justify-end my-2 border-2 border-r">
      <div className="flex px-2 ">
        <Button onClick={() => signIn()}> Sig in </Button>
      </div>
      <div className="flex gap-x-2 mb-1 mt-1 items-center">
        <ModeToggle />
      </div>
    </div>
  );
}
export default Navbar;
