import { fetchLiveRate } from '@/services/rateService';
import { LandingView } from '@/components/landing/LandingView';

export default async function Home() {
  const initialRate = await fetchLiveRate();
  return <LandingView initialRate={initialRate} />;
}
