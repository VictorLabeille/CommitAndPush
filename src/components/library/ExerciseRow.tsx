import { StyleSheet, Text, View } from 'react-native';

import { Kebab } from '@/components/ui/Kebab';
import type { Exercise } from '@/store/types';
import { colors, radii } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

interface Props {
  exercise: Exercise;
  onKebab: () => void;
}

export function ExerciseRow({ exercise, onKebab }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.dot} />
      <Text style={styles.name} numberOfLines={1}>
        {exercise.name}
      </Text>
      <Kebab onPress={onKebab} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    paddingLeft: 16,
    paddingRight: 4,
    backgroundColor: colors.raise,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.gold },
  name: { flex: 1, fontFamily: fonts.grotesk.medium, fontSize: 16, color: colors.ink },
});
