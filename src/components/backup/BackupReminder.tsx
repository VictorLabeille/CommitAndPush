import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { shouldRemind, unsavedCount } from '@/logic/backup';
import { useStore } from '@/store/store';
import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

/**
 * Rappel de sauvegarde, affiché sur l'onglet Séance au repos tant que le seuil est
 * atteint. Pas de fermeture : il disparaît à la sauvegarde suivante.
 *
 * Décision du 2026-10-01 : il vivait en bas de l'écran bilan, sous le pli, et n'a jamais
 * été vu malgré 12 séances non sauvegardées. L'accueil de l'onglet Séance est vu à
 * chaque séance, avant de démarrer.
 */
export function BackupReminder() {
  const router = useRouter();
  const sessions = useStore((s) => s.sessions);
  const lastBackupAt = useStore((s) => s.lastBackupAt);

  const unsaved = unsavedCount(sessions, lastBackupAt);
  if (!shouldRemind(unsaved)) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Ionicons name="cloud-upload-outline" size={20} color={colors.gold} />
        <Text style={styles.title}>Pense à sauvegarder</Text>
      </View>
      <Text style={styles.text}>
        {unsaved} séances enregistrées depuis ta dernière sauvegarde. Exporte tes données pour ne
        rien perdre.
      </Text>
      <Button
        label="Sauvegarder mes données"
        variant="outline"
        onPress={() => router.push('/settings')}
        style={styles.btn}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10, borderWidth: 1, borderColor: colors.goldSoft },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontFamily: fonts.grotesk.semibold, fontSize: 15, color: colors.ink },
  text: { fontFamily: fonts.grotesk.regular, fontSize: 13, lineHeight: 19, color: colors.muted },
  btn: { marginTop: 2 },
});
