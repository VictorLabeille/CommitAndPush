# Commit & Push

Application mobile **native** de suivi de musculation — **offline-first**, **sans backend ni compte**, UI **française**. La seule « intégration » est la génération, en fin de séance, d'un **résumé textuel structuré** partagé via le partage natif du téléphone vers l'« AI Coach » de Google Health.

Stack : **Expo SDK 56** · React Native 0.85 · **TypeScript strict** · **expo-router** · **Zustand + persist (AsyncStorage)**.

## Démarrer

```bash
npm install
npx expo start          # puis scanner le QR code avec Expo Go (SDK 56)
# ou : npm run android / npm run ios
```

> **Node :** RN 0.85 recommande Node ≥ 20.19.4 (ou 22 LTS). Le projet s'installe et bundle sous 20.19.2, mais pour les builds natifs, préférer Node 22 LTS (`nvm install 22`).

## Scripts

| Commande | Rôle |
|---|---|
| `npm start` | serveur de dev Expo |
| `npm test` | tests unitaires (logique métier) |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | ESLint Expo |

## Architecture

```
src/
├── app/                  # routes expo-router (Bibliothèque · Séance · Historique + Bilan + détail)
├── store/                # store Zustand persisté + opérations pures de séance (sessionOps)
├── logic/                # LOGIQUE MÉTIER PURE, testée : volume, export, ghost, format
├── theme/                # design tokens + typographie (Space Grotesk / Space Mono)
├── components/           # ui/ (kit réutilisable) + library/ + workout/ + history/
└── hooks/                # useChrono…
```

Principes : séparation **UI / logique / store** ; aucune logique métier dans les vues ; noms d'exercices/routines **figés** dans l'historique (intégrité référentielle) ; persistance **debouncée (~300 ms)** + flush sur validation / fin de séance / mise en arrière-plan (reprise à l'identique après kill).

### 📚 Documentation détaillée

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — structure, couches, état, persistance, navigation
- [`docs/DATA-MODEL.md`](docs/DATA-MODEL.md) — entités, relations, intégrité référentielle
- [`docs/BUSINESS-RULES.md`](docs/BUSINESS-RULES.md) — règles métier (§6) + format d'export (§7)
- [`docs/SCREENS.md`](docs/SCREENS.md) — description écran par écran

### Logique métier testée (`src/logic/__tests__`)

- `computeVolume` — Σ poids×reps des séries validées d'exercices actifs (poids de corps = 0).
- `buildExportText` — texte d'export **au caractère près** (§7) : filtres, formats, décimale virgule, `0kg x` pour le poids de corps.
- `ghostFor` — dernière perf validée d'un exercice (ou `null`).

```bash
npm test   # 16 tests
```

## Choix techniques notables

- **Partage de texte** : l'export utilise l'API `Share` de React Native (intent `ACTION_SEND text/plain`), seule adaptée au partage de **texte** vers l'AI Coach. `expo-sharing` (imposé) ne partage que des fichiers ; le presse-papier reste assuré par `expo-clipboard`.
- **Réorganisation des exercices** : implémentée via **Monter / Descendre** (comme le prototype de référence). `react-native-draggable-flatlist` est installé (stack imposée) mais non câblé par prudence vis-à-vis de Reanimated v4 (SDK 56) ; le vrai drag & drop pourra être branché ultérieurement sans changer le modèle de données.

## Référence design

Le dossier `design_handoff_commit_and_push/` (cahier des charges, README de handoff, prototype HTML) sert d'**oracle visuel et comportemental**. Il n'est pas embarqué dans l'app.
