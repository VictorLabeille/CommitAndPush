/**
 * Toast — petite pilule sombre, bas-centre, ~1,9 s (confirmations).
 *
 * Implémenté via un mini-store dédié (non persisté) : `useToast()` renvoie la
 * fonction d'affichage, et <ToastHost/> (monté une fois dans le layout racine)
 * effectue le rendu animé.
 */
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

interface ToastState {
  message: string | null;
  token: number; // change à chaque show pour re-déclencher l'animation
  show: (message: string) => void;
  hide: () => void;
}

const useToastStore = create<ToastState>((set) => ({
  message: null,
  token: 0,
  show: (message) => set((s) => ({ message, token: s.token + 1 })),
  hide: () => set({ message: null }),
}));

/** Hook d'usage : `const toast = useToast(); toast('Copié');` */
export function useToast(): (message: string) => void {
  return useToastStore((s) => s.show);
}

const DURATION = 1900;

export function ToastHost() {
  const message = useToastStore((s) => s.message);
  const token = useToastStore((s) => s.token);
  const hide = useToastStore((s) => s.hide);
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(
        ({ finished }) => finished && hide(),
      );
    }, DURATION);
    return () => clearTimeout(timer);
    // token => re-anime même si le message est identique
  }, [token, message, opacity, hide]);

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { opacity, bottom: insets.bottom + 90 }]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  text: {
    backgroundColor: colors.ink,
    color: colors.bg,
    fontFamily: fonts.grotesk.medium,
    fontSize: 14,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 999,
    overflow: 'hidden',
  },
});
