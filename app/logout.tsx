import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { signOut } from '@/services/auth';
import { useAuthStore } from '@/store';

export default function LogoutScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    signOut().finally(() => {
      logout();
      router.replace('/(auth)/login');
    });
  }, []);

  return null;
}
