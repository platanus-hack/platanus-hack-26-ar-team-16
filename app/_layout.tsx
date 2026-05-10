import "../global.css";
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuthStore, useTenantStore } from "@/store";
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

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === "(auth)";
    if (!isAuthenticated && !inAuth) {
      router.replace("/(auth)/login");
      return;
    }
    if (isAuthenticated && inAuth) {
      const target = user && !user.onboardingCompleted ? "/coach" : "/";
      router.replace(target);
      return;
    }
    // Already inside the app: if a freshly-signed-up user is on any tab
    // other than coach, push them to the coach onboarding flow.
    const segs = segments as readonly string[];
    if (
      isAuthenticated &&
      user &&
      !user.onboardingCompleted &&
      segs[0] === "(tabs)" &&
      segs[1] !== "coach"
    ) {
      router.replace("/coach");
    }
  }, [isAuthenticated, segments, isLoading, user]);
}

export default function RootLayout() {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const setTenant = useTenantStore((s) => s.setTenant);

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
