import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { fmtNum } from '@/logic/format';
import type { WorkoutSet } from '@/store/types';
import { colors, radii, touch } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

interface Props {
  index: number;
  set: WorkoutSet;
  onWeightChange: (text: string) => void;
  onRepsChange: (text: string) => void;
  onToggle: () => void;
  /** Suppression de série (édition d'historique uniquement). */
  onRemove?: () => void;
}

/** Ligne de série : N° | Poids | Reps | Fait ✓ (+ ✕ optionnel en édition). */
export function SetRow({ index, set, onWeightChange, onRepsChange, onToggle, onRemove }: Props) {
  const [w, setW] = useState(set.weight === 0 ? '' : fmtNum(set.weight));
  const [r, setR] = useState(set.reps === 0 ? '' : String(set.reps));

  return (
    <View style={[styles.row, set.completed && styles.rowDone]}>
      <Text style={styles.index}>{index}</Text>

      <TextInput
        style={styles.input}
        value={w}
        onChangeText={(t) => {
          setW(t);
          onWeightChange(t);
        }}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={colors.muted}
        selectTextOnFocus
      />
      <TextInput
        style={styles.input}
        value={r}
        onChangeText={(t) => {
          setR(t);
          onRepsChange(t);
        }}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor={colors.muted}
        selectTextOnFocus
      />

      <Pressable
        onPress={onToggle}
        style={[styles.fait, set.completed ? styles.faitOn : styles.faitOff]}
      >
        <Ionicons
          name="checkmark"
          size={22}
          color={set.completed ? colors.white : colors.muted}
        />
      </Pressable>

      {onRemove ? (
        <Pressable onPress={onRemove} hitSlop={8} style={styles.remove}>
          <Ionicons name="close" size={18} color={colors.danger} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radii.input,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  rowDone: { backgroundColor: colors.validatedTint },
  index: {
    width: 24,
    textAlign: 'center',
    fontFamily: fonts.mono.bold,
    fontSize: 14,
    color: colors.muted,
  },
  input: {
    flex: 1,
    height: touch.input,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.input,
    backgroundColor: colors.card,
    textAlign: 'center',
    fontFamily: fonts.mono.bold,
    fontSize: 18,
    color: colors.ink,
  },
  fait: {
    width: touch.fait,
    height: touch.fait,
    borderRadius: radii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faitOff: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  faitOn: { backgroundColor: colors.green2 },
  remove: { width: 28, alignItems: 'center', justifyContent: 'center' },
});
