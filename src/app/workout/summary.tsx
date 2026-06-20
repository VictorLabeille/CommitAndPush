import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PromptSheet } from '@/components/ui/PromptSheet';
import { StatTile } from '@/components/ui/StatTile';
import { SetChip } from '@/components/history/SetChip';
import { ExportSheet } from '@/components/workout/ExportSheet';
import { fmtVol, setLabel } from '@/logic/format';
import { computeDurationMin, computeVolume } from '@/logic/volume';
import { useStore } from '@/store/store';
import { colors, spacing } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

export default function SummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const session = useStore((s) => s.sessions.find((x) => x.id === id) ?? null);
  const setSessionDuration = useStore((s) => s.setSessionDuration);

  const [durOpen, setDurOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  if (!session) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.missing}>Séance introuvable.</Text>
        <Button label="Retour" variant="outline" onPress={() => router.replace('/history')} />
      </View>
    );
  }

  const volume = computeVolume(session);
  const duration = computeDurationMin(session);
  const activeExs = session.exercises.filter((e) => e.status === 'active');
  const skippedNames = session.exercises
    .filter((e) => e.status === 'skipped')
    .map((e) => e.exerciseName);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.checkChip}>
          <Ionicons name="checkmark" size={22} color={colors.gold} />
        </View>
        <Text style={styles.eyebrow}>Bilan</Text>
        <Text style={styles.title}>Séance terminée</Text>

        <View style={styles.tiles}>
          <StatTile
            label="Durée"
            value={String(duration)}
            unit="min"
            onPress={() => setDurOpen(true)}
          />
          <StatTile label="Volume" value={fmtVol(volume)} unit="kg" tone="green" />
        </View>

        <Card style={styles.recap}>
          {activeExs.map((ex) => {
            const done = ex.sets.filter((s) => s.completed);
            return (
              <View key={ex.exerciseId} style={styles.recapRow}>
                <Text style={styles.recapName}>{ex.exerciseName}</Text>
                {done.length > 0 ? (
                  <View style={styles.chips}>
                    {done.map((s) => (
                      <SetChip key={s.id} label={setLabel(s)} />
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noSet}>Aucune série validée</Text>
                )}
              </View>
            );
          })}
          {skippedNames.length > 0 ? (
            <Text style={styles.skipped}>Ignorés : {skippedNames.join(', ')}</Text>
          ) : null}
        </Card>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          label="Partager vers AI Coach"
          subLabel="Google Health"
          height={62}
          onPress={() => setExportOpen(true)}
        />
        <Button
          label="Enregistrer et fermer"
          variant="outline"
          onPress={() => router.replace('/history')}
        />
      </View>

      <PromptSheet
        visible={durOpen}
        title="Corriger la durée (minutes)"
        initialValue={String(duration)}
        submitLabel="Enregistrer"
        keyboardType="number-pad"
        onSubmit={(v) => {
          const n = parseInt(v, 10);
          setSessionDuration(session.id, isNaN(n) ? null : Math.max(0, n));
        }}
        onClose={() => setDurOpen(false)}
      />

      <ExportSheet visible={exportOpen} session={session} onClose={() => setExportOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', gap: 16, padding: spacing.gutter },
  missing: { fontFamily: fonts.grotesk.medium, fontSize: 16, color: colors.muted },
  content: { paddingHorizontal: spacing.gutter, paddingBottom: 24 },
  checkChip: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  eyebrow: { fontFamily: fonts.grotesk.semibold, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: colors.gold },
  title: { fontFamily: fonts.grotesk.bold, fontSize: 29, color: colors.ink, marginTop: 4, marginBottom: 20 },
  tiles: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  recap: { gap: 16 },
  recapRow: { gap: 8 },
  recapName: { fontFamily: fonts.grotesk.semibold, fontSize: 16, color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  noSet: { fontFamily: fonts.grotesk.regular, fontSize: 13, color: colors.muted },
  skipped: { fontFamily: fonts.grotesk.regular, fontSize: 13, color: colors.muted, fontStyle: 'italic' },
  footer: { paddingHorizontal: spacing.gutter, paddingTop: 12, gap: 10, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border },
});
