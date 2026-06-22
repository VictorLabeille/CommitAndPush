import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { useToast } from '@/components/ui/Toast';
import {
  backupFilename,
  buildBackup,
  parseBackup,
  unsavedCount,
  type BackupData,
} from '@/logic/backup';
import { fmtDate } from '@/logic/format';
import { useStore } from '@/store/store';
import { colors, radii, spacing, touch } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const exercises = useStore((s) => s.exercises);
  const routines = useStore((s) => s.routines);
  const sessions = useStore((s) => s.sessions);
  const activeSession = useStore((s) => s.activeSession);
  const lastBackupAt = useStore((s) => s.lastBackupAt);
  const markBackedUp = useStore((s) => s.markBackedUp);
  const replaceAll = useStore((s) => s.replaceAll);

  // Sauvegarde validée en attente de confirmation d'écrasement.
  const [pending, setPending] = useState<{ version: number; data: BackupData } | null>(null);
  const [busy, setBusy] = useState(false);

  const unsaved = useMemo(() => unsavedCount(sessions, lastBackupAt), [sessions, lastBackupAt]);

  const onExport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const now = Date.now();
      const data: BackupData = { exercises, routines, sessions, activeSession };
      const file = new File(Paths.cache, backupFilename(now));
      file.create({ overwrite: true });
      file.write(buildBackup(data, now));

      if (!(await Sharing.isAvailableAsync())) {
        toast('Le partage n’est pas disponible sur cet appareil');
        return;
      }
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Sauvegarder mes données',
        UTI: 'public.json',
      });
      // Best-effort : l'OS ne signale pas de façon fiable l'annulation du partage.
      markBackedUp();
    } catch {
      toast('Échec de l’export');
    } finally {
      setBusy(false);
    }
  };

  const onPickImport = async () => {
    if (busy || activeSession) return;
    setBusy(true);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (res.canceled) return;
      const text = await new File(res.assets[0].uri).text();
      const parsed = parseBackup(text);
      if (!parsed.ok) {
        toast(parsed.reason);
        return; // données actuelles intactes
      }
      setPending({ version: parsed.version, data: parsed.data });
    } catch {
      toast('Impossible de lire le fichier');
    } finally {
      setBusy(false);
    }
  };

  const onConfirmImport = () => {
    if (!pending) return;
    replaceAll(pending.version, pending.data);
    setPending(null);
    toast('Données restaurées');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.topTitle}>Réglages</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.eyebrow}>Données</Text>
        <Text style={styles.h1}>Sauvegarde</Text>
        <Text style={styles.lead}>
          Exporte toutes tes données dans un fichier (à ranger dans ton Drive, Fichiers…) pour ne
          rien perdre si tu réinstalles l’application.
        </Text>

        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Dernière sauvegarde</Text>
            <Text style={styles.statusValue}>{lastBackupAt ? fmtDate(lastBackupAt) : 'Jamais'}</Text>
          </View>
          <View style={[styles.statusRow, styles.statusRowLast]}>
            <Text style={styles.statusLabel}>Séances non sauvegardées</Text>
            <Text style={[styles.statusValue, unsaved > 0 && styles.statusWarn]}>{unsaved}</Text>
          </View>
        </Card>

        <Button
          label="Exporter mes données"
          onPress={onExport}
          loading={busy}
          style={styles.action}
        />

        <Button
          label="Importer une sauvegarde"
          variant="outline"
          onPress={onPickImport}
          disabled={busy || !!activeSession}
          style={styles.action}
        />
        {activeSession ? (
          <Text style={styles.blocked}>
            Termine ou abandonne ta séance en cours avant d’importer.
          </Text>
        ) : (
          <Text style={styles.note}>
            L’import remplacera <Text style={styles.noteStrong}>toutes</Text> tes données actuelles
            par celles du fichier.
          </Text>
        )}
      </ScrollView>

      <ConfirmSheet
        visible={!!pending}
        title="Importer cette sauvegarde ?"
        message="Ceci écrasera toutes tes données actuelles (exercices, routines, historique). Action irréversible."
        confirmLabel="Tout remplacer"
        danger
        onConfirm={onConfirmImport}
        onCancel={() => setPending(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.gutter - 8,
    height: touch.min,
  },
  back: { width: touch.min, height: touch.min, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontFamily: fonts.grotesk.semibold, fontSize: 17, color: colors.ink },
  content: { paddingHorizontal: spacing.gutter, paddingTop: 8 },
  eyebrow: {
    fontFamily: fonts.grotesk.semibold,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.gold,
  },
  h1: { fontFamily: fonts.grotesk.bold, fontSize: 26, color: colors.ink, marginTop: 4 },
  lead: {
    fontFamily: fonts.grotesk.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    marginTop: 8,
    marginBottom: 20,
  },
  statusCard: { gap: 0, marginBottom: 18 },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusRowLast: { borderBottomWidth: 0 },
  statusLabel: { fontFamily: fonts.grotesk.regular, fontSize: 14, color: colors.muted },
  statusValue: { fontFamily: fonts.mono.bold, fontSize: 14, color: colors.ink },
  statusWarn: { color: colors.gold },
  action: { marginTop: 12 },
  note: {
    fontFamily: fonts.grotesk.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.muted,
    marginTop: 10,
  },
  noteStrong: { fontFamily: fonts.grotesk.semibold, color: colors.ink },
  blocked: {
    fontFamily: fonts.grotesk.medium,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.danger,
    marginTop: 10,
  },
});
