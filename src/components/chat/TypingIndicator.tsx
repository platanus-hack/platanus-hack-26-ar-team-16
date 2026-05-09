import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

function Dot({ delay }: { delay: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 350, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, opacity]);
  return (
    <Animated.View
      style={{
        opacity,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#94A3B8',
      }}
    />
  );
}

export function TypingIndicator() {
  return (
    <View
      className="flex-row items-center bg-slate-100 rounded-2xl rounded-bl-md self-start mb-2 px-4 py-3"
      style={{ gap: 6 }}
    >
      <Dot delay={0} />
      <Dot delay={150} />
      <Dot delay={300} />
    </View>
  );
}
