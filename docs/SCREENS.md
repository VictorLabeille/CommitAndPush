# Écrans

Trois onglets (Bibliothèque · Séance · Historique) + deux écrans plein écran (Bilan, détail d'historique). Design system : voir `src/theme/` (crème / vert forêt / doré, Space Grotesk + Space Mono).

## Bibliothèque (`app/(tabs)/library.tsx`)

Segmented control **Exercices | Routines**.

- **Exercices** : recherche instantanée (sous-chaîne, insensible à la casse), lignes avec menu kebab (**Renommer** / **Archiver**), états *vide* et *aucun résultat*, CTA « + Nouvel exercice ».
- **Routines** : bascule « Voir les archives (N) », cartes (nom, badge « Archivée », compteur, aperçu, kebab), CTA « + Nouvelle routine ». Menu : Modifier / Archiver / Supprimer (ou Désarchiver / Supprimer si archivée). L'éditeur combine nom + recherche + **checklist ordonnée** (l'ordre de sélection = ordre de la routine).

## Entraînement (`app/(tabs)/index.tsx`)

- **État Repos** : liste des routines actives (« Démarrer ▸ ») + « + Séance libre » ; état vide.
- **Séance active** :
  - **En-tête sticky** vert : point clignotant « EN COURS », nom, chrono `HH:MM:SS`, **volume live**, bouton doré « Terminer la séance » (confirmation).
  - **Cartes d'exercice** (scroll libre) : nom + kebab (**Ignorer/Réactiver**, **Monter**, **Descendre**), **ghost data**, tableau de séries `N° | Poids | Reps | Fait ✓`, « + Série ». Carte ignorée grisée + badge « IGNORÉ ».
  - **FAB** « + » : ajout d'un exercice par recherche sur toute la bibliothèque (déjà présents masqués).

## Bilan (`app/workout/summary.tsx`)

Atteint après « Terminer ». Tuiles **Durée** (corrigeable) et **Volume** (auto), récapitulatif des exercices validés + ligne « Ignorés : … ». CTA **« Partager vers AI Coach Google Health »** (ouvre la sheet d'export) et « Enregistrer et fermer » (retour à l'Historique). La séance est déjà persistée en `completed`.

## Historique — liste (`app/(tabs)/history.tsx`)

Cartes triées par date décroissante (date, durée, nom, volume). Tap → détail. État vide.

## Historique — détail / édition (`app/history/[id].tsx`)

- Bouton retour + bascule **Modifier / Terminer**.
- **Lecture** : date, nom, tuiles, liste des exercices avec pastilles de séries (`80kg × 10`, `PdC × 12`) ; exercices ignorés grisés (« · ignoré »).
- **Édition** : nom éditable, cartes d'exercice (mêmes champs que la séance active + **✕ suppression de série**), **Ignorer/Réactiver**, correction de durée, **volume recalculé en direct**, « Supprimer la séance » (confirmation).
- CTA **partage** disponible (même sheet d'export).

## Sheet d'export (`components/workout/ExportSheet.tsx`)

Bloc de code sombre affichant le texte exact (voir [BUSINESS-RULES §7](BUSINESS-RULES.md#7--texte-dexport)). Boutons **Copier** (presse-papier + toast) et **Partager** (partage natif).
