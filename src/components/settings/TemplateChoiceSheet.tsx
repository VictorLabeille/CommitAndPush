import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { colors, radii } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

interface Props {
  visible: boolean;
  current: string; // template d'export actuel
  backup: string; // template d'export contenu dans la sauvegarde
  onKeepCurrent: () => void;
  onUseBackup: () => void;
}

/**
 * Proposé à l'import quand la sauvegarde contient un texte d'export différent de
 * celui en place : on laisse l'utilisateur lire les deux (segment Actuel/Sauvegarde)
 * et choisir lequel conserver.
 */
export function TemplateChoiceSheet({ visible, current, backup, onKeepCurrent, onUseBackup }: Props) {
  const [view, setView] = useState<'current' | 'backup'>('backup');

  // À chaque réouverture, on présente d'abord le texte de la sauvegarde.
  useEffect(() => {
    if (visible) setView('backup');
  }, [visible]);

  return (
    <BottomSheet visible={visible} onClose={onKeepCurrent} title="Texte d’export différent">
      <Text style={styles.subtitle}>
        Cette sauvegarde contient un texte d’export différent du tien. Compare-les et choisis lequel
        garder.
      </Text>
      <SegmentedControl
        options={[
          { value: 'current', label: 'Actuel' },
          { value: 'backup', label: 'Sauvegarde' },
        ]}
        value={view}
        onChange={setView}
      />
      <ScrollView style={styles.codeBlock} contentContainerStyle={styles.codeContent}>
        <Text style={styles.code}>{view === 'current' ? current : backup}</Text>
      </ScrollView>
      <View style={styles.actions}>
        <Button
          label="Garder l’actuel"
          variant="outline"
          onPress={onKeepCurrent}
          style={styles.action}
        />
        <Button
          label="Prendre la sauvegarde"
          variant="primary"
          onPress={onUseBackup}
          style={styles.action}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontFamily: fonts.grotesk.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
    marginBottom: 14,
  },
  codeBlock: {
    backgroundColor: colors.exportBg,
    borderRadius: radii.input,
    maxHeight: 240,
    marginTop: 12,
  },
  codeContent: { padding: 14 },
  code: { fontFamily: fonts.mono.regular, fontSize: 12.5, lineHeight: 19, color: colors.exportText },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  action: { flex: 1 },
});
