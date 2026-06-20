import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchField } from '@/components/ui/SearchField';
import { filterByName } from '@/store/selectors';
import type { Exercise } from '@/store/types';
import { colors, touch } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

interface Props {
  visible: boolean;
  onClose: () => void;
  exercises: Exercise[]; // visibles (non archivés)
  alreadyAddedIds: string[];
  onAdd: (exercise: Exercise) => void;
}

/** Recherche dans toute la bibliothèque ; les exercices déjà présents sont masqués. */
export function AddExerciseSheet({ visible, onClose, exercises, alreadyAddedIds, onAdd }: Props) {
  const [query, setQuery] = useState('');

  const available = useMemo(
    () => filterByName(exercises.filter((e) => !alreadyAddedIds.includes(e.id)), query),
    [exercises, alreadyAddedIds, query],
  );

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Ajouter un exercice">
      <SearchField value={query} onChangeText={setQuery} placeholder="Rechercher un exercice…" />
      <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
        {available.length === 0 ? (
          <EmptyState icon="search" title="Aucun résultat" />
        ) : (
          available.map((ex) => (
            <Pressable
              key={ex.id}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              onPress={() => {
                onAdd(ex);
                onClose();
              }}
            >
              <View style={styles.dot} />
              <Text style={styles.name} numberOfLines={1}>
                {ex.name}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { maxHeight: 360, marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, height: touch.min, paddingHorizontal: 6 },
  pressed: { opacity: 0.6 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.gold },
  name: { flex: 1, fontFamily: fonts.grotesk.medium, fontSize: 16, color: colors.ink },
});
