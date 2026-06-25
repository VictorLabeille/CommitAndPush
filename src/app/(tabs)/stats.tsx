import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StatTile } from '@/components/ui/StatTile';
import { fmtNum, setLabel } from '@/logic/format';
import {
  avgDurationMin,
  avgSessionsPerWeek,
  bestStreak,
  currentStreak,
  exerciseProgression,
  exercisesWithHistory,
  personalRecord,
  type ProgressPoint,
  weekdayCounts,
} from '@/logic/stats';
import { useStore } from '@/store/store';
import { colors, radii, spacing } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

const WEEKDAYS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
const round1 = (n: number) => Math.round(n * 10) / 10;

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const sessions = useStore((s) => s.sessions);
  const exercises = useStore((s) => s.exercises);

  const now = Date.now();
  const exIds = useMemo(() => exercisesWithHistory(sessions), [sessions]);
  const nameById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);

  const [selectedEx, setSelectedEx] = useState<string | null>(null);
  const currentEx = selectedEx && exIds.includes(selectedEx) ? selectedEx : (exIds[0] ?? null);

  const avgWeek = useMemo(() => avgSessionsPerWeek(sessions, now), [sessions, now]);
  const dur = useMemo(() => avgDurationMin(sessions), [sessions]);
  const cur = useMemo(() => currentStreak(sessions, now), [sessions, now]);
  const best = useMemo(() => bestStreak(sessions), [sessions]);
  const days = useMemo(() => weekdayCounts(sessions), [sessions]);
  const progression = useMemo(
    () => (currentEx ? exerciseProgression(currentEx, sessions) : []),
    [currentEx, sessions],
  );

  if (sessions.length === 0) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
        <View style={[styles.headerPad, styles.gutterX]}>
          <ScreenHeader eyebrow="Progression" title="Stats" />
        </View>
        <EmptyState
          icon="bar-chart-outline"
          title="Pas encore de stats"
          subtitle="Fais ta première séance pour suivre ta progression."
        />
      </View>
    );
  }

  const maxDay = Math.max(1, ...days);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerPad}>
          <ScreenHeader eyebrow="Progression" title="Stats" />
        </View>

        <View style={styles.tiles}>
          <StatTile label="Séances / sem." value={fmtNum(round1(avgWeek))} unit="moy." />
          <StatTile label="Durée moy." value={String(dur)} unit="min" />
        </View>
        <View style={styles.tiles}>
          <StatTile label="Série en cours" value={String(cur)} unit="sem." tone="green" />
          <StatTile label="Record série" value={String(best)} unit="sem." />
        </View>

        <Text style={styles.sectionTitle}>Répartition par jour</Text>
        <Card style={styles.card}>
          <View style={styles.weekRow}>
            {days.map((c, i) => (
              <View key={i} style={styles.dayCol}>
                <Text style={styles.dayCount}>{c}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      { height: 6 + Math.round((c / maxDay) * 80) },
                      c === 0 && styles.barEmpty,
                    ]}
                  />
                </View>
                <Text style={styles.dayLabel}>{WEEKDAYS[i]}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Records</Text>
        <Card style={styles.card}>
          {exIds.map((id, idx) => {
            const pr = personalRecord(id, sessions);
            if (!pr) return null;
            const e = nameById.get(id);
            return (
              <View key={id} style={[styles.prRow, idx > 0 && styles.prRowBorder]}>
                <View style={styles.prNameWrap}>
                  <Text style={styles.prName} numberOfLines={1}>
                    {e?.name ?? 'Exercice supprimé'}
                  </Text>
                  {e?.isArchived ? <Text style={styles.tag}>archivé</Text> : null}
                </View>
                <Text style={styles.prValue}>{setLabel(pr)}</Text>
              </View>
            );
          })}
        </Card>

        <Text style={styles.sectionTitle}>Évolution du poids</Text>
        <Card style={styles.card}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {exIds.map((id) => {
              const e = nameById.get(id);
              const active = id === currentEx;
              return (
                <Pressable
                  key={id}
                  onPress={() => setSelectedEx(id)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                    numberOfLines={1}
                  >
                    {e?.name ?? '—'}
                    {e?.isArchived ? ' (arch.)' : ''}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {progression.length === 0 ? (
            <Text style={styles.muted}>Pas encore de données pour cet exercice.</Text>
          ) : (
            <ProgressChart points={progression} />
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

/** Mini bar-chart du top set par séance (cap aux 12 dernières). 0 kg → bascule sur les reps. */
function ProgressChart({ points }: { points: ProgressPoint[] }) {
  const recent = points.slice(-12);
  const bodyweight = recent.every((p) => p.weight === 0);
  const values = recent.map((p) => (bodyweight ? p.reps : p.weight));
  const max = Math.max(...values);
  const min = Math.min(...values);
  const last = values[values.length - 1];

  return (
    <View>
      <View style={styles.chartRow}>
        {recent.map((p, i) => {
          const ratio = max === min ? 1 : (values[i] - min) / (max - min);
          const isLast = i === recent.length - 1;
          return (
            <View key={p.at} style={styles.chartCol}>
              <View
                style={[
                  styles.chartBar,
                  { height: 16 + Math.round(ratio * 72) },
                  isLast && styles.chartBarLast,
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.chartMeta}>
        <Text style={styles.muted}>
          {bodyweight ? 'Poids de corps · meilleures reps' : 'Top set par séance'}
        </Text>
        <Text style={styles.chartLast}>
          {min !== max ? `${fmtNum(min)} → ` : ''}
          {bodyweight ? `${last} reps` : `${fmtNum(last)} kg`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  headerPad: { paddingBottom: 18 },
  gutterX: { paddingHorizontal: spacing.gutter },
  content: { paddingHorizontal: spacing.gutter, paddingTop: 8 },
  tiles: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  sectionTitle: {
    fontFamily: fonts.grotesk.semibold,
    fontSize: 13,
    letterSpacing: 0.6,
    color: colors.ink,
    marginTop: 16,
    marginBottom: 10,
  },
  card: { gap: 0 },
  muted: { fontFamily: fonts.grotesk.regular, fontSize: 13, color: colors.muted, paddingVertical: 6 },

  // Répartition par jour
  weekRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 130 },
  dayCol: { flex: 1, alignItems: 'center', gap: 6 },
  barTrack: { height: 86, justifyContent: 'flex-end' },
  bar: { width: 18, borderRadius: 5, backgroundColor: colors.green2 },
  barEmpty: { backgroundColor: colors.border },
  dayCount: { fontFamily: fonts.mono.bold, fontSize: 12, color: colors.ink },
  dayLabel: { fontFamily: fonts.grotesk.medium, fontSize: 11, color: colors.muted },

  // Records
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 11,
  },
  prRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  prNameWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  prName: { flexShrink: 1, fontFamily: fonts.grotesk.medium, fontSize: 15, color: colors.ink },
  prValue: { fontFamily: fonts.mono.bold, fontSize: 14, color: colors.gold },
  tag: {
    fontFamily: fonts.grotesk.semibold,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.muted,
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
    overflow: 'hidden',
  },

  // Évolution du poids
  chips: { gap: 8, paddingBottom: 12 },
  chip: {
    maxWidth: 180,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.green, borderColor: colors.green },
  chipText: { fontFamily: fonts.grotesk.medium, fontSize: 13, color: colors.muted },
  chipTextActive: { color: colors.bg },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 96, marginTop: 4 },
  chartCol: { flex: 1, alignItems: 'center' },
  chartBar: { width: '100%', maxWidth: 22, borderRadius: 5, backgroundColor: colors.green2 },
  chartBarLast: { backgroundColor: colors.gold },
  chartMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  chartLast: { fontFamily: fonts.mono.bold, fontSize: 13, color: colors.ink },
});
