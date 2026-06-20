import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Kebab } from '@/components/ui/Kebab';
import type { WorkoutExercise } from '@/store/types';
import { colors, radii, touch } from '@/theme/tokens';
import { fonts } from '@/theme/typography';
import { SetRow } from './SetRow';

interface Props {
  exercise: WorkoutExercise;
  ghostLine?: string | null;
  onKebab: () => void;
  onAddSet: () => void;
  onWeightChange: (setId: string, text: string) => void;
  onRepsChange: (setId: string, text: string) => void;
  onToggleSet: (setId: string) => void;
  onRemoveSet?: (setId: string) => void;
}

export function ExerciseCard({
  exercise,
  ghostLine,
  onKebab,
  onAddSet,
  onWeightChange,
  onRepsChange,
  onToggleSet,
  onRemoveSet,
}: Props) {
  const skipped = exercise.status === 'skipped';

  return (
    <Card style={[styles.card, skipped && styles.cardSkipped]}>
      <View style={styles.head}>
        <View style={styles.titleWrap}>
          <Text style={styles.name} numberOfLines={1}>
            {exercise.exerciseName}
          </Text>
          {skipped ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>IGNORÉ</Text>
            </View>
          ) : null}
        </View>
        <Kebab onPress={onKebab} />
      </View>

      {skipped ? null : (
        <>
          {ghostLine ? <Text style={styles.ghost}>{ghostLine}</Text> : null}

          <View style={styles.tableHead}>
            <Text style={[styles.th, styles.thIndex]}>N°</Text>
            <Text style={[styles.th, styles.thFlex]}>POIDS</Text>
            <Text style={[styles.th, styles.thFlex]}>REPS</Text>
            <Text style={[styles.th, styles.thFait]}>FAIT</Text>
            {onRemoveSet ? <View style={{ width: 28 }} /> : null}
          </View>

          {exercise.sets.map((set, i) => (
            <SetRow
              key={set.id}
              index={i + 1}
              set={set}
              onWeightChange={(t) => onWeightChange(set.id, t)}
              onRepsChange={(t) => onRepsChange(set.id, t)}
              onToggle={() => onToggleSet(set.id)}
              onRemove={onRemoveSet ? () => onRemoveSet(set.id) : undefined}
            />
          ))}

          <Button label="+ Série" variant="dashed" height={touch.min} onPress={onAddSet} style={styles.addSet} />
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.cardLarge, gap: 4 },
  cardSkipped: { opacity: 0.55 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontFamily: fonts.grotesk.bold, fontSize: 20, color: colors.ink, flexShrink: 1 },
  badge: {
    backgroundColor: colors.skipBg,
    borderRadius: radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeText: { fontFamily: fonts.grotesk.semibold, fontSize: 10, letterSpacing: 1, color: colors.danger },
  ghost: { fontFamily: fonts.mono.regular, fontSize: 12, color: colors.muted, marginTop: 4, marginBottom: 6 },
  tableHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4, marginTop: 4, marginBottom: 2 },
  th: { fontFamily: fonts.grotesk.medium, fontSize: 10, letterSpacing: 1, color: colors.muted },
  thIndex: { width: 24, textAlign: 'center' },
  thFlex: { flex: 1, textAlign: 'center' },
  thFait: { width: touch.fait, textAlign: 'center' },
  addSet: { marginTop: 8 },
});
