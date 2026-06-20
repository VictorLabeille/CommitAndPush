import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

interface Props {
  label: string;
  value: string;
  unit?: string;
  tone?: 'default' | 'green';
  onPress?: () => void; // si défini : tuile éditable (icône crayon)
}

/** Tuile statistique (Durée / Volume) — valeur en mono. */
export function StatTile({ label, value, unit, tone = 'default', onPress }: Props) {
  const green = tone === 'green';
  const Container = onPress ? Pressable : View;
  return (
    <Container
      onPress={onPress}
      style={[styles.tile, green ? styles.tileGreen : styles.tileDefault]}
    >
      <View style={styles.labelRow}>
        <Text style={[styles.label, green && styles.labelGreen]}>{label}</Text>
        {onPress ? (
          <Ionicons name="pencil" size={13} color={green ? colors.bg : colors.muted} />
        ) : null}
      </View>
      <Text style={[styles.value, green && styles.valueGreen]}>
        {value}
        {unit ? <Text style={styles.unit}> {unit}</Text> : null}
      </Text>
    </Container>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, borderRadius: radii.card, padding: 16, gap: 8, minHeight: 92, justifyContent: 'space-between' },
  tileDefault: { backgroundColor: colors.raise, borderWidth: 1, borderColor: colors.border },
  tileGreen: { backgroundColor: colors.green },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontFamily: fonts.grotesk.semibold, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.muted },
  labelGreen: { color: colors.gold },
  value: { fontFamily: fonts.mono.bold, fontSize: 26, color: colors.ink },
  valueGreen: { color: colors.bg },
  unit: { fontFamily: fonts.mono.regular, fontSize: 14, color: colors.muted },
});
