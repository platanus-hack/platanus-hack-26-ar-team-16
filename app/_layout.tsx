import "../global.css";
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuthStore, useTenantStore, useOnboardingStore } from "@/store";
import { ToastHost } from "@/components/ui";
import {
  getProfile,
  getTenantById,
  onAuthStateChange,
} from "@/services";

function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const user = useAuthStore((s) => s.user);
  const hasVisitedOnboarding = useOnboardingStore((s) => s.hasVisited);
  const onboardingHydrated = useOnboardingStore((s) => s.isHydrated);

  useEffect(() => {
    if (isLoading || !onboardingHydrated) return;
    const segs = segments as readonly string[];
    const inAuth = segs[0] === "(auth)";

    if (!isAuthenticated && !inAuth) {
      router.replace("/(auth)/login");
      return;
    }

    // After login, send first-time users to the onboarding wizard once.
    // Once they've visited (even if they skipped or backed out), the flag is
    // persisted and we never auto-redirect again — they can navigate freely.
    const needsOnboarding =
      isAuthenticated && user && !user.onboardingCompleted && !hasVisitedOnboarding;

    if (isAuthenticated && inAuth) {
      router.replace(needsOnboarding ? "/onboarding" : "/");
      return;
    }
    if (needsOnboarding && segs[0] !== "onboarding") {
      router.replace("/onboarding");
    }
  }, [
    isAuthenticated,
    segments,
    isLoading,
    user,
    hasVisitedOnboarding,
    onboardingHydrated,
  ]);
}

export default function RootLayout() {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const setTenant = useTenantStore((s) => s.setTenant);
  const hydrateOnboarding = useOnboardingStore((s) => s.hydrate);

  useEffect(() => {
    void hydrateOnboarding();
  }, [hydrateOnboarding]);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (session) => {
      if (session?.user) {
        try {
          const profile = await getProfile(session.user.id);
          setUser(profile);
          // Hydrate the tenant store from the user's profile. Without this,
          // useTenantStore.tenant stays null and the Megatlon shell in
          // app/(tabs)/_layout.tsx never activates (its branch on
          // tenant.slug === 'megatlon' is always false).
          if (profile?.tenantId) {
            try {
              const tenant = await getTenantById(profile.tenantId);
              if (tenant) setTenant(tenant);
            } catch {
              // tenant fetch failure is non-fatal — fall back to default shell
            }
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useProtectedRoute();

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)/login" options={{ presentation: "modal" }} />
        <Stack.Screen name="onboarding" options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen
          name="routine/[day]"
          options={{
            headerShown: true,
            headerTitle: "Detalle del día",
            headerBackTitle: "Volver",
          }}
        />
      </Stack>
      <ToastHost />
    </>
  );
}
