import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { FAB } from '@/components/ui/FAB';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SheetMenu } from '@/components/ui/SheetMenu';
import { useToast } from '@/components/ui/Toast';
import { AddExerciseSheet } from '@/components/workout/AddExerciseSheet';
import { ChronoHeader } from '@/components/workout/ChronoHeader';
import { ExerciseCard } from '@/components/workout/ExerciseCard';
import { parseReps, parseWeight } from '@/logic/format';
import { ghostFor } from '@/logic/ghost';
import { computeVolume } from '@/logic/volume';
import { activeRoutines, routinePreview, visibleExercises } from '@/store/selectors';
import { useStore } from '@/store/store';
import type { Routine } from '@/store/types';
import { colors, spacing } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

export default function WorkoutScreen() {
  const activeSession = useStore((s) => s.activeSession);
  return activeSession ? <ActiveSession /> : <RestState />;
}

// ----------------------------------------------------------------------------
// État Repos : choix d'une routine ou séance libre
// ----------------------------------------------------------------------------
function RestState() {
  const insets = useSafeAreaInsets();
  const routines = useStore((s) => s.routines);
  const exercises = useStore((s) => s.exercises);
  const startSession = useStore((s) => s.startSession);

  const available = useMemo(() => activeRoutines(routines), [routines]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <FlatList
        data={available}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.restHeader}>
            <ScreenHeader eyebrow="Prêt à pousser" title="Entraînement" />
          </View>
        }
        renderItem={({ item }) => (
          <RoutineStartCard
            routine={item}
            preview={routinePreview(item, exercises)}
            onStart={() => startSession(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <EmptyState
            icon="albums-outline"
            title="Aucune routine"
            subtitle="Crée une routine dans la Bibliothèque, ou démarre une séance libre."
          />
        }
        ListFooterComponent={
          <Button
            label="+ Séance libre"
            variant="dashed"
            onPress={() => startSession(null)}
            style={{ marginTop: 16 }}
          />
        }
      />
    </View>
  );
}

function RoutineStartCard({
  routine,
  preview,
  onStart,
}: {
  routine: Routine;
  preview: string;
  onStart: () => void;
}) {
  const count = routine.exerciseIds.length;
  return (
    <Card style={{ gap: 6 }}>
      <Text style={styles.routineName}>{routine.name}</Text>
      <Text style={styles.routineCount}>
        {count} exercice{count > 1 ? 's' : ''}
      </Text>
      {preview ? (
        <Text style={styles.routinePreview} numberOfLines={1}>
          {preview}
        </Text>
      ) : null}
      <Button label="Démarrer ▸" height={54} onPress={onStart} style={{ marginTop: 10 }} />
    </Card>
  );
}

// ----------------------------------------------------------------------------
// Séance active
// ----------------------------------------------------------------------------
function ActiveSession() {
  const router = useRouter();
  const toast = useToast();

  const session = useStore((s) => s.activeSession);
  const exercises = useStore((s) => s.exercises);
  const sessions = useStore((s) => s.sessions);
  const addExerciseToActive = useStore((s) => s.addExerciseToActive);
  const setExerciseStatus = useStore((s) => s.setActiveExerciseStatus);
  const moveExercise = useStore((s) => s.moveActiveExercise);
  const addSet = useStore((s) => s.addActiveSet);
  const updateSet = useStore((s) => s.updateActiveSet);
  const toggleSet = useStore((s) => s.toggleActiveSet);
  const finishSession = useStore((s) => s.finishSession);

  const [fabOpen, setFabOpen] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [menuExId, setMenuExId] = useState<string | null>(null);

  const volume = useMemo(() => (session ? computeVolume(session) : 0), [session]);
  const visibleEx = useMemo(() => visibleExercises(exercises), [exercises]);
  const ghostMap = useMemo(() => {
    const map: Record<string, string | null> = {};
    if (session) {
      for (const ex of session.exercises) map[ex.exerciseId] = ghostFor(ex.exerciseId, sessions);
    }
    return map;
  }, [session, sessions]);

  // Garde : la séance peut devenir null (Terminer) pendant que ce composant est monté.
  if (!session) return null;

  const menuIndex = menuExId ? session.exercises.findIndex((e) => e.exerciseId === menuExId) : -1;
  const menuEx = menuIndex >= 0 ? session.exercises[menuIndex] : null;

  const onToggle = (exId: string, setId: string) => {
    if (!toggleSet(exId, setId)) toast('Renseigne des répétitions (> 0)');
  };

  return (
    <View style={styles.screen}>
      <ChronoHeader session={session} volume={volume} onFinish={() => setConfirmFinish(true)} />

      <FlatList
        data={session.exercises}
        keyExtractor={(e) => e.exerciseId}
        contentContainerStyle={styles.activeListContent}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        renderItem={({ item }) => (
          <ExerciseCard
            exercise={item}
            ghostLine={ghostMap[item.exerciseId]}
            onKebab={() => setMenuExId(item.exerciseId)}
            onAddSet={() => addSet(item.exerciseId)}
            onWeightChange={(setId, t) => updateSet(item.exerciseId, setId, { weight: parseWeight(t) })}
            onRepsChange={(setId, t) => updateSet(item.exerciseId, setId, { reps: parseReps(t) })}
            onToggleSet={(setId) => onToggle(item.exerciseId, setId)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        ListEmptyComponent={
          <EmptyState
            icon="add-circle-outline"
            title="Séance libre"
            subtitle="Ajoute un exercice avec le bouton +."
          />
        }
      />

      <FAB onPress={() => setFabOpen(true)} />

      <AddExerciseSheet
        visible={fabOpen}
        onClose={() => setFabOpen(false)}
        exercises={visibleEx}
        alreadyAddedIds={session.exercises.map((e) => e.exerciseId)}
        onAdd={(ex) => {
          addExerciseToActive(ex);
          toast('Exercice ajouté');
        }}
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
                    setExerciseStatus(
                      menuEx.exerciseId,
                      menuEx.status === 'skipped' ? 'active' : 'skipped',
                    ),
                },
                ...(menuIndex > 0
                  ? [
                      {
                        label: 'Monter',
                        icon: 'arrow-up-outline' as const,
                        onPress: () => moveExercise(menuEx.exerciseId, -1),
                      },
                    ]
                  : []),
                ...(menuIndex < session.exercises.length - 1
                  ? [
                      {
                        label: 'Descendre',
                        icon: 'arrow-down-outline' as const,
                        onPress: () => moveExercise(menuEx.exerciseId, 1),
                      },
                    ]
                  : []),
              ]
            : []
        }
      />

      <ConfirmSheet
        visible={confirmFinish}
        title="Terminer la séance ?"
        message="Tu pourras corriger la durée et partager le résumé sur l'écran suivant."
        confirmLabel="Terminer"
        onConfirm={() => {
          setConfirmFinish(false);
          const id = finishSession();
          if (id) router.push({ pathname: '/workout/summary', params: { id } });
        }}
        onCancel={() => setConfirmFinish(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  listContent: { paddingHorizontal: spacing.gutter, paddingBottom: 24 },
  restHeader: { paddingBottom: 20 },
  activeListContent: { paddingHorizontal: spacing.gutter, paddingTop: 16, paddingBottom: 120 },
  routineName: { fontFamily: fonts.grotesk.bold, fontSize: 20, color: colors.ink },
  routineCount: { fontFamily: fonts.mono.bold, fontSize: 13, color: colors.gold },
  routinePreview: { fontFamily: fonts.grotesk.regular, fontSize: 13, color: colors.muted },
});
