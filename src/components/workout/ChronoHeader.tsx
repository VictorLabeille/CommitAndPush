import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { useChrono } from '@/hooks/useChrono';
import { fmtChrono, fmtVol } from '@/logic/format';
import type { WorkoutSession } from '@/store/types';
import { colors, spacing } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

interface Props {
  session: WorkoutSession;
  volume: number;
  onFinish: () => void;
}

export function ChronoHeader({ session, volume, onFinish }: Props) {
  const insets = useSafeAreaInsets();
  const seconds = useChrono(session.startTime, session.endTime);
  const blink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0.2, duration: 700, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [blink]);

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <View style={styles.topRow}>
        <View style={styles.statusWrap}>
          <Animated.View style={[styles.dot, { opacity: blink }]} />
          <View>
            <Text style={styles.status}>EN COURS</Text>
            <Text style={styles.routine} numberOfLines={1}>
              {session.routineName}
            </Text>
          </View>
        </View>
        <View style={styles.metrics}>
          <Text style={styles.chrono}>{fmtChrono(seconds)}</Text>
          <Text style={styles.volume}>Volume {fmtVol(volume)} kg</Text>
        </View>
      </View>
      <Button label="Terminer la séance" variant="gold" onPress={onFinish} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.green,
    paddingHorizontal: spacing.gutter,
    paddingBottom: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold },
  status: { fontFamily: fonts.grotesk.semibold, fontSize: 11, letterSpacing: 2, color: colors.gold },
  routine: { fontFamily: fonts.grotesk.medium, fontSize: 15, color: colors.bg },
  metrics: { alignItems: 'flex-end' },
  chrono: { fontFamily: fonts.mono.bold, fontSize: 30, color: colors.bg },
  volume: { fontFamily: fonts.mono.regular, fontSize: 12, color: colors.gold },
});
