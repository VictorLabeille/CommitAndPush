import * as Clipboard from 'expo-clipboard';
import { useMemo } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { buildExportText } from '@/logic/exportText';
import type { WorkoutSession } from '@/store/types';
import { colors, radii } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

interface Props {
  visible: boolean;
  session: WorkoutSession | null;
  onClose: () => void;
}

/**
 * Sheet « Résumé de séance » : affiche le texte d'export exact (§7) puis permet
 * de le copier (presse-papier) et de le partager.
 *
 * Note : le partage utilise l'API `Share` de React Native (intent ACTION_SEND
 * text/plain), seule adaptée au partage de TEXTE vers l'AI Coach Google Health —
 * `expo-sharing` ne partage que des fichiers. Le presse-papier reste assuré par
 * `expo-clipboard` (stack imposée).
 */
export function ExportSheet({ visible, session, onClose }: Props) {
  const toast = useToast();
  const text = useMemo(() => (session ? buildExportText(session) : ''), [session]);

  const copy = async () => {
    await Clipboard.setStringAsync(text);
    toast('Copié dans le presse-papier');
  };

  const share = async () => {
    try {
      await Share.share({ message: text });
    } catch {
      // partage annulé : aucune action
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Résumé de séance">
      <Text style={styles.subtitle}>Texte prêt à partager vers le AI Coach.</Text>
      <ScrollView style={styles.codeBlock} contentContainerStyle={styles.codeContent}>
        <Text style={styles.code}>{text}</Text>
      </ScrollView>
      <View style={styles.actions}>
        <Button label="Copier" variant="outline" onPress={copy} style={styles.action} />
        <Button label="Partager" variant="primary" onPress={share} style={styles.action} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontFamily: fonts.grotesk.regular, fontSize: 13, color: colors.muted, marginBottom: 12 },
  codeBlock: {
    backgroundColor: colors.exportBg,
    borderRadius: radii.input,
    maxHeight: 280,
  },
  codeContent: { padding: 14 },
  code: { fontFamily: fonts.mono.regular, fontSize: 12.5, lineHeight: 19, color: colors.exportText },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  action: { flex: 1 },
});
