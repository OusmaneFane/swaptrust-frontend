import { fetchLiveRate } from '@/services/rateService';
import { LandingView } from '@/components/landing/LandingView';
import { settingsApi } from '@/services/api';

export default async function Home() {
  const [initialRate, settings] = await Promise.all([
    fetchLiveRate(),
    settingsApi.public(),
  ]);
  return (
    <LandingView
      initialRate={initialRate}
      commissionPercent={settings.commissionPercent}
    />
  );
}
