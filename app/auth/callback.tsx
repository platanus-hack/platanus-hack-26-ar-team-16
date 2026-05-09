import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/services";

/**
 * OAuth callback — Google (and any other Supabase OAuth provider) redirects
 * here with `?code=…` after the user grants consent. supabase-js auto-handles
 * the code exchange via `detectSessionInUrl: true` on web, and our
 * `signInWithGoogle` helper handles it explicitly on native via
 * `exchangeCodeForSession`. Either way, by the time this screen mounts we
 * just need to wait for the session to land in `onAuthStateChange` and
 * bounce the user home. The router's `useProtectedRoute` would do this
 * automatically too, but the explicit redirect avoids a brief flash of the
 * 404 / route content.
 */
export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const settle = async () => {
      // Give supabase-js up to ~5s to exchange the code and emit the new
      // session before we bail to home anyway. If something went wrong the
      // protected-route guard will bounce us back to /login.
      const start = Date.now();
      while (!cancelled && Date.now() - start < 5000) {
        const { data } = await supabase.auth.getSession();
        if (data.session) break;
        await new Promise((r) => setTimeout(r, 200));
      }
      if (!cancelled) router.replace("/");
    };
    settle();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0F172A",
        gap: 16,
      }}
    >
      <ActivityIndicator color="#FFFFFF" size="large" />
      <Text style={{ color: "#FFFFFF", fontSize: 14, opacity: 0.75 }}>
        Iniciando sesión…
      </Text>
    </View>
  );
}
