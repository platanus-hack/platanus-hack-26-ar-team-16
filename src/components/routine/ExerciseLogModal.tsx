import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { Exercise } from '../../modules/routine/types';
import { saveLog } from '../../services/exerciseLog';

interface ExerciseLogModalProps {
  exercise: Exercise | null;
  onClose: (saved: boolean) => void;
}

export function ExerciseLogModal({ exercise, onClose }: ExerciseLogModalProps) {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [saving, setSaving] = useState(false);
  const repsRef = useRef<TextInput>(null);

  useEffect(() => {
    if (exercise) {
      setWeight('');
      setReps('');
    }
  }, [exercise?.id]);

  const handleSave = async () => {
    if (!exercise || !reps.trim()) return;
    setSaving(true);
    try {
      await saveLog(exercise.id, {
        weight: weight.trim() ? parseFloat(weight) : null,
        reps: parseInt(reps, 10),
      });
      onClose(true);
    } catch {
      onClose(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={!!exercise}
      animationType="slide"
      transparent
      onRequestClose={() => onClose(false)}
    >
      <Pressable style={styles.backdrop} onPress={() => onClose(false)} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.sheetWrap}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>Registrar serie</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {exercise?.name} · {exercise?.sets}×{exercise?.reps}
          </Text>

          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Peso (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder="—"
                placeholderTextColor="#555"
                keyboardType="decimal-pad"
                returnKeyType="next"
                onSubmitEditing={() => repsRef.current?.focus()}
                autoFocus
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Reps</Text>
              <TextInput
                ref={repsRef}
                style={styles.input}
                value={reps}
                onChangeText={setReps}
                placeholder="—"
                placeholderTextColor="#555"
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
            </View>
          </View>

          <Pressable
            onPress={handleSave}
            disabled={saving || !reps.trim()}
            style={({ pressed }) => [
              styles.saveBtn,
              { opacity: saving || !reps.trim() ? 0.4 : pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.saveBtnText}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheetWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#444',
    alignSelf: 'center',
    marginBottom: 4,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: '#888',
    fontSize: 13,
    marginTop: -8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
    gap: 6,
  },
  label: {
    color: '#888',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  saveBtn: {
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
