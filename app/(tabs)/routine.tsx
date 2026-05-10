import { router } from 'expo-router';
import { CoachRoutineView } from '@/components/GohanCoachViews';
import { StandaloneCoachProvider } from '@/components/StandaloneCoachProvider';

// Same render path as the embedded module; only the navigation callback
// is wired to expo-router because that's standalone-shell-specific.
export default function RoutineScreen() {
  return (
    <StandaloneCoachProvider>
      <CoachRoutineView onRequestChat={() => router.push('/(tabs)/coach')} />
    </StandaloneCoachProvider>
  );
}
