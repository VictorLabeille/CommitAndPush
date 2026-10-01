/**
 * Écran de décision du rappel d'étirements, ouvert par la notif quotidienne (cf.
 * `logic/restPlan.ts`). Le choix vaut pour la journée en cours.
 */
import { Ionicons } from '@expo/vector-icons';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { fmtTime } from '@/logic/format';
import { dayKey, type RestDecision } from '@/logic/restPlan';
import { useStore } from '@/store/store';
import { colors, radii, spacing, touch } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

const SNOOZES = [
  { label: '30 min', min: 30 },
  { label: '1 h', min: 60 },
  { label: '2 h', min: 120 },
];

function describe(decision: RestDecision): string {
  switch (decision.kind) {
    case 'gym':
      return 'Salle aujourd’hui : pas d’étirements.';
    case 'stretch':
      return `Étirements prévus à ${fmtTime(decision.at)}.`;
    case 'snooze':
      return `Je te redemande à ${fmtTime(decision.at)}.`;
  }
}

export default function RestDayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const decision = useStore((s) => s.restDecision);
  const setRestDecision = useStore((s) => s.setRestDecision);
  const [showSnooze, setShowSnooze] = useState(false);

  const today = dayKey(Date.now());
  const current = decision?.day === today ? decision : null;

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const decide = (d: RestDecision, message: string) => {
    setRestDecision(d);
    toast(message);
    leave();
  };

  const pickStretchTime = () => {
    const now = new Date();
    // Proposition par défaut : l'heure pleine suivante.
    const initial = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0);
    DateTimePickerAndroid.open({
      value: initial,
      mode: 'time',
      is24Hour: true,
      onValueChange: (_event, date) => {
        const n = new Date();
        const at = new Date(n.getFullYear(), n.getMonth(), n.getDate(), date.getHours(), date.getMinutes());
        if (at.getTime() <= n.getTime()) {
          toast('Choisis une heure à venir');
          return;
        }
        decide({ day: today, kind: 'stretch', at: at.getTime() }, `Étirements à ${fmtTime(at.getTime())}`);
      },
    });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topbar}>
        <Pressable onPress={leave} hitSlop={8} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.eyebrow}>Jour de repos ?</Text>
        <Text style={styles.h1}>Salle ou étirements ?</Text>

        {current ? (
          <Card style={styles.status}>
            <Text style={styles.statusText}>{describe(current)}</Text>
          </Card>
        ) : null}

        <Button
          label="Je vais à la salle"
          onPress={() => decide({ day: today, kind: 'gym' }, 'Bonne séance')}
          style={styles.action}
        />
        <Button
          label="Étirements à une heure précise…"
          variant="outline"
          onPress={pickStretchTime}
          style={styles.action}
        />
        <Button
          label="Je ne sais pas encore"
          variant="outline"
          onPress={() => setShowSnooze((v) => !v)}
          style={styles.action}
        />

        {showSnooze ? (
          <View style={styles.snoozeRow}>
            {SNOOZES.map((s) => (
              <Pressable
                key={s.min}
                style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                onPress={() => {
                  const at = Date.now() + s.min * 60000;
                  decide({ day: today, kind: 'snooze', at }, `Je te redemande à ${fmtTime(at)}`);
                }}
              >
                <Text style={styles.chipText}>Dans {s.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topbar: { paddingHorizontal: spacing.gutter - 8, height: touch.min, justifyContent: 'center' },
  back: { width: touch.min, height: touch.min, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.gutter, paddingTop: 8 },
  eyebrow: {
    fontFamily: fonts.grotesk.semibold,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.gold,
  },
  h1: { fontFamily: fonts.grotesk.bold, fontSize: 26, color: colors.ink, marginTop: 4, marginBottom: 20 },
  status: { marginBottom: 8 },
  statusText: { fontFamily: fonts.grotesk.medium, fontSize: 14, color: colors.ink },
  action: { marginTop: 12 },
  snoozeRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  chip: {
    flex: 1,
    height: touch.min,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipPressed: { opacity: 0.7 },
  chipText: { fontFamily: fonts.grotesk.medium, fontSize: 14, color: colors.ink },
});
