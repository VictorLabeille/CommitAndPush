import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchField } from '@/components/ui/SearchField';
import { useToast } from '@/components/ui/Toast';
import { moveItem } from '@/logic/reorder';
import { filterByName } from '@/store/selectors';
import type { Exercise } from '@/store/types';
import { colors, radii, touch } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

interface Props {
  visible: boolean;
  mode: 'create' | 'edit';
  initialName?: string;
  initialSelectedIds?: string[];
  exercises: Exercise[]; // exercices visibles (non archivés) — pour ajouter
  allExercises: Exercise[]; // tous (archivés inclus) — pour résoudre les noms de la zone ordonnée
  onSubmit: (name: string, selectedIds: string[]) => void;
  onClose: () => void;
}

export function RoutineEditorSheet({
  visible,
  mode,
  initialName = '',
  initialSelectedIds,
  exercises,
  allExercises,
  onSubmit,
  onClose,
}: Props) {
  const toast = useToast();
  const [name, setName] = useState(initialName);
  const [selected, setSelected] = useState<string[]>(initialSelectedIds ?? []);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setSelected(initialSelectedIds ?? []);
      setQuery('');
    }
  }, [visible, initialName, initialSelectedIds]);

  // `selected` EST l'ordre (source de vérité unique) : la zone ordonnée le rend tel quel,
  // la checklist coche ses membres.
  const nameById = useMemo(
    () => new Map(allExercises.map((e) => [e.id, e.name] as const)),
    [allExercises],
  );
  const filtered = useMemo(() => filterByName(exercises, query), [exercises, query]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const move = (i: number, dir: -1 | 1) => setSelected((prev) => moveItem(prev, i, dir));
  const remove = (id: string) => setSelected((prev) => prev.filter((x) => x !== id));

  const submit = () => {
    if (!name.trim()) {
      toast('Donne un nom à la routine');
      return;
    }
    if (selected.length === 0) {
      toast('Sélectionne au moins un exercice');
      return;
    }
    onSubmit(name, selected);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={mode === 'create' ? 'Nouvelle routine' : 'Modifier la routine'}
    >
      <TextInput
        style={styles.nameInput}
        value={name}
        onChangeText={setName}
        placeholder="Nom de la routine"
        placeholderTextColor={colors.muted}
      />

      {/* Zone 1 — exercices de la routine, dans l'ordre, réordonnables via ▲▼ */}
      <Text style={styles.hint}>Exercices de la routine · réordonne avec ▲▼</Text>
      {selected.length === 0 ? (
        <View style={styles.emptySelected}>
          <Text style={styles.emptySelectedText}>Ajoute des exercices ci-dessous.</Text>
        </View>
      ) : (
        <ScrollView style={styles.ordered} keyboardShouldPersistTaps="handled">
          {selected.map((id, i) => {
            const isFirst = i === 0;
            const isLast = i === selected.length - 1;
            return (
              <View key={id} style={styles.orderedRow}>
                <Text style={styles.orderNum}>{i + 1}</Text>
                <Text style={styles.orderedName} numberOfLines={1}>
                  {nameById.get(id) ?? 'Exercice archivé'}
                </Text>
                <Pressable
                  style={[styles.iconBtn, isFirst && styles.iconBtnOff]}
                  disabled={isFirst}
                  onPress={() => move(i, -1)}
                  hitSlop={6}
                >
                  <Ionicons name="chevron-up" size={18} color={isFirst ? colors.border : colors.ink} />
                </Pressable>
                <Pressable
                  style={[styles.iconBtn, isLast && styles.iconBtnOff]}
                  disabled={isLast}
                  onPress={() => move(i, 1)}
                  hitSlop={6}
                >
                  <Ionicons name="chevron-down" size={18} color={isLast ? colors.border : colors.ink} />
                </Pressable>
                <Pressable style={styles.iconBtn} onPress={() => remove(id)} hitSlop={6}>
                  <Ionicons name="close" size={18} color={colors.muted} />
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Zone 2 — ajouter un exercice depuis la bibliothèque */}
      <Text style={[styles.hint, styles.hintAdd]}>Ajouter un exercice</Text>
      <SearchField value={query} onChangeText={setQuery} placeholder="Rechercher un exercice…" />

      <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
        {filtered.length === 0 ? (
          <EmptyState
            icon="search"
            title={exercises.length === 0 ? 'Aucun exercice' : 'Aucun résultat'}
            subtitle={
              exercises.length === 0 ? 'Crée d’abord des exercices dans la Bibliothèque.' : undefined
            }
          />
        ) : (
          filtered.map((ex) => {
            const isSel = selected.includes(ex.id);
            return (
              <Pressable key={ex.id} style={styles.row} onPress={() => toggle(ex.id)}>
                <View style={[styles.checkbox, isSel && styles.checkboxOn]}>
                  {isSel ? <Ionicons name="checkmark" size={15} color={colors.white} /> : null}
                </View>
                <Text style={styles.rowName} numberOfLines={1}>
                  {ex.name}
                </Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <Button
        label={mode === 'create' ? 'Créer la routine' : 'Enregistrer'}
        onPress={submit}
        style={styles.submit}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  nameInput: {
    height: touch.input,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.input,
    paddingHorizontal: 14,
    backgroundColor: colors.card,
    color: colors.ink,
    fontFamily: fonts.grotesk.medium,
    fontSize: 16,
    marginBottom: 16,
  },
  hint: {
    fontFamily: fonts.grotesk.medium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 10,
  },
  hintAdd: { marginTop: 18 },
  // Zone 1 — ordonnée
  emptySelected: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radii.input,
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptySelectedText: { fontFamily: fonts.grotesk.regular, fontSize: 13, color: colors.muted },
  ordered: { maxHeight: 168 },
  orderedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: touch.min,
    paddingLeft: 12,
    paddingRight: 4,
    backgroundColor: colors.card,
    borderRadius: radii.input,
    marginBottom: 8,
  },
  orderNum: {
    fontFamily: fonts.mono.bold,
    fontSize: 13,
    color: colors.gold,
    width: 18,
    textAlign: 'center',
  },
  orderedName: { flex: 1, fontFamily: fonts.grotesk.medium, fontSize: 15, color: colors.ink },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.raise,
  },
  iconBtnOff: { backgroundColor: 'transparent' },
  // Zone 2 — checklist d'ajout
  list: { maxHeight: 220, marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, height: touch.min },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.green2, borderColor: colors.green2 },
  rowName: { flex: 1, fontFamily: fonts.grotesk.regular, fontSize: 15, color: colors.ink },
  submit: { marginTop: 14 },
});
