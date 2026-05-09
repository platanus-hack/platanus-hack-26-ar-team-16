import { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '@/components/ui';
import { useTheme } from '@/theme';
import { signInWithEmail, signInWithGoogle } from '@/services';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const theme = useTheme();

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
      // On success, onAuthStateChange in app/_layout.tsx redirects out of (auth).
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error con Google');
    } finally {
      setGoogleLoading(false);
    }
  };

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
                style={{ width: 64, height: 64, borderRadius: 16 }}
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
