import { getSucursales } from '../../actions/sucursalActions';
import { getEmpresas } from '@/app/actions/empresaActions';
import { getPaises } from '@/app/actions/geografiaActions';
import { SucursalesClientPage } from './SucursalesClientPage';

export default async function SucursalesServerPage() {
  const initialSucursales = await getSucursales();
  const initialEmpresasResult = await getEmpresas();
  const initialEmpresas = initialEmpresasResult.success ? initialEmpresasResult.data : [];
  const initialPaises = await getPaises();

  return (
    <SucursalesClientPage
      initialSucursales={initialSucursales}
      initialEmpresas={initialEmpresas}
      initialPaises={initialPaises}
    />
  );
}