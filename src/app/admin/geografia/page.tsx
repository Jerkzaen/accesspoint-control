import { getPaises } from '@/app/actions/geografiaActions';
import GeografiaClientPage from './GeografiaClientPage';

export default async function GeografiaPage() {
  const initialPaises = await getPaises();

  return <GeografiaClientPage initialPaises={initialPaises} />;
}