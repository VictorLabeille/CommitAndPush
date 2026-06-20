import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, radii, spacing } from '@/theme/tokens';

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Surface surélevée `raise` (défaut) ou secondaire `card`. */
  tone?: 'raise' | 'card';
}

export function Card({ children, style, tone = 'raise' }: Props) {
  return (
    <View
      style={[styles.card, { backgroundColor: tone === 'raise' ? colors.raise : colors.card }, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPad,
  },
});
