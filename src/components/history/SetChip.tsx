import { StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

/** Pastille mono affichant une série validée (« 80kg × 10 », « PdC × 12 »). */
export function SetChip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  text: { fontFamily: fonts.mono.regular, fontSize: 13, color: colors.ink },
});
