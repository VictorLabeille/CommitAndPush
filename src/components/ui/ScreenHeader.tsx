import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/tokens';
import { type } from '@/theme/typography';

interface Props {
  eyebrow: string;
  title: string;
}

/** En-tête d'écran : label « eyebrow » en capitales + grand titre. */
export function ScreenHeader({ eyebrow, title }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  eyebrow: { ...type.eyebrow, color: colors.gold },
  title: { ...type.screenTitle, color: colors.ink },
});
