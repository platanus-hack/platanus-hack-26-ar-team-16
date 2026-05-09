import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function RoutineDayDetail() {
  const { day } = useLocalSearchParams<{ day: string }>();

  return (
    <View className="flex-1 items-center justify-center bg-surface p-6">
      <Text className="text-2xl font-bold text-slate-900">Día {day}</Text>
      <Text className="text-base text-slate-500 mt-2 text-center">
        TODO: Lista de ejercicios del día con peso, series, reps
      </Text>
    </View>
  );
}
