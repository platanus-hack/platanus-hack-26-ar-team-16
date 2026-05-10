import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { useOnboardingStore, useAuthStore, useChatStore, toast } from '@/store';
import { StandaloneCoachProvider } from '@/components/StandaloneCoachProvider';
import { sendUserMessage } from '@/modules/chat/ChatManager';
import { getActiveRoutine } from '@/services/routines';
import type { Routine } from '@/types';
import { DAY_LABELS } from '@/types';
import {
  ONBOARDING_QUESTIONS,
  GOAL_TO_PREFERENCE,
  buildSummaryMessage,
  type OnboardingQuestionId,
} from '@/modules/onboarding/questions';

const CUSTOM_OPTION_ID = '__custom__';

type Phase = 'wizard' | 'loading' | 'review';
type AnswerMap = Partial<Record<OnboardingQuestionId, string[]>>;
type CustomMap = Partial<Record<OnboardingQuestionId, string>>;

const TIPS = [
  'Siempre calentá 5-10 minutos antes de entrenar.',
  'El descanso entre series es tan importante como el ejercicio.',
  'La técnica correcta vale más que el peso en la barra.',
  'Hidratate bien: mínimo 2 litros por día.',
  'El sueño es cuando el músculo crece — no te lo robes.',
  'La consistencia supera a la intensidad a largo plazo.',
  'Escuchá tu cuerpo: el dolor articular no es progreso.',
  'La progresión gradual es la clave para evitar lesiones.',
];

function formatAnswer(
  selectedIds: string[],
  customText: string | undefined,
  questionId: OnboardingQuestionId,
): string {
  const labels: string[] = [];
  for (const id of selectedIds) {
    if (id === CUSTOM_OPTION_ID) continue;
    const opt = ONBOARDING_QUESTIONS.find((q) => q.id === questionId)?.options.find(
      (o) => o.id === id,
    );
    if (opt) labels.push(opt.label);
  }
  if (customText && customText.trim()) labels.push(customText.trim());
  return labels.join(', ');
}

// ─── Loading screen ──────────────────────────────────────────────────────────

