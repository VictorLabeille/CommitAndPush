import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { PromptSheet } from '@/components/ui/PromptSheet';
import { SheetMenu } from '@/components/ui/SheetMenu';
import { StatTile } from '@/components/ui/StatTile';
import { useToast } from '@/components/ui/Toast';
import { SetChip } from '@/components/history/SetChip';
import { ExerciseCard } from '@/components/workout/ExerciseCard';
import { ExportSheet } from '@/components/workout/ExportSheet';
import { fmtDate, fmtVol, parseReps, parseWeight, setLabel } from '@/logic/format';
import { computeDurationMin, computeVolume } from '@/logic/volume';
import { useStore } from '@/store/store';
import { colors, radii, spacing } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const session = useStore((s) => s.sessions.find((x) => x.id === id) ?? null);
  const renameSession = useStore((s) => s.renameSession);
  const setSessionDuration = useStore((s) => s.setSessionDuration);
  const deleteSession = useStore((s) => s.deleteSession);
  const editAddSet = useStore((s) => s.editAddSet);
  const editRemoveSet = useStore((s) => s.editRemoveSet);
  const editUpdateSet = useStore((s) => s.editUpdateSet);
  const editToggleSet = useStore((s) => s.editToggleSet);
  const editExerciseStatus = useStore((s) => s.editExerciseStatus);

  const [editMode, setEditMode] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [durOpen, setDurOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menuExId, setMenuExId] = useState<string | null>(null);

  useEffect(() => {
    if (editMode && session) setNameDraft(session.routineName);
  }, [editMode]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!session) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.missing}>Séance introuvable.</Text>
        <Button label="Retour" variant="outline" onPress={() => router.back()} />
      </View>
    );
  }

  const volume = computeVolume(session);
  const duration = computeDurationMin(session);
  const sid = session.id;
  const menuEx = menuExId ? session.exercises.find((e) => e.exerciseId === menuExId) ?? null : null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      {/* Header : retour + toggle Modifier/Terminer */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </Pressable>
        <Pressable
          onPress={() => setEditMode((v) => !v)}
          style={[styles.editToggle, editMode && styles.editToggleOn]}
        >
          <Text style={[styles.editToggleText, editMode && styles.editToggleTextOn]}>
            {editMode ? 'Terminer' : 'Modifier'}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.date}>{fmtDate(session.startTime)}</Text>
        {editMode ? (
          <TextInput
            style={styles.nameInput}
            value={nameDraft}
            onChangeText={(t) => {
              setNameDraft(t);
              renameSession(sid, t);
            }}
            placeholder="Nom de la séance"
            placeholderTextColor={colors.muted}
          />
        ) : (
          <Text style={styles.name}>{session.routineName}</Text>
        )}

        <View style={styles.tiles}>
          <StatTile label="Durée" value={String(duration)} unit="min" onPress={() => setDurOpen(true)} />
          <StatTile label="Volume" value={fmtVol(volume)} unit="kg" tone="green" />
        </View>

        {editMode ? (
          <View style={styles.editList}>
            {session.exercises.map((ex) => (
              <ExerciseCard
                key={ex.exerciseId}
                exercise={ex}
                onKebab={() => setMenuExId(ex.exerciseId)}
                onAddSet={() => editAddSet(sid, ex.exerciseId)}
                onWeightChange={(setId, t) => editUpdateSet(sid, ex.exerciseId, setId, { weight: parseWeight(t) })}
                onRepsChange={(setId, t) => editUpdateSet(sid, ex.exerciseId, setId, { reps: parseReps(t) })}
                onToggleSet={(setId) => {
                  if (!editToggleSet(sid, ex.exerciseId, setId)) toast('Renseigne des répétitions (> 0)');
                }}
                onRemoveSet={(setId) => editRemoveSet(sid, ex.exerciseId, setId)}
              />
            ))}
          </View>
        ) : (
          <Card style={styles.viewList}>
            {session.exercises.map((ex) => {
              const skipped = ex.status === 'skipped';
              const done = ex.sets.filter((s) => s.completed);
              return (
                <View key={ex.exerciseId} style={styles.viewRow}>
                  <Text style={[styles.viewName, skipped && styles.viewNameSkipped]}>
                    {ex.exerciseName}
                    {skipped ? ' · ignoré' : ''}
                  </Text>
                  {!skipped &&
                    (done.length > 0 ? (
                      <View style={styles.chips}>
                        {done.map((s) => (
                          <SetChip key={s.id} label={setLabel(s)} />
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.noSet}>Aucune série validée</Text>
                    ))}
                </View>
              );
            })}
          </Card>
        )}
      </ScrollView>

      {/* Footer : partage + suppression (édition) */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {editMode ? (
          <Button
            label="Supprimer la séance"
            variant="danger"
            onPress={() => setConfirmDelete(true)}
          />
        ) : (
          <Button
            label="Partager vers AI Coach"
            subLabel="Google Health"
            height={62}
            onPress={() => setExportOpen(true)}
          />
        )}
      </View>

      {/* ---- Sheets ---- */}
      <PromptSheet
        visible={durOpen}
        title="Corriger la durée (minutes)"
        initialValue={String(duration)}
        submitLabel="Enregistrer"
        keyboardType="number-pad"
        onSubmit={(v) => {
          const n = parseInt(v, 10);
          setSessionDuration(sid, isNaN(n) ? null : Math.max(0, n));
        }}
        onClose={() => setDurOpen(false)}
      />

      <SheetMenu
        visible={!!menuEx}
        onClose={() => setMenuExId(null)}
        title={menuEx?.exerciseName}
        items={
          menuEx
            ? [
                {
                  label: menuEx.status === 'skipped' ? 'Réactiver l’exercice' : 'Ignorer l’exercice',
                  icon: menuEx.status === 'skipped' ? 'play-outline' : 'eye-off-outline',
                  onPress: () =>
                    editExerciseStatus(
                      sid,
                      menuEx.exerciseId,
                      menuEx.status === 'skipped' ? 'active' : 'skipped',
                    ),
                },
              ]
            : []
        }
      />

      <ConfirmSheet
        visible={confirmDelete}
        title="Supprimer la séance ?"
        message="Cette action est définitive."
        confirmLabel="Supprimer"
        danger
        onConfirm={() => {
          setConfirmDelete(false);
          deleteSession(sid);
          toast('Séance supprimée');
          router.back();
        }}
        onCancel={() => setConfirmDelete(false)}
      />

      <ExportSheet visible={exportOpen} session={session} onClose={() => setExportOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', gap: 16, padding: spacing.gutter },
  missing: { fontFamily: fonts.grotesk.medium, fontSize: 16, color: colors.muted },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.gutter,
    height: 44,
  },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
  editToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  editToggleOn: { backgroundColor: colors.green, borderColor: colors.green },
  editToggleText: { fontFamily: fonts.grotesk.semibold, fontSize: 14, color: colors.ink },
  editToggleTextOn: { color: colors.bg },
  content: { paddingHorizontal: spacing.gutter, paddingBottom: 24, paddingTop: 8 },
  date: { fontFamily: fonts.mono.bold, fontSize: 14, color: colors.gold },
  name: { fontFamily: fonts.grotesk.bold, fontSize: 26, color: colors.ink, marginTop: 6, marginBottom: 18 },
  nameInput: {
    fontFamily: fonts.grotesk.bold,
    fontSize: 22,
    color: colors.ink,
    marginTop: 6,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.input,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: colors.raise,
  },
  tiles: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  editList: { gap: 14 },
  viewList: { gap: 18 },
  viewRow: { gap: 8 },
  viewName: { fontFamily: fonts.grotesk.semibold, fontSize: 16, color: colors.ink },
  viewNameSkipped: { color: colors.muted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  noSet: { fontFamily: fonts.grotesk.regular, fontSize: 13, color: colors.muted },
  footer: { paddingHorizontal: spacing.gutter, paddingTop: 12, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border },
});
