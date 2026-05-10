import { Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToastStore, type ToastType } from '@/store';

const STYLES: Record<
  ToastType,
  { bg: string; border: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string }
> = {
  success: { bg: '#16A34A', border: '#15803D', icon: 'checkmark-circle', iconColor: '#FFFFFF' },
  error: { bg: '#DC2626', border: '#B91C1C', icon: 'alert-circle', iconColor: '#FFFFFF' },
  info: { bg: '#2563EB', border: '#1D4ED8', icon: 'information-circle', iconColor: '#FFFFFF' },
  warning: { bg: '#D97706', border: '#B45309', icon: 'warning', iconColor: '#FFFFFF' },
};

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  const isWeb = Platform.OS === 'web';

  return (
    <View
      pointerEvents="box-none"
      style={
        isWeb
          ? {
              position: 'absolute',
              right: 16,
              bottom: 16,
              gap: 8,
              zIndex: 9999,
              maxWidth: 360,
            }
          : {
              position: 'absolute',
              top: 48,
              left: 16,
              right: 16,
              gap: 8,
              zIndex: 9999,
              alignItems: 'center',
            }
      }
    >
      {toasts.map((t) => {
        const s = STYLES[t.type];
        return (
          <Pressable
            key={t.id}
            onPress={() => dismiss(t.id)}
            className="flex-row items-center px-3 py-2 rounded-xl"
            style={{
              backgroundColor: s.bg,
              borderWidth: 1,
              borderColor: s.border,
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
              maxWidth: isWeb ? 360 : undefined,
              alignSelf: isWeb ? 'flex-end' : 'auto',
            }}
          >
            <Ionicons name={s.icon} size={18} color={s.iconColor} />
            <Text className="text-white text-sm font-medium ml-2 flex-shrink" numberOfLines={3}>
              {t.message}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
