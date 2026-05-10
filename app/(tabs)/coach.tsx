import { CoachChatView } from '@/components/GohanCoachViews';
import { StandaloneCoachProvider } from '@/components/StandaloneCoachProvider';

// The standalone tab screen is a thin wrapper around the same render path
// the embedded npm module will use (`<CoachChatView />` inside a
// `<CoachProvider>`). The auth shell at `app/_layout.tsx` already hydrates
// `useAuthStore`; here we only inject the API client whose `getAuthToken`
// reads `supabase.auth.getSession()`.
export default function CoachScreen() {
  return (
    <StandaloneCoachProvider>
      <CoachChatView />
    </StandaloneCoachProvider>
  );
}
