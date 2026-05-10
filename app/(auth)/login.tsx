import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '@/components/ui';
import { useTheme } from '@/theme';
import { signInWithEmail, signInWithGoogle } from '@/services';

const DEMO_EMAIL = 'demo@gohan.ai';
const DEMO_PASSWORD = 'GohanDemo2026!';

// Web-only: the landing iframe loads `${APP_URL}?autoLogin=demo` so
// visitors land on the home tab without ever seeing the login form.
function shouldAutoLogin() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('autoLogin') === 'demo';
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [autoLoginActive] = useState(shouldAutoLogin);
  const autoTriggered = useRef(false);
  const theme = useTheme();

  useEffect(() => {
    if (!autoLoginActive || autoTriggered.current) return;
    autoTriggered.current = true;
    void signInWithEmail(DEMO_EMAIL, DEMO_PASSWORD).then(({ error: authError }) => {
      if (authError) setError(authError.message);
    });
  }, [autoLoginActive]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Ingresá email y contraseña');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { error: authError } = await signInWithEmail(email, password);
      if (authError) {
        setError(authError.message);
        return;
      }
    } catch {
      setError('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const { error: authError } = await signInWithGoogle();
      if (authError) {
        setError(authError.message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error con Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  if (autoLoginActive) {
    return (
      <View className="flex-1 bg-white items-center justify-center" style={{ gap: 16 }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text className="text-sm text-slate-500">Cargando demo…</Text>
        {error && <Text className="text-sm text-red-500 px-6 text-center">{error}</Text>}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: 24 }}>
          <View className="items-center">
            {theme.logoUrl ? (
              <Image
                source={{ uri: theme.logoUrl }}
                className="w-16 h-16 rounded-2xl"
              />
            ) : (
              <View
                className="w-16 h-16 rounded-2xl items-center justify-center"
                style={{ backgroundColor: theme.primary }}
              >
                <Ionicons name="barbell" size={32} color="#FFFFFF" />
              </View>
            )}
            <Text className="text-3xl font-bold text-slate-900 mt-4">
              {theme.brandName}
            </Text>
            <Text className="text-base text-slate-500 mt-1">
              Tu personal trainer con IA
            </Text>
          </View>

          <View style={{ gap: 16 }}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="vos@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Input
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
            />
            {error && <Text className="text-sm text-red-500">{error}</Text>}
            <Button
              label="Iniciar sesión"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              backgroundColor="#FF6B00"
            />
            <Button
              label="Continuar con Google"
              variant="secondary"
              fullWidth
              loading={googleLoading}
              onPress={handleGoogle}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
