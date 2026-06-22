import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/tokens';
import { type } from '@/theme/typography';

interface Props {
  eyebrow: string;
  title: string;
  /** Action optionnelle alignée à droite (ex: icône Réglages). */
  right?: ReactNode;
}

/** En-tête d'écran : label « eyebrow » en capitales + grand titre, action optionnelle à droite. */
export function ScreenHeader({ eyebrow, title, right }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.texts}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  texts: { gap: 4, flex: 1 },
  eyebrow: { ...type.eyebrow, color: colors.gold },
  title: { ...type.screenTitle, color: colors.ink },
  right: { marginLeft: 12 },
});
