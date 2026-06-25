import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputSelectionChangeEventData,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { useToast } from '@/components/ui/Toast';
import {
  buildExportText,
  DEFAULT_EXPORT_TEMPLATE,
  EXPORT_VARIABLES,
} from '@/logic/exportText';
import { useStore } from '@/store/store';
import type { WorkoutSession } from '@/store/types';
import { colors, radii, spacing, touch } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

/** Séance d'exemple (déterministe) servant à l'aperçu live du template. */
const SAMPLE_SESSION: WorkoutSession = {
  id: 'sample',
  routineId: null,
  routineName: 'Push Day',
  startTime: new Date(2026, 5, 20, 10, 0, 0).getTime(),
  endTime: new Date(2026, 5, 20, 11, 5, 0).getTime(),
  durationOverrideMin: null,
  status: 'completed',
  exercises: [
    {
      exerciseId: 'e1',
      exerciseName: 'Développé couché',
      status: 'active',
      orderIndex: 0,
      sets: [
        { id: 's1', weight: 80, reps: 10, completed: true },
        { id: 's2', weight: 80, reps: 10, completed: true },
        { id: 's3', weight: 80, reps: 9, completed: true },
      ],
    },
    {
      exerciseId: 'e2',
      exerciseName: 'Tractions',
      status: 'active',
      orderIndex: 1,
      sets: [{ id: 's4', weight: 0, reps: 12, completed: true }],
    },
  ],
};

export default function ExportTemplateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const template = useStore((s) => s.exportTemplate);
  const setExportTemplate = useStore((s) => s.setExportTemplate);
  const resetExportTemplate = useStore((s) => s.resetExportTemplate);

  const [draft, setDraft] = useState(template);
  const [selection, setSelection] = useState({ start: template.length, end: template.length });
  const [confirmReset, setConfirmReset] = useState(false);

  const dirty = draft !== template;
  const isDefault = draft === DEFAULT_EXPORT_TEMPLATE;
  const preview = useMemo(() => buildExportText(SAMPLE_SESSION, draft), [draft]);

  const onSelectionChange = (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) =>
    setSelection(e.nativeEvent.selection);

  /** Insère une variable au curseur (remplace la sélection courante). */
  const insertToken = (token: string) => {
    const start = Math.min(selection.start, draft.length);
    const end = Math.min(selection.end, draft.length);
    const next = draft.slice(0, start) + token + draft.slice(end);
    const caret = start + token.length;
    setDraft(next);
    setSelection({ start: caret, end: caret });
  };

  const save = () => {
    setExportTemplate(draft);
    toast('Template enregistré');
  };

  const doReset = () => {
    resetExportTemplate();
    setDraft(DEFAULT_EXPORT_TEMPLATE);
    setSelection({ start: DEFAULT_EXPORT_TEMPLATE.length, end: DEFAULT_EXPORT_TEMPLATE.length });
    setConfirmReset(false);
    toast('Template réinitialisé');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.topTitle}>Texte d’export</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.eyebrow}>AI Coach</Text>
        <Text style={styles.h1}>Modèle de séance</Text>
        <Text style={styles.lead}>
          Personnalise le texte partagé vers l’AI Coach Google Health. Touche une variable pour
          l’insérer ; elle sera remplacée par les données de la séance à l’export.
        </Text>

        <Text style={styles.sectionLabel}>Variables</Text>
        <View style={styles.chips}>
          {EXPORT_VARIABLES.map((v) => (
            <Pressable key={v.token} onPress={() => insertToken(v.token)} style={styles.chip}>
              <Text style={styles.chipText}>{v.token}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Template</Text>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          selection={selection}
          onSelectionChange={onSelectionChange}
          multiline
          textAlignVertical="top"
          placeholder="Saisis ton modèle de texte…"
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.sectionLabel}>Aperçu</Text>
        <ScrollView style={styles.codeBlock} contentContainerStyle={styles.codeContent} nestedScrollEnabled>
          <Text style={styles.code}>{preview}</Text>
        </ScrollView>

        <Button
          label="Enregistrer"
          onPress={save}
          disabled={!dirty}
          style={styles.action}
        />
        <Button
          label="Réinitialiser au modèle par défaut"
          variant="outline"
          onPress={() => setConfirmReset(true)}
          disabled={isDefault}
          style={styles.action}
        />
      </ScrollView>

      <ConfirmSheet
        visible={confirmReset}
        title="Réinitialiser le template ?"
        message="Le texte d’export reviendra au modèle par défaut. Tes modifications seront perdues."
        confirmLabel="Réinitialiser"
        danger
        onConfirm={doReset}
        onCancel={() => setConfirmReset(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.gutter - 8,
    height: touch.min,
  },
  back: { width: touch.min, height: touch.min, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontFamily: fonts.grotesk.semibold, fontSize: 17, color: colors.ink },
  content: { paddingHorizontal: spacing.gutter, paddingTop: 8 },
  eyebrow: {
    fontFamily: fonts.grotesk.semibold,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.gold,
  },
  h1: { fontFamily: fonts.grotesk.bold, fontSize: 26, color: colors.ink, marginTop: 4 },
  lead: {
    fontFamily: fonts.grotesk.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    marginTop: 8,
    marginBottom: 20,
  },
  sectionLabel: {
    fontFamily: fonts.grotesk.semibold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 10,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: { fontFamily: fonts.mono.regular, fontSize: 12.5, color: colors.ink },
  input: {
    minHeight: 220,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.input,
    padding: 14,
    backgroundColor: colors.raise,
    color: colors.ink,
    fontFamily: fonts.mono.regular,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  codeBlock: {
    backgroundColor: colors.exportBg,
    borderRadius: radii.input,
    maxHeight: 260,
    marginBottom: 4,
  },
  codeContent: { padding: 14 },
  code: { fontFamily: fonts.mono.regular, fontSize: 12.5, lineHeight: 19, color: colors.exportText },
  action: { marginTop: 12 },
});
