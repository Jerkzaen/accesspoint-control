import { getSucursales } from '../../actions/sucursalActions';
import { getEmpresas } from '@/app/actions/empresaActions';

import SucursalesClientPage from './SucursalesClientPage';

export default async function SucursalesServerPage() {
  const initialSucursales = await getSucursales();
  const initialEmpresasResult = await getEmpresas();
  const initialEmpresas = initialEmpresasResult.success ? initialEmpresasResult.data : [];


  return (
    <SucursalesClientPage
      initialSucursales={initialSucursales}
      initialEmpresas={initialEmpresas}

    />
  );
}