import { View, Text } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-surface p-6">
      <Text className="text-2xl font-bold text-slate-900">Inicio</Text>
      <Text className="text-base text-slate-500 mt-2 text-center">
        TODO: Saludo personalizado, próximo workout, acceso rápido al coach
      </Text>
    </View>
  );
}
