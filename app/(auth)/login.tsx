import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Button, Input } from '@/components/ui';
import { useTheme } from '@/theme';
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from '@/services';
import { toast } from '@/store';

type Mode = 'login' | 'register';

const DEMO_EMAIL = 'demo@gohan.ai';
const DEMO_PASSWORD = 'GohanDemo2026!';

// Web-only: the landing iframe loads `${APP_URL}?autoLogin=demo` so
// visitors land on the home tab without ever seeing the login form.
function shouldAutoLogin() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('autoLogin') === 'demo';
}

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [autoLoginActive] = useState(shouldAutoLogin);
  const autoTriggered = useRef(false);
  const theme = useTheme();

  const isRegister = mode === 'register';

  useEffect(() => {
    if (!autoLoginActive || autoTriggered.current) return;
    autoTriggered.current = true;
    void signInWithEmail(DEMO_EMAIL, DEMO_PASSWORD).then(({ error: authError }) => {
      if (authError) setError(authError.message);
    });
  }, [autoLoginActive]);

  const handleSubmit = async () => {
    if (!email || !password) {
      const msg = 'Ingresá email y contraseña';
      setError(msg);
      toast.warning(msg);
      return;
    }
    if (isRegister) {
      if (password.length < 6) {
        const msg = 'La contraseña debe tener al menos 6 caracteres';
        setError(msg);
        toast.warning(msg);
        return;
      }
      if (password !== confirmPassword) {
        const msg = 'Las contraseñas no coinciden';
        setError(msg);
        toast.warning(msg);
        return;
      }
    }
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        const { data, error: signUpError } = await signUpWithEmail(email, password);
        if (signUpError) {
          setError(signUpError.message);
          toast.error(signUpError.message);
          return;
        }
        if (!data.session) {
          const { error: signInError } = await signInWithEmail(email, password);
          if (signInError) {
            toast.info('Te enviamos un email para confirmar tu cuenta. Revisá tu inbox.');
            return;
          }
        }
        toast.success('¡Cuenta creada! Bienvenido.');
      } else {
        const { error: authError } = await signInWithEmail(email, password);
        if (authError) {
          setError(authError.message);
          toast.error(authError.message);
          return;
        }
        toast.success('Sesión iniciada');
      }
    } catch {
      const msg = isRegister ? 'Error al registrarse' : 'Error al iniciar sesión';
      setError(msg);
      toast.error(msg);
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
        toast.error(authError.message);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error con Google';
      setError(msg);
      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const toggleMode = () => {
    setError(null);
    setConfirmPassword('');
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
  };

  if (autoLoginActive) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ gap: 16, backgroundColor: theme.tenant.colors.background }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <Text className="text-sm" style={{ color: theme.tenant.colors.textMuted }}>
          Cargando demo…
        </Text>
        {error && (
          <Text className="text-sm px-6 text-center" style={{ color: theme.tenant.colors.danger }}>
            {error}
          </Text>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
      style={{ backgroundColor: theme.tenant.colors.background }}
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
              <Image
                source={require('../../assets/Logo.png')}
                style={{ width: 80, height: 80 }}
                resizeMode="contain"
              />
            )}
            <Text
              className="text-3xl font-bold mt-4"
              style={{ color: theme.tenant.colors.text }}
            >
              {theme.brandName}
            </Text>
            <Text
              className="text-base mt-1"
              style={{ color: theme.tenant.colors.textMuted }}
            >
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
            {isRegister && (
              <Input
                label="Confirmar contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                secureTextEntry
              />
            )}
            {error && <Text className="text-sm text-red-500">{error}</Text>}
            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 rounded-2xl py-3 items-center justify-center"
              style={({ pressed }) => ({ opacity: loading ? 0.5 : pressed ? 0.85 : 1 })}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-semibold">
                  {isRegister ? 'Registrate' : 'Login'}
                </Text>
              )}
            </Pressable>
            <Button
              label="Continuar con Google"
              variant="secondary"
              fullWidth
              loading={googleLoading}
              onPress={handleGoogle}
            />
            <Pressable onPress={toggleMode} className="items-center pt-2">
              <Text
                className="text-sm"
                style={{ color: theme.tenant.colors.textMuted }}
              >
                {isRegister ? '¿Ya tenés cuenta? ' : '¿No tenés cuenta? '}
                <Text className="font-semibold" style={{ color: theme.primary }}>
                  {isRegister ? 'Iniciá sesión' : 'Registrate'}
                </Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
