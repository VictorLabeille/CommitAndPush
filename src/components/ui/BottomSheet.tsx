/**
 * Bottom sheet générique : slide-up + scrim (tap = fermeture) + drag handle.
 * Animé avec l'API Animated de RN (pas de reanimated) pour rester robuste.
 */
import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { colors, radii, spacing } from '@/theme/tokens';
import { type } from '@/theme/typography';

const SCREEN_H = Dimensions.get('window').height;

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({ visible, onClose, title, children }: Props) {
  const [mounted, setMounted] = useState(visible);
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardHeight();
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const scrim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(scrim, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: SCREEN_H, duration: 220, useNativeDriver: true }),
        Animated.timing(scrim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start(({ finished }) => finished && setMounted(false));
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.scrim, { opacity: scrim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* On décale le sheet au-dessus du clavier nous-mêmes (edge-to-edge Android
          ne redimensionne plus la fenêtre, cf. useKeyboardHeight). */}
      <View style={[styles.kav, { paddingBottom: keyboard }]} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: (keyboard > 0 ? 16 : insets.bottom + 16),
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handle} />
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {children}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim },
  kav: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.raise,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingHorizontal: spacing.gutter,
    paddingTop: 10,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 14,
  },
  title: { ...type.cardTitle, color: colors.ink, marginBottom: 14 },
});
