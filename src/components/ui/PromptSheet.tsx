import { useEffect, useState } from 'react';
import { KeyboardTypeOptions, StyleSheet, TextInput } from 'react-native';

import { colors, radii, touch } from '@/theme/tokens';
import { fonts } from '@/theme/typography';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';

interface Props {
  visible: boolean;
  title: string;
  initialValue?: string;
  placeholder?: string;
  submitLabel?: string;
  keyboardType?: KeyboardTypeOptions;
  /** Renvoie false pour garder la sheet ouverte (ex: saisie vide). */
  onSubmit: (value: string) => boolean | void;
  onClose: () => void;
}

/** Sheet à champ unique : création/renommage d'exercice, nom de routine, durée… */
export function PromptSheet({
  visible,
  title,
  initialValue = '',
  placeholder,
  submitLabel = 'Valider',
  keyboardType = 'default',
  onSubmit,
  onClose,
}: Props) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  const submit = () => {
    const result = onSubmit(value);
    if (result !== false) onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      <Button label={submitLabel} onPress={submit} style={styles.submit} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  input: {
    height: touch.input,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.input,
    paddingHorizontal: 14,
    backgroundColor: colors.card,
    color: colors.ink,
    fontFamily: fonts.grotesk.medium,
    fontSize: 16,
    marginBottom: 14,
  },
  submit: { marginBottom: 4 },
});
