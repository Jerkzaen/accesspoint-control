    import React from "react";
    import { ModeToggle } from "./theme-toggle-button";

    const Header = () => {
      // Este Header se posicionará por el layout padre.
      // 'h-14' (56px) es una altura común para cabeceras.
      // 'flex-shrink-0' para que no se encoja si el contenido principal es muy grande.
      // 'border-b' para una separación visual.
      // 'bg-background' para asegurar que tenga el color de fondo del tema.
      // 'z-10' por si hay elementos que pudieran solaparse (aunque no debería ser necesario si no es sticky/fixed).
      return (
        <header className="flex items-center justify-between px-4 sm:px-6 h-14 border-b bg-background flex-shrink-0">
          <div>
            {/* Espacio para un logo o título global de la aplicación si es necesario */}
            {/* <h1 className="text-xl font-semibold">AccessPoint Control</h1> */}
          </div>
          <div className="flex items-center gap-4">
            <ModeToggle />
            {/* Aquí podrían ir otros íconos o elementos del header, 
                como un menú de usuario si no se maneja en la sidebar */}
          </div>
        </header>
      );
    };

    export default Header;
    