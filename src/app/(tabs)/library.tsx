import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExerciseRow } from '@/components/library/ExerciseRow';
import { RoutineCard } from '@/components/library/RoutineCard';
import { RoutineEditorSheet } from '@/components/library/RoutineEditorSheet';
import { Button } from '@/components/ui/Button';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { PromptSheet } from '@/components/ui/PromptSheet';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchField } from '@/components/ui/SearchField';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SheetMenu } from '@/components/ui/SheetMenu';
import { useToast } from '@/components/ui/Toast';
import {
  activeRoutines,
  archivedRoutines,
  filterByName,
  routinePreview,
  visibleExercises,
} from '@/store/selectors';
import { useStore } from '@/store/store';
import type { Exercise, Routine } from '@/store/types';
import { colors, spacing } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

type Section = 'exercices' | 'routines';

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const exercises = useStore((s) => s.exercises);
  const routines = useStore((s) => s.routines);
  const addExercise = useStore((s) => s.addExercise);
  const renameExercise = useStore((s) => s.renameExercise);
  const archiveExercise = useStore((s) => s.archiveExercise);
  const addRoutine = useStore((s) => s.addRoutine);
  const updateRoutine = useStore((s) => s.updateRoutine);
  const archiveRoutine = useStore((s) => s.archiveRoutine);
  const unarchiveRoutine = useStore((s) => s.unarchiveRoutine);
  const deleteRoutine = useStore((s) => s.deleteRoutine);

  const [section, setSection] = useState<Section>('exercices');
  const [exQuery, setExQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // sheets
  const [newExOpen, setNewExOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Exercise | null>(null);
  const [exMenu, setExMenu] = useState<Exercise | null>(null);
  const [routineEditor, setRoutineEditor] = useState<{ mode: 'create' | 'edit'; routine?: Routine } | null>(
    null,
  );
  const [routineMenu, setRoutineMenu] = useState<Routine | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Routine | null>(null);

  const allVisibleEx = useMemo(() => visibleExercises(exercises), [exercises]);
  const filteredEx = useMemo(() => filterByName(allVisibleEx, exQuery), [allVisibleEx, exQuery]);
  const activeR = useMemo(() => activeRoutines(routines), [routines]);
  const archivedR = useMemo(() => archivedRoutines(routines), [routines]);
  const shownRoutines = showArchived ? archivedR : activeR;

  const renderExEmpty = () => (
    <EmptyState
      icon={allVisibleEx.length === 0 ? 'barbell-outline' : 'search'}
      title={allVisibleEx.length === 0 ? 'Aucun exercice' : 'Aucun résultat'}
      subtitle={allVisibleEx.length === 0 ? 'Ajoute ton premier exercice.' : undefined}
    />
  );

  const renderRoutineEmpty = () => (
    <EmptyState
      icon="albums-outline"
      title={showArchived ? 'Aucune routine archivée' : 'Aucune routine'}
      subtitle={showArchived ? undefined : 'Crée une séance type à partir de tes exercices.'}
    />
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      {section === 'exercices' ? (
        <FlatList
          data={filteredEx}
          keyExtractor={(e) => e.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.header}>
              <ScreenHeader eyebrow="Back-office" title="Bibliothèque" />
              <SegmentedControl
                options={[
                  { value: 'exercices', label: 'Exercices' },
                  { value: 'routines', label: 'Routines' },
                ]}
                value={section}
                onChange={(v) => setSection(v as Section)}
              />
              <SearchField
                value={exQuery}
                onChangeText={setExQuery}
                placeholder="Rechercher un exercice…"
              />
            </View>
          }
          renderItem={({ item }) => (
            <ExerciseRow exercise={item} onKebab={() => setExMenu(item)} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={renderExEmpty}
        />
      ) : (
        <FlatList
          data={shownRoutines}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.header}>
              <ScreenHeader eyebrow="Back-office" title="Bibliothèque" />
              <SegmentedControl
                options={[
                  { value: 'exercices', label: 'Exercices' },
                  { value: 'routines', label: 'Routines' },
                ]}
                value={section}
                onChange={(v) => setSection(v as Section)}
              />
              <Pressable
                style={[styles.archiveToggle, showArchived && styles.archiveToggleOn]}
                onPress={() => setShowArchived((v) => !v)}
              >
                <Text style={[styles.archiveToggleText, showArchived && styles.archiveToggleTextOn]}>
                  {showArchived ? '← Routines actives' : `Voir les archives (${archivedR.length})`}
                </Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <RoutineCard
              routine={item}
              preview={routinePreview(item, exercises)}
              onKebab={() => setRoutineMenu(item)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={renderRoutineEmpty}
        />
      )}

      {/* CTA fixe en bas */}
      <View style={[styles.cta, { paddingBottom: 8 }]}>
        {section === 'exercices' ? (
          <Button label="+ Nouvel exercice" onPress={() => setNewExOpen(true)} />
        ) : (
          <Button
            label="+ Nouvelle routine"
            onPress={() => setRoutineEditor({ mode: 'create' })}
          />
        )}
      </View>

      {/* ---- Sheets ---- */}
      <PromptSheet
        visible={newExOpen}
        title="Nouvel exercice"
        placeholder="Nom de l'exercice"
        submitLabel="Ajouter"
        onSubmit={(v) => {
          if (!v.trim()) {
            toast('Donne un nom à l’exercice');
            return false;
          }
          addExercise(v);
          toast('Exercice ajouté');
        }}
        onClose={() => setNewExOpen(false)}
      />

      <PromptSheet
        visible={!!renameTarget}
        title="Renommer l'exercice"
        initialValue={renameTarget?.name ?? ''}
        submitLabel="Renommer"
        onSubmit={(v) => {
          if (!v.trim()) return false;
          if (renameTarget) renameExercise(renameTarget.id, v);
          toast('Exercice renommé');
        }}
        onClose={() => setRenameTarget(null)}
      />

      <ExerciseMenu
        exercise={exMenu}
        onClose={() => setExMenu(null)}
        onRename={(ex) => setRenameTarget(ex)}
        onArchive={(ex) => {
          archiveExercise(ex.id);
          toast('Exercice archivé');
        }}
      />

      <RoutineMenu
        routine={routineMenu}
        onClose={() => setRoutineMenu(null)}
        onEdit={(r) => setRoutineEditor({ mode: 'edit', routine: r })}
        onArchive={(r) => {
          archiveRoutine(r.id);
          toast('Routine archivée');
        }}
        onUnarchive={(r) => {
          unarchiveRoutine(r.id);
          toast('Routine désarchivée');
        }}
        onDelete={(r) => setConfirmDelete(r)}
      />

      <RoutineEditorSheet
        visible={!!routineEditor}
        mode={routineEditor?.mode ?? 'create'}
        initialName={routineEditor?.routine?.name}
        initialSelectedIds={routineEditor?.routine?.exerciseIds}
        exercises={allVisibleEx}
        allExercises={exercises}
        onSubmit={(name, ids) => {
          if (routineEditor?.mode === 'edit' && routineEditor.routine) {
            updateRoutine(routineEditor.routine.id, name, ids);
            toast('Routine enregistrée');
          } else {
            addRoutine(name, ids);
            toast('Routine créée');
          }
        }}
        onClose={() => setRoutineEditor(null)}
      />

      <ConfirmSheet
        visible={!!confirmDelete}
        title="Supprimer la routine ?"
        message="Les séances déjà enregistrées avec cette routine ne sont pas affectées."
        confirmLabel="Supprimer"
        danger
        onConfirm={() => {
          if (confirmDelete) deleteRoutine(confirmDelete.id);
          setConfirmDelete(null);
          toast('Routine supprimée');
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </View>
  );
}

// --- Menus (kebab) ---

function ExerciseMenu({
  exercise,
  onClose,
  onRename,
  onArchive,
}: {
  exercise: Exercise | null;
  onClose: () => void;
  onRename: (e: Exercise) => void;
  onArchive: (e: Exercise) => void;
}) {
  return (
    <SheetMenu
      visible={!!exercise}
      onClose={onClose}
      title={exercise?.name}
      items={
        exercise
          ? [
              { label: 'Renommer', icon: 'create-outline', onPress: () => onRename(exercise) },
              {
                label: 'Archiver',
                icon: 'archive-outline',
                tone: 'danger',
                onPress: () => onArchive(exercise),
              },
            ]
          : []
      }
    />
  );
}

function RoutineMenu({
  routine,
  onClose,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
}: {
  routine: Routine | null;
  onClose: () => void;
  onEdit: (r: Routine) => void;
  onArchive: (r: Routine) => void;
  onUnarchive: (r: Routine) => void;
  onDelete: (r: Routine) => void;
}) {
  const items = routine
    ? routine.isArchived
      ? [
          { label: 'Désarchiver', icon: 'refresh-outline' as const, onPress: () => onUnarchive(routine) },
          { label: 'Supprimer la routine', icon: 'trash-outline' as const, tone: 'danger' as const, onPress: () => onDelete(routine) },
        ]
      : [
          { label: 'Modifier la routine', icon: 'create-outline' as const, onPress: () => onEdit(routine) },
          { label: 'Archiver la routine', icon: 'archive-outline' as const, onPress: () => onArchive(routine) },
          { label: 'Supprimer la routine', icon: 'trash-outline' as const, tone: 'danger' as const, onPress: () => onDelete(routine) },
        ]
    : [];
  return <SheetMenu visible={!!routine} onClose={onClose} title={routine?.name} items={items} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { gap: 16, paddingBottom: 16 },
  listContent: { paddingHorizontal: spacing.gutter, paddingBottom: 24 },
  cta: { paddingHorizontal: spacing.gutter, paddingTop: 8, backgroundColor: colors.bg },
  archiveToggle: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  archiveToggleOn: { backgroundColor: colors.green, borderColor: colors.green },
  archiveToggleText: { fontFamily: fonts.grotesk.medium, fontSize: 13, color: colors.muted },
  archiveToggleTextOn: { color: colors.bg },
});