function LoadingScreen({
  c,
  onSkip,
  onHome,
}: {
  c: ReturnType<typeof useTheme>['tenant']['colors'];
  onSkip: () => void;
  onHome: () => void;
}) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 32 }}>
        <ActivityIndicator size="large" color={c.primary} />
        <View style={{ gap: 12, alignItems: 'center' }}>
          <Text style={{ color: c.text, fontSize: 22, fontWeight: '700', textAlign: 'center' }}>
            Armando tu rutina...
          </Text>
          <Text style={{ color: c.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
            Esto puede tardar unos segundos.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: c.surface,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: c.border,
            width: '100%',
            gap: 8,
          }}
        >
          <Text style={{ color: c.primary, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 }}>
            💡 CONSEJO
          </Text>
          <Text style={{ color: c.text, fontSize: 15, lineHeight: 22, fontWeight: '500' }}>
            {TIPS[tipIndex]}
          </Text>
        </View>
      </View>

      {/* Footer: skip + home */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 16,
          gap: 10,
          borderTopWidth: 1,
          borderTopColor: c.border,
        }}
      >
        <Pressable
          onPress={onSkip}
          style={({ pressed }) => ({
            backgroundColor: c.primary,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: 'center',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ color: c.onPrimary, fontSize: 15, fontWeight: '700' }}>
            Ir a rutinas
          </Text>
        </Pressable>
        <Pressable onPress={onHome} hitSlop={8} style={{ alignItems: 'center', paddingVertical: 4 }}>
          <Text style={{ color: c.textMuted, fontSize: 14, fontWeight: '600' }}>
            Volver al inicio
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Review screen ───────────────────────────────────────────────────────────

function ReviewScreen({
  routine,
  c,
  onConfirm,
}: {
  routine: Routine;
  c: ReturnType<typeof useTheme>['tenant']['colors'];
  onConfirm: () => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          gap: 20,
          paddingBottom: 120,
        }}
      >
        <View style={{ gap: 6 }}>
          <Text style={{ color: c.text, fontSize: 26, fontWeight: '700' }}>
            ¡Tu rutina está lista! 🎉
          </Text>
          <Text style={{ color: c.textMuted, fontSize: 15, lineHeight: 22 }}>
            {routine.name}
          </Text>
        </View>

        {routine.days.map((day) => (
          <View
            key={day.id}
            style={{
              backgroundColor: c.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: c.border,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                backgroundColor: c.primary,
                paddingHorizontal: 16,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: c.onPrimary, fontSize: 14, fontWeight: '700' }}>
                {DAY_LABELS[day.dayOfWeek]} — {day.label}
              </Text>
            </View>
            <View style={{ padding: 12, gap: 8 }}>
              {day.exercises.map((ex) => (
                <View
                  key={ex.id}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: c.text, fontSize: 14, fontWeight: '500', flex: 1 }}>
                    {ex.exerciseName}
                  </Text>
                  <Text style={{ color: c.textMuted, fontSize: 13 }}>
                    {ex.sets}×{ex.reps}
                    {ex.weightKg ? ` @ ${ex.weightKg}kg` : ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <Text style={{ color: c.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
          Es un punto de partida. Podés ajustarla en cualquier momento desde el chat.
        </Text>
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderTopWidth: 1,
          borderTopColor: c.border,
          backgroundColor: c.background,
        }}
      >
        <Pressable
          onPress={onConfirm}
          style={({ pressed }) => ({
            backgroundColor: c.primary,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ color: c.onPrimary, fontSize: 16, fontWeight: '700' }}>
            Ver mi rutina completa
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Wizard ──────────────────────────────────────────────────────────────────

function OnboardingWizardInner() {
  const { tenant } = useTheme();
  const c = tenant.colors;
  const router = useRouter();
  const markVisited = useOnboardingStore((s) => s.markVisited);
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    markVisited();
  }, [markVisited]);

  const [phase, setPhase] = useState<Phase>('wizard');
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [customText, setCustomText] = useState<CustomMap>({});
  const [submitting, setSubmitting] = useState(false);

  // Track streaming to detect when routine generation completes.
  // We watch isStreaming: when it starts (true) and then ends (false) while
  // in loading phase, we try to fetch the newly created routine.
  // This is more reliable than watching onboardingCompleted because ChatManager
  // guards that update with `if (!user.onboardingCompleted)`.
  const isStreaming = useChatStore((s) => s.streaming.isStreaming);
  const streamingStarted = useRef(false);

  useEffect(() => {
    if (phase !== 'loading') return;
    if (isStreaming) {
      streamingStarted.current = true;
      return;
    }
    if (!streamingStarted.current || !userId) return;
    streamingStarted.current = false;
    getActiveRoutine(userId)
      .then((r) => {
        if (r) {
          setRoutine(r);
          setPhase('review');
        } else {
          router.replace('/(tabs)/routine');
        }
      })
      .catch(() => router.replace('/(tabs)/routine'));
  }, [phase, isStreaming, userId, router]);

  const question = ONBOARDING_QUESTIONS[stepIndex];
  const total = ONBOARDING_QUESTIONS.length;
  const isLast = stepIndex === total - 1;

  const selected = answers[question?.id] ?? [];
  const custom = customText[question?.id] ?? '';
  const customActive = selected.includes(CUSTOM_OPTION_ID);

  const canAdvance = useMemo(() => {
    if (!question) return false;
    if (selected.length === 0 && !customActive) return false;
    if (customActive && custom.trim().length === 0) return false;
    return true;
  }, [question, selected, custom, customActive]);

  const toggleOption = (optId: string) => {
    if (!question) return;
    setAnswers((prev) => {
      const cur = prev[question.id] ?? [];
      if (question.multi) {
        const next = cur.includes(optId)
          ? cur.filter((x) => x !== optId)
          : [...cur, optId];
        return { ...prev, [question.id]: next };
      }
      return { ...prev, [question.id]: [optId] };
    });
  };

  const goNext = () => {
    if (isLast) {
      void finalize();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const goBack = () => {
    if (stepIndex === 0) return;
    setStepIndex((i) => i - 1);
  };

  const skipQuestion = () => {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.id]: [] }));
    if (isLast) {
      void finalize();
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const exit = () => {
    router.replace('/(tabs)');
  };

  const finalize = async () => {
    setSubmitting(true);
    try {
      const composite: Record<OnboardingQuestionId, string> = {} as Record<
        OnboardingQuestionId,
        string
      >;
      for (const q of ONBOARDING_QUESTIONS) {
        composite[q.id] = formatAnswer(answers[q.id] ?? [], customText[q.id], q.id);
      }
      const message = buildSummaryMessage(composite);
      void sendUserMessage(message);
      setPhase('loading');
    } catch {
      toast.error('No pudimos enviar tu rutina. Probá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (phase === 'loading') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top', 'bottom']}>
        <LoadingScreen
          c={c}
          onSkip={() => router.replace('/(tabs)/routine')}
          onHome={() => router.replace('/(tabs)')}
        />
      </SafeAreaView>
    );
  }

  if (phase === 'review' && routine) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top', 'bottom']}>
        <ReviewScreen
          routine={routine}
          c={c}
          onConfirm={() => router.replace('/(tabs)/routine')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: c.background }}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header: progress + close */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 12,
            gap: 12,
          }}
        >
          <Pressable
            onPress={exit}
            hitSlop={12}
            accessibilityLabel="Cerrar onboarding"
          >
            <Ionicons name="close" size={26} color={c.text} />
          </Pressable>
          <View style={{ flex: 1, gap: 6 }}>
            <View
              style={{
                height: 4,
                backgroundColor: c.border,
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${((stepIndex + 1) / total) * 100}%`,
                  height: '100%',
                  backgroundColor: c.primary,
                }}
              />
            </View>
            <Text style={{ color: c.textMuted, fontSize: 12, letterSpacing: 0.5 }}>
              Paso {stepIndex + 1} de {total}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingVertical: 24,
            gap: 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ gap: 8 }}>
            <Text
              style={{
                color: c.text,
                fontSize: 28,
                fontWeight: '700',
                lineHeight: 34,
                textAlign: 'center',
              }}
            >
              {question.title}
            </Text>
            {question.subtitle && (
              <Text
                style={{
                  color: c.textMuted,
                  fontSize: 15,
                  textAlign: 'center',
                  lineHeight: 22,
                }}
              >
                {question.subtitle}
              </Text>
            )}
          </View>

          <View style={{ gap: 12 }}>
            {question.options.map((opt) => {
              const isSelected = selected.includes(opt.id);
              const goalId = answers.goal?.[0];
              const aiSuggestedPrefId =
                question.id === 'preferences' && goalId
                  ? GOAL_TO_PREFERENCE[goalId]
                  : undefined;
              const isRecommended =
                opt.recommended || aiSuggestedPrefId === opt.id;
              const borderColor = isSelected
                ? c.primary
                : isRecommended
                  ? c.primary
                  : c.border;
              const bg = isSelected ? c.primary : c.surface;
              const fg = isSelected ? c.onPrimary : c.text;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => toggleOption(opt.id)}
                  style={({ pressed }) => ({
                    backgroundColor: bg,
                    borderColor,
                    borderWidth: isRecommended && !isSelected ? 2 : 1,
                    borderRadius: 14,
                    paddingHorizontal: 18,
                    paddingVertical: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      borderWidth: 2,
                      borderColor: isSelected ? c.onPrimary : c.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color={c.onPrimary} />
                    )}
                  </View>
                  <Text
                    style={{
                      color: fg,
                      fontSize: 16,
                      fontWeight: '600',
                      flex: 1,
                    }}
                  >
                    {opt.label}
                  </Text>
                  {isRecommended && !isSelected && (
                    <Text
                      style={{
                        color: c.primary,
                        fontSize: 11,
                        fontWeight: '700',
                        letterSpacing: 0.6,
                      }}
                    >
                      RECOMENDADO
                    </Text>
                  )}
                </Pressable>
              );
            })}

            {/* Custom write-in option */}
            <Pressable
              onPress={() => toggleOption(CUSTOM_OPTION_ID)}
              style={({ pressed }) => ({
                backgroundColor: customActive ? c.primary : c.surface,
                borderColor: customActive ? c.primary : c.border,
                borderWidth: 1,
                borderRadius: 14,
                paddingHorizontal: 18,
                paddingVertical: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={customActive ? c.onPrimary : c.textMuted}
              />
              <Text
                style={{
                  color: customActive ? c.onPrimary : c.text,
                  fontSize: 16,
                  fontWeight: '600',
                  flex: 1,
                }}
              >
                Otra cosa (escribilo)
              </Text>
            </Pressable>

            {customActive && (
              <TextInput
                value={custom}
                onChangeText={(t) =>
                  setCustomText((prev) => ({ ...prev, [question.id]: t }))
                }
                placeholder="Escribí tu respuesta…"
                placeholderTextColor={c.textMuted}
                multiline
                style={{
                  backgroundColor: c.surface,
                  color: c.text,
                  borderColor: c.border,
                  borderWidth: 1,
                  borderRadius: 14,
                  padding: 14,
                  minHeight: 80,
                  textAlignVertical: 'top',
                  fontSize: 15,
                }}
              />
            )}
          </View>
        </ScrollView>

        {/* Footer actions */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 16,
            gap: 10,
            borderTopWidth: 1,
            borderTopColor: c.border,
          }}
        >
          <Pressable
            onPress={goNext}
            disabled={!canAdvance || submitting}
            style={({ pressed }) => ({
              backgroundColor: c.primary,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: !canAdvance || submitting ? 0.4 : pressed ? 0.85 : 1,
            })}
          >
            {submitting ? (
              <ActivityIndicator color={c.onPrimary} />
            ) : (
              <Text
                style={{
                  color: c.onPrimary,
                  fontSize: 16,
                  fontWeight: '700',
                  letterSpacing: 0.4,
                }}
              >
                {isLast ? 'Generar mi rutina' : 'Siguiente'}
              </Text>
            )}
          </Pressable>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Pressable
              onPress={goBack}
              disabled={stepIndex === 0 || submitting}
              hitSlop={8}
              style={{ opacity: stepIndex === 0 || submitting ? 0.3 : 1 }}
            >
              <Text style={{ color: c.textMuted, fontSize: 14, fontWeight: '600' }}>
                Atrás
              </Text>
            </Pressable>
            {question.skippable && (
              <Pressable
                onPress={skipQuestion}
                disabled={submitting}
                hitSlop={8}
              >
                <Text style={{ color: c.textMuted, fontSize: 14, fontWeight: '600' }}>
                  Saltar
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function OnboardingScreen() {
  return (
    <StandaloneCoachProvider>
      <OnboardingWizardInner />
    </StandaloneCoachProvider>
  );
}
