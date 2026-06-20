import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

/** État vide / aucun résultat — icône en pointillés + libellé. */
export function EmptyState({ icon = 'ellipse-outline', title, subtitle }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={26} color={colors.muted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: fonts.grotesk.semibold, fontSize: 16, color: colors.ink },
  subtitle: { fontFamily: fonts.grotesk.regular, fontSize: 13, color: colors.muted, textAlign: 'center' },
});
