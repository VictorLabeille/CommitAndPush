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

import { useKeyboardTop } from '@/hooks/useKeyboardHeight';
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
  const keyboardTop = useKeyboardTop();
  // Cadre du conteneur dans la fenêtre : dans un écran d'onglet, il s'arrête au-dessus de
  // la barre d'onglets, pas au bas de la fenêtre.
  const containerRef = useRef<View>(null);
  const [frame, setFrame] = useState<{ top: number; bottom: number } | null>(null);
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

  const measure = () =>
    containerRef.current?.measureInWindow((_x, y, _w, h) => setFrame({ top: y, bottom: y + h }));

  // Décalage = part du conteneur réellement recouverte par le clavier. Calculer depuis la
  // hauteur du clavier laissait un vide de la hauteur de la barre d'onglets (2026-10-01).
  const keyboard = keyboardTop != null && frame ? Math.max(0, frame.bottom - keyboardTop) : 0;
  // Hauteur max : l'espace visible au-dessus du clavier, sous la barre d'état.
  const maxHeight = frame
    ? frame.bottom - keyboard - Math.max(frame.top, insets.top) - 8
    : undefined;

  return (
    <View ref={containerRef} onLayout={measure} style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.scrim, { opacity: scrim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* On décale le sheet au-dessus du clavier nous-mêmes (edge-to-edge Android
          ne redimensionne plus la fenêtre, cf. useKeyboardTop). */}
      <View style={[styles.kav, { paddingBottom: keyboard }]} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: keyboard > 0 ? 16 : insets.bottom + 16,
              maxHeight: maxHeight ?? '88%',
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
