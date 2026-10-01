import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Kebab } from '@/components/ui/Kebab';
import type { Routine } from '@/store/types';
import { colors, radii } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

interface Props {
  routine: Routine;
  preview: string;
  /** Tap sur la carte : résumé de la routine. */
  onPress: () => void;
  onKebab: () => void;
  /** Réordonnancement ▲▼ ; `undefined` désactive le sens concerné (bout de liste). */
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function RoutineCard({ routine, preview, onPress, onKebab, onMoveUp, onMoveDown }: Props) {
  const count = routine.exerciseIds.length;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
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
          <MoveBtn icon="chevron-up" onPress={onMoveUp} />
          <MoveBtn icon="chevron-down" onPress={onMoveDown} />
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
    </Pressable>
  );
}

function MoveBtn({ icon, onPress }: { icon: 'chevron-up' | 'chevron-down'; onPress?: () => void }) {
  const off = !onPress;
  return (
    <Pressable
      style={[styles.iconBtn, off && styles.iconBtnOff]}
      disabled={off}
      onPress={onPress}
      hitSlop={4}
    >
      <Ionicons name={icon} size={18} color={off ? colors.border : colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 },
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
  // Même gabarit que les ▲▼ de l'éditeur de routine.
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  iconBtnOff: { backgroundColor: 'transparent' },
  count: { fontFamily: fonts.mono.bold, fontSize: 13, color: colors.gold, marginTop: 6 },
  preview: { fontFamily: fonts.grotesk.regular, fontSize: 13, color: colors.muted, marginTop: 4 },
});
