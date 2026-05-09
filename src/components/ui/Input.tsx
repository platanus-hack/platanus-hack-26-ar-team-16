import { TextInput, View, Text, type TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...rest }: InputProps) {
  return (
    <View className="w-full">
      {label && (
        <Text className="text-sm font-medium text-slate-700 mb-1.5">{label}</Text>
      )}
      <TextInput
        placeholderTextColor="#94A3B8"
        {...rest}
        className={`px-4 py-3 bg-white border ${error ? 'border-red-400' : 'border-slate-200'} rounded-2xl text-base text-slate-900 ${className ?? ''}`}
      />
      {error && <Text className="text-sm text-red-500 mt-1">{error}</Text>}
    </View>
  );
}
