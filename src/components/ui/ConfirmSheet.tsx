import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/typography';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmation (ex: « Terminer la séance », « Supprimer la séance ») — §6.6. */
export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Annuler',
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <BottomSheet visible={visible} onClose={onCancel} title={title}>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <View style={styles.actions}>
        <Button
          label={confirmLabel}
          variant={danger ? 'danger' : 'primary'}
          onPress={onConfirm}
        />
        <Button label={cancelLabel} variant="outline" onPress={onCancel} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  message: {
    fontFamily: fonts.grotesk.regular,
    fontSize: 15,
    color: colors.muted,
    marginBottom: 18,
    lineHeight: 21,
  },
  actions: { gap: 10 },
});
