import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, View } from 'react-native';

import { colors, radii, touch } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

interface Props {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
}

/** Champ de recherche instantané (filtre par sous-chaîne, insensible à la casse). */
export function SearchField({ value, onChangeText, placeholder = 'Rechercher…' }: Props) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="search" size={18} color={colors.muted} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: touch.min,
    paddingHorizontal: 14,
    backgroundColor: colors.raise,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    height: '100%',
    color: colors.ink,
    fontFamily: fonts.grotesk.regular,
    fontSize: 15,
  },
});
