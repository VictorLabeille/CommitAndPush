import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Kebab } from '@/components/ui/Kebab';
import type { Routine } from '@/store/types';
import { colors, radii } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

interface Props {
  routine: Routine;
  preview: string;
  onKebab: () => void;
}

export function RoutineCard({ routine, preview, onKebab }: Props) {
  const count = routine.exerciseIds.length;
  return (
    <Card>
      <View style={styles.head}>
        <View style={styles.titleWrap}>
          <Text style={styles.name} numberOfLines={1}>
            {routine.name}
          </Text>
          {routine.isArchived ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Archivée</Text>
            </View>
          ) : null}
        </View>
        <Kebab onPress={onKebab} />
      </View>
      <Text style={styles.count}>
        {count} exercice{count > 1 ? 's' : ''}
      </Text>
      {preview ? (
        <Text style={styles.preview} numberOfLines={1}>
          {preview}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  titleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 2 },
  name: { fontFamily: fonts.grotesk.semibold, fontSize: 18, color: colors.ink, flexShrink: 1 },
  badge: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeText: { fontFamily: fonts.grotesk.medium, fontSize: 10, color: colors.muted },
  count: { fontFamily: fonts.mono.bold, fontSize: 13, color: colors.gold, marginTop: 6 },
  preview: { fontFamily: fonts.grotesk.regular, fontSize: 13, color: colors.muted, marginTop: 4 },
});
