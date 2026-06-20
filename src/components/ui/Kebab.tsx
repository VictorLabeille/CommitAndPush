import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { colors, touch } from '@/theme/tokens';

interface Props {
  onPress: () => void;
}

/** Bouton « ⋯ » (kebab) ouvrant un menu d'options. Cible ≥ 44 dp. */
export function Kebab({ onPress }: Props) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.btn}>
      <Ionicons name="ellipsis-horizontal" size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: touch.kebab,
    height: touch.kebab,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
