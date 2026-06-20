/**
 * Design tokens — valeurs EXACTES du prototype validé (cahier §3.1 + README handoff).
 * Direction « claire et chaleureuse » : crème / vert forêt / doré.
 */

export const colors = {
  bg: '#E8E2D3', // fond d'écran crème chaud
  card: '#F4F0E6', // cartes secondaires
  raise: '#FCFAF3', // surfaces surélevées (cartes, sheets, tab bar)
  ink: '#20241B', // texte principal
  muted: '#827C68', // texte secondaire, icônes inactives
  green: '#1E3B2C', // actions principales, en-tête séance
  green2: '#2F6A47', // état « validé » (série complétée)
  gold: '#B58A36', // données, ghost data, « Terminer », accents
  goldSoft: '#EFE3C6', // fond chip check du Bilan
  border: '#DCD5C1', // bords / hairlines
  danger: '#A2412F', // suppression, abandon

  skipBg: '#F2E0DA', // fond du tag « IGNORÉ »
  validatedTint: 'rgba(47,106,71,0.10)', // fond de ligne de série validée
  tabInactive: '#A39C88', // onglet inactif
  scrim: 'rgba(28,32,22,0.42)', // voile derrière les bottom sheets

  exportBg: '#1c2018', // bloc code de l'export
  exportText: '#D9E4D4',

  white: '#FFFFFF',
} as const;

export const radii = {
  input: 12, // champs / lignes (11–13)
  card: 16, // cartes (14–18)
  cardLarge: 18,
  sheet: 26, // haut des bottom sheets
  pill: 999,
} as const;

export const spacing = {
  gutter: 22, // marges d'écran
  cardPad: 16, // padding interne carte (14–18)
  gap: 12, // espacement entre éléments de liste (10–14)
  gapSm: 8,
  gapLg: 16,
} as const;

/** Cibles tactiles « fat-finger friendly » (≥ 48 dp). */
export const touch = {
  min: 48,
  input: 50, // champs Poids/Reps
  fait: 52, // bouton « Fait » ✓
  primary: 56, // boutons primaires (52–60)
  fab: 62,
  kebab: 44,
  tabBar: 74,
} as const;

/** Ombre des boutons primaires (cf. README). */
export const shadows = {
  primary: {
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
} as const;
