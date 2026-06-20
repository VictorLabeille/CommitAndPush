import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { colors, shadows, touch } from '@/theme/tokens';

interface Props {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  bottom?: number;
}

/** Bouton flottant doré (62 dp), bas-droite. */
export function FAB({ onPress, icon = 'add', bottom = 24 }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fab, { bottom }, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={30} color={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 22,
    width: touch.fab,
    height: touch.fab,
    borderRadius: touch.fab / 2,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.primary,
  },
  pressed: { opacity: 0.9 },
});
