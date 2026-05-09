import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
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
