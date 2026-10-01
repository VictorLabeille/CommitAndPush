import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import type { Exercise, Routine } from '@/store/types';
import { colors, radii, touch } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

interface Props {
  routine: Routine | null;
  /** Tous les exercices, archivés inclus, pour résoudre les noms. */
  exercises: Exercise[];
  onClose: () => void;
}

/**
 * Résumé d'une routine : ses exercices, dans l'ordre. Lecture seule (décision du
 * 2026-10-01) : la modification reste dans le menu ⋯ de la carte.
 */
export function RoutineSummarySheet({ routine, exercises, onClose }: Props) {
  const names = (routine?.exerciseIds ?? []).map(
    (id) => exercises.find((e) => e.id === id)?.name ?? 'Exercice archivé',
  );

  return (
    <BottomSheet visible={!!routine} onClose={onClose} title={routine?.name}>
      <ScrollView style={styles.list}>
        {names.map((name, i) => (
          <View key={`${i}-${name}`} style={styles.row}>
            <Text style={styles.num}>{i + 1}</Text>
            <Text style={styles.name} numberOfLines={2}>
              {name}
            </Text>
          </View>
        ))}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { flexShrink: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: touch.min,
    paddingHorizontal: 12,
    backgroundColor: colors.card,
    borderRadius: radii.input,
    marginBottom: 8,
  },
  num: { fontFamily: fonts.mono.bold, fontSize: 13, color: colors.gold, width: 18, textAlign: 'center' },
  name: { flex: 1, fontFamily: fonts.grotesk.medium, fontSize: 15, color: colors.ink },
});
