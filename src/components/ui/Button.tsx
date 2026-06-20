import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { colors, radii, shadows, touch } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

type Variant = 'primary' | 'gold' | 'danger' | 'outline' | 'dashed';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  /** Hauteur cible (≥ 48 dp). */
  height?: number;
  /** Texte multi-lignes centré (ex: « Partager vers AI Coach\nGoogle Health »). */
  subLabel?: string;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  height = touch.primary,
  subLabel,
  icon,
  style,
}: Props) {
  const v = VARIANTS[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { height, backgroundColor: v.bg, borderColor: v.border, borderStyle: v.borderStyle },
        v.borderWidth ? { borderWidth: v.borderWidth } : null,
        variant === 'primary' ? shadows.primary : null,
        (pressed || disabled) && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.content}>
          {icon}
          <View>
            <Text style={[styles.label, { color: v.fg }]} numberOfLines={1}>
              {label}
            </Text>
            {subLabel ? (
              <Text style={[styles.subLabel, { color: v.fg }]} numberOfLines={1}>
                {subLabel}
              </Text>
            ) : null}
          </View>
        </View>
      )}
    </Pressable>
  );
}

const VARIANTS: Record<
  Variant,
  { bg: string; fg: string; border: string; borderWidth?: number; borderStyle?: 'solid' | 'dashed' }
> = {
  primary: { bg: colors.green, fg: colors.bg, border: 'transparent' },
  gold: { bg: colors.gold, fg: colors.ink, border: 'transparent' },
  danger: { bg: colors.danger, fg: colors.white, border: 'transparent' },
  outline: { bg: 'transparent', fg: colors.ink, border: colors.border, borderWidth: 1.5 },
  dashed: {
    bg: 'transparent',
    fg: colors.muted,
    border: colors.border,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.input,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  pressed: { opacity: 0.85 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: {
    fontFamily: fonts.grotesk.semibold,
    fontSize: 16,
    textAlign: 'center',
  },
  subLabel: {
    fontFamily: fonts.grotesk.semibold,
    fontSize: 16,
    textAlign: 'center',
  },
});
