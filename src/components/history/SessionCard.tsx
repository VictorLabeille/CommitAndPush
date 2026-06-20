import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { fmtDate, fmtVol } from '@/logic/format';
import { computeDurationMin, computeVolume } from '@/logic/volume';
import type { WorkoutSession } from '@/store/types';
import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

interface Props {
  session: WorkoutSession;
  onPress: () => void;
}

export function SessionCard({ session, onPress }: Props) {
  return (
    <Pressable onPress={onPress}>
      <Card>
        <View style={styles.metaRow}>
          <Text style={styles.date}>{fmtDate(session.startTime)}</Text>
          <Text style={styles.duration}>{computeDurationMin(session)} min</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {session.routineName}
        </Text>
        <Text style={styles.volume}>Volume {fmtVol(computeVolume(session))} kg</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { fontFamily: fonts.mono.bold, fontSize: 13, color: colors.gold },
  duration: { fontFamily: fonts.mono.regular, fontSize: 13, color: colors.muted },
  name: { fontFamily: fonts.grotesk.bold, fontSize: 18, color: colors.ink, marginTop: 8 },
  volume: { fontFamily: fonts.mono.regular, fontSize: 13, color: colors.muted, marginTop: 4 },
});
