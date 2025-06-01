"use client";
import { ModeToggle } from "./theme-toggle-button";

// Este Navbar parece redundante si tienes un Header.tsx más completo.
// Si solo es para el ModeToggle, considera integrarlo en Header.tsx.
function Navbar() {
  return (
    <div className="flex justify-end items-center p-1"> {/* Reducido padding */}
      <ModeToggle />
    </div>
  );
}
export default Navbar;
