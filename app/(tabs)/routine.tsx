import { View, Text } from "react-native";

export default function RoutineScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-surface p-6">
      <Text className="text-2xl font-bold text-slate-900">Rutina</Text>
      <Text className="text-base text-slate-500 mt-2 text-center">
        TODO: Calendario, selector de día, lista de ejercicios
      </Text>
    </View>
  );
}
