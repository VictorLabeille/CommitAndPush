import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SessionCard } from '@/components/history/SessionCard';
import { sortedSessions } from '@/store/selectors';
import { useStore } from '@/store/store';
import { colors, spacing } from '@/theme/tokens';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const sessions = useStore((s) => s.sessions);
  const sorted = useMemo(() => sortedSessions(sessions), [sessions]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <FlatList
        data={sorted}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeader eyebrow="Journal" title="Historique" />
          </View>
        }
        renderItem={({ item }) => (
          <SessionCard session={item} onPress={() => router.push(`/history/${item.id}`)} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <EmptyState
            icon="time-outline"
            title="Aucune séance"
            subtitle="Tes séances terminées apparaîtront ici."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingBottom: 20 },
  listContent: { paddingHorizontal: spacing.gutter, paddingBottom: 24 },
});
