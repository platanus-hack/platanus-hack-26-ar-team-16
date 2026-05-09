import "../global.css";
import { useEffect } from "react";
import { Platform } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuthStore, useTenantStore } from "@/store";
import {
  getProfile,
  getTenantById,
  onAuthStateChange,
  signInWithEmail,
} from "@/services";

function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === "(auth)";
    if (!isAuthenticated && !inAuth) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuth) {
      router.replace("/");
    }
  }, [isAuthenticated, segments, isLoading]);
}

// Web-only: visiting with ?demo=1 auto-signs into the demo account so the
// landing's "Ver demo" button drops the visitor straight into the Megatlon
// shell. The password is intentionally hardcoded — this account is public,
// scoped to its own data via RLS, and exists only for live demos.
function useDemoAutoLogin() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (typeof window === "undefined") return;
    if (isLoading || isAuthenticated) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") !== "1") return;
    signInWithEmail("demo@gohan.ai", "GohanDemo2026!").catch((e) =>
      // eslint-disable-next-line no-console
      console.warn("[demo] auto-login failed", e),
    );
  }, [isAuthenticated, isLoading]);
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

  useDemoAutoLogin();
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
    </>
  );
}
