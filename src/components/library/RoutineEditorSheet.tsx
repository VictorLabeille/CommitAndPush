import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchField } from '@/components/ui/SearchField';
import { useToast } from '@/components/ui/Toast';
import { filterByName } from '@/store/selectors';
import type { Exercise } from '@/store/types';
import { colors, radii, touch } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

interface Props {
  visible: boolean;
  mode: 'create' | 'edit';
  initialName?: string;
  initialSelectedIds?: string[];
  exercises: Exercise[]; // exercices visibles (non archivés)
  onSubmit: (name: string, selectedIds: string[]) => void;
  onClose: () => void;
}

export function RoutineEditorSheet({
  visible,
  mode,
  initialName = '',
  initialSelectedIds,
  exercises,
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

  const filtered = useMemo(() => filterByName(exercises, query), [exercises, query]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

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
      <Text style={styles.hint}>Exercices (l'ordre = ordre de sélection)</Text>
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
            const order = selected.indexOf(ex.id) + 1;
            return (
              <Pressable key={ex.id} style={styles.row} onPress={() => toggle(ex.id)}>
                <View style={[styles.checkbox, isSel && styles.checkboxOn]}>
                  {isSel ? <Ionicons name="checkmark" size={15} color={colors.white} /> : null}
                </View>
                <Text style={styles.rowName} numberOfLines={1}>
                  {ex.name}
                </Text>
                {isSel ? <Text style={styles.order}>{order}</Text> : null}
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
  list: { maxHeight: 280, marginTop: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: touch.min,
  },
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
  order: { fontFamily: fonts.mono.bold, fontSize: 13, color: colors.gold },
  submit: { marginTop: 14 },
});
