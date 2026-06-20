/**
 * Typographie — Space Grotesk (UI) + Space Mono (toutes les valeurs chiffrées).
 *
 * Les noms de familles correspondent aux exports des paquets @expo-google-fonts/*
 * et sont les clés passées à `useFonts` (cf. src/theme/fonts.ts).
 */

export const fonts = {
  grotesk: {
    regular: 'SpaceGrotesk_400Regular',
    medium: 'SpaceGrotesk_500Medium',
    semibold: 'SpaceGrotesk_600SemiBold',
    bold: 'SpaceGrotesk_700Bold',
  },
  /** Toutes les valeurs chiffrées : chrono, poids, reps, dates, volume, compteurs. */
  mono: {
    regular: 'SpaceMono_400Regular',
    bold: 'SpaceMono_700Bold',
  },
} as const;

/** Échelle typographique (README handoff). */
export const type = {
  screenTitle: { fontFamily: fonts.grotesk.bold, fontSize: 29 },
  cardTitle: { fontFamily: fonts.grotesk.bold, fontSize: 19 },
  sectionTitle: { fontFamily: fonts.grotesk.semibold, fontSize: 16 },
  body: { fontFamily: fonts.grotesk.regular, fontSize: 15 },
  bodyMedium: { fontFamily: fonts.grotesk.medium, fontSize: 15 },
  button: { fontFamily: fonts.grotesk.semibold, fontSize: 16 },
  /** Label « eyebrow » en capitales espacées (ex: "BACK-OFFICE", "PRÊT À POUSSER"). */
  eyebrow: {
    fontFamily: fonts.grotesk.semibold,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  label: {
    fontFamily: fonts.grotesk.medium,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  chrono: { fontFamily: fonts.mono.bold, fontSize: 30 },
  mono: { fontFamily: fonts.mono.regular, fontSize: 14 },
  monoBold: { fontFamily: fonts.mono.bold, fontSize: 14 },
  inputValue: { fontFamily: fonts.mono.bold, fontSize: 19 },
} as const;
