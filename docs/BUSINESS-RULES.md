# Règles métier

Mapping des règles du cahier des charges (§6 et §7) vers le code. La logique est **pure et testée** (`src/logic/__tests__`, 16 tests).

## §6.1 — Intégrité référentielle

Garantie par la **copie figée des noms** (voir [DATA-MODEL](DATA-MODEL.md)). Archivage = soft delete (`isArchived`). Suppression d'une routine sans impact sur les séances passées. Routines désarchivables.

## §6.2 — Ghost data (« dernière perf »)

`ghostFor(exerciseId, sessions)` — `src/logic/ghost.ts`

Prend la dernière séance `completed` (par `endTime` décroissant) contenant l'exercice avec **au moins une série validée**, puis affiche ses séries validées :

```
Dern. : 80kg×10, 80kg×10, 80kg×9      // PdC×12 pour le poids de corps
```

Renvoie `null` si l'exercice n'a jamais été réalisé.

## §6.3 — Volume total

`computeVolume(session)` — `src/logic/volume.ts`

```
volume = Σ (weight × reps)   pour toutes les séries `completed` des exercices `active`
```

- exercices `skipped` exclus ; séries non validées exclues ;
- poids de corps (`weight = 0`) → contribue 0 (mais l'exercice apparaît quand même à l'export).

## §6.4 — Persistance temps réel

Écriture AsyncStorage **debouncée (~300 ms)** + **flush** sur validation de série, fin de séance et passage en arrière-plan. Reprise à l'identique après kill. Détails dans [ARCHITECTURE](ARCHITECTURE.md#persistance-cahier-64).

## §6.5 — Validations de saisie

- `reps` : entier ≥ 0 ; `weight` : nombre ≥ 0, décimales autorisées. Entrées non numériques nettoyées (`parseWeight`/`parseReps`, NaN → 0).
- Une série ne peut être validée que si **`reps > 0`** (sinon toast « Renseigne des répétitions (> 0) »).
- Modifier les reps à ≤ 0 **dévalide** automatiquement la série.
- **Suppression de série** : interdite en séance active, autorisée en édition d'historique.

## §6.6 — Confirmations

« Terminer la séance » et « Supprimer la séance » passent par une feuille de confirmation (`ConfirmSheet`).

## §7 — Texte d'export

`buildExportText(session)` — `src/logic/exportText.ts`. **Conforme au caractère près** au prototype de référence.

- N'inclut que les exercices `active` ayant **au moins une série validée**, et seulement les séries validées.
- Date : `JJ/MM/AAAA`. Durée : `durationOverrideMin` sinon `(endTime − startTime)` arrondi en minutes. Volume : arrondi, séparateur de milliers par espace.
- Décimale **virgule** ; séparateur poids/reps `« kg x »` (x minuscule) ; poids de corps exporté littéralement `0kg x …`.

```
Coach, voici ma séance de musculation à consigner.
Règle absolue : associe chaque exercice ci-dessous à sa nomenclature standard dans ta base de données Google Health pour éviter les doublons dans mon historique.

- Date : 20/06/2026
- Durée totale : 65 minutes
- Volume total soulevé : 2 820 kg

Détail des exercices (Poids x Répétitions) :

1. Développé couché : 80kg x 10, 80kg x 10, 80kg x 9
2. Tractions : 0kg x 12
```

Le texte est **copié** (`expo-clipboard`) **et partageable** (API `Share` de React Native, intent texte/plain).

## Critères d'acceptation (§9)

Couverts par les tests unitaires (volume, export, ghost) et vérifiables manuellement sur device : reprise après kill, intégrité à l'archivage, export filtré/conforme, ghost data, ergonomie clavier + cibles ≥ 48 dp.
