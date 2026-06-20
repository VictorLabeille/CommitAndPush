# Cahier des charges — « Commit & Push » (v2)

> **Pipeline de production de ce document**
> 1. **Claude Design** : génère la maquette / le design system à partir des sections *Vision*, *Design System* et *Spécifications par écran*.
> 2. **Claude Code CLI** : implémente l'app à partir des sections *Stack technique*, *Modèles de données*, *Spécifications par écran*, *Règles métier* et *Critères d'acceptation*.
>
> **Consignes transverses pour l'IA :**
> - Pose des questions si une règle est ambiguë **avant** de coder.
> - Propose et fais valider l'**arborescence des fichiers** avant de générer le code des vues.
> - Construis de façon **incrémentale** en suivant les priorités MVP → V1.1.
>
> **Statut (mis à jour) :** l'étape *Claude Design* est **terminée**. Un **prototype interactif haute-fidélité** existe (`Commit & Push.dc.html`) et sert de référence visuelle **et comportementale** pour *Claude Code*. Le **§3** ci-dessous reflète désormais le design **validé** (et non plus la piste initiale « dark / néon »). Un dossier de handoff développeur — `design_handoff_commit_and_push/` — accompagne ce document.

---

## 1. Vision & Objectif

Application mobile **native** de suivi de musculation, **minimaliste** et **offline-first**, conçue pour une prise de masse sèche. Nom : **« Commit & Push »**.

Pas de backend, pas d'API distante, pas de compte utilisateur. La seule « intégration » est la **génération d'un résumé textuel structuré** à la fin d'une séance, partagé via le partage natif du téléphone vers le « AI Coach » de Google Health (l'app ne fait que produire et partager du texte).

**Langue de l'interface :** Français.

---

## 2. Stack technique (imposée)

| Domaine | Choix imposé |
|---|---|
| Framework | **Expo** (dernière version SDK stable, ≥ SDK 53 — confirmer la version exacte au démarrage) |
| Langage | **TypeScript** (strict mode activé) |
| Navigation | **expo-router** (file-based routing) |
| Bottom tabs | Tabs natifs d'`expo-router` |
| State + persistance | **Zustand** + middleware `persist` adossé à **AsyncStorage** |
| Listes performantes | `FlatList` (RN core) |
| Drag & drop | `react-native-gesture-handler` + `react-native-reanimated` + `react-native-draggable-flatlist` |
| Partage / presse-papier | `expo-sharing` (Share Intent) + `expo-clipboard` |
| Icônes | `@expo/vector-icons` |
| Gestion clavier | `KeyboardAvoidingView` (RN core) |

> Si une de ces librairies n'est pas compatible avec la version d'Expo retenue, signaler et proposer une alternative équivalente **avant** de coder.

**Qualité de code attendue :** composants réutilisables, code typé et commenté, séparation claire UI / logique / store, pas de logique métier dans les composants de vue.

---

## 3. Design System & UI/UX  *(design validé — voir prototype `Commit & Push.dc.html`)*

> **Note :** la direction « dark mode *Brutalist* / accent néon » initialement envisagée a été **remplacée, après validation, par une direction claire et chaleureuse** (crème / vert profond / doré). Les principes ergonomiques (fat-finger, claviers numériques, états visuels) sont inchangés.

- **Style :** Minimaliste, fonctionnel, éditorial. Aucune fioriture ; hiérarchie typographique forte ; beaucoup d'air.
- **Thème :** **Light mode**, fond crème chaud. **Vert forêt profond** pour les actions principales ; **doré sobre** pour les données et accents (volume, ghost data, badges).
- **Typographie :** **Space Grotesk** (UI, titres, labels) + **Space Mono** (toutes les valeurs chiffrées : poids, reps, chrono, dates, volume).
- **Ergonomie « fat-finger friendly » :** cibles tactiles ≥ **48 × 48 dp** (champs Poids/Reps 50 dp, bouton « Fait » 52 dp, FAB 62 dp).
- **Champs numériques :** clavier dédié (`keyboardType="decimal-pad"` pour Poids, `"number-pad"` pour Reps).
- **États visuels par écran :** normal, **vide** (empty state dédié par liste), **aucun résultat** (recherche), **erreur de saisie** (reps requis > 0), carte **« ignorée »** (grisée).

### 3.1 Design tokens (valeurs exactes du prototype)

| Token | Valeur | Usage |
|---|---|---|
| `bg` | `#E8E2D3` | Fond d'écran crème |
| `card` | `#F4F0E6` | Cartes secondaires |
| `raise` | `#FCFAF3` | Surfaces surélevées (cartes, sheets) |
| `ink` | `#20241B` | Texte principal |
| `muted` | `#827C68` | Texte secondaire |
| `green` | `#1E3B2C` | Actions principales, en-tête séance |
| `green2` | `#2F6A47` | État « validé » (série complétée) |
| `gold` | `#B58A36` | Données, ghost data, accents |
| `border` | `#DCD5C1` | Bords / hairlines |
| `danger` | `#A2412F` | Suppression, abandon |
| Rayons | 11–18 px (cartes/sheets), 44–54 px (écran / châssis) | |
| Police chiffres | Space Mono 700 | chrono, poids, reps, volume |

- **Présentation :** maquette dans un châssis type **Pixel** (coins ~44 px, **pilule centrale** « dynamic island », barre de gestes en bas). Le châssis n'est qu'un cadre de présentation — l'app native s'affiche plein écran.

---

## 4. Modèles de données (TypeScript)

> Tous les `id` sont des UUID string. Tous les timestamps sont en epoch ms (number).

```ts
interface Exercise {
  id: string;
  name: string;            // ex: "Développé couché"
  isArchived: boolean;     // soft delete (voir Règles métier §6.1)
  createdAt: number;
}

interface Routine {
  id: string;
  name: string;            // ex: "Push Day"
  exerciseIds: string[];   // ordre = ordre d'affichage par défaut
  isArchived: boolean;     // archivage réversible (masquée de l'écran Entraînement, voir §6.1)
  createdAt: number;
}

interface WorkoutSession {
  id: string;
  routineId: string | null;        // null si séance libre
  routineName: string;             // copie figée du nom à l'instant T
  startTime: number;
  endTime: number | null;
  durationOverrideMin: number | null; // si l'utilisateur corrige la durée
  status: 'active' | 'completed';
  exercises: WorkoutExercise[];
}

interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;            // copie figée du nom à l'instant T
  status: 'active' | 'skipped';
  orderIndex: number;
  sets: WorkoutSet[];
}

interface WorkoutSet {
  id: string;
  weight: number;        // kg, décimales autorisées (ex: 2.5). 0 accepté = poids de corps
  reps: number;          // entier ≥ 0
  completed: boolean;    // passe à true quand l'utilisateur clique "Valider"
}
```

**Décisions clés intégrées :**
- `WorkoutExercise` et `WorkoutSession` **figent une copie** du nom (`exerciseName`, `routineName`). Renommer ou archiver un exercice ne corrompt donc **jamais** l'historique.
- `WorkoutSet.completed` distingue une série saisie d'une série réellement validée.

**Versioning du store :** le middleware `persist` doit déclarer une `version` et une fonction `migrate` (squelette à prévoir dès la v1 pour absorber les futurs changements de schéma sans casser les données existantes).

---

## 5. Architecture applicative — 3 onglets (Bottom Navigation)

### Onglet 1 — Bibliothèque (back-office personnel)

**Section Exercices :** CRUD complet sur une liste textuelle d'exercices personnalisés. **Barre de recherche** en tête de liste (filtre instantané ; état « Aucun résultat »). Menu par exercice : **Renommer** / **Archiver** (soft delete).
**Section Routines :** créer une séance type (nom + sélection d'exercices par cases à cocher depuis la bibliothèque, **avec recherche** dans le sélecteur). L'ordre de sélection définit l'ordre par défaut dans la routine.
- Menu par routine : **Modifier** (ré-ouvre le sélecteur pré-rempli), **Archiver** / **Désarchiver**, **Supprimer**.
- Bouton **« Voir les archives (N) »** : bascule la liste vers les routines archivées (masquées de l'écran Entraînement ; badge « Archivée »).

> **Règle de recherche transverse :** dès qu'une liste puise dans la bibliothèque d'exercices (section Exercices, sélecteur de routine, FAB « + Ajouter un exercice »), une **recherche par sous-chaîne insensible à la casse** est disponible.

### Onglet 2 — Entraînement (cœur de l'app)

**État Repos :** liste des routines disponibles, bouton « Démarrer » par routine.

**État Actif (séance en cours) :**
- **En-tête sticky :** chronomètre global (HH:MM:SS) + bouton « Terminer la séance » (avec confirmation).
- **Corps :** liste scrollable de **Cartes d'Exercice**, **scroll libre** (aucune navigation forcée étape par étape).
- **Bouton flottant (FAB) :** « + Ajouter un exercice » → **recherche dans toute la bibliothèque** puis ajoute à la volée un exercice dans la séance active (séance libre possible même sans routine ; les exercices déjà présents sont masqués).

**Carte d'Exercice :**
- Nom de l'exercice en gros.
- Menu d'options : **« Ignorer »** (grise la carte, `status: skipped`) / **« Réorganiser »** (drag & drop en cible ; le prototype propose **Monter / Descendre** — l'implémentation native peut faire du vrai DnD).
- **Ghost data :** au-dessus de la zone de saisie, en petit texte gris, la perf de la dernière séance pour cet exercice (ex : *« Dern. : 80kg×10, 80kg×10, 80kg×9 »*). Règle de résolution en §6.2.
- **Saisie :** tableau de séries — `N° | [Poids] | [Reps] | [Fait ✓]`. Ajout de ligne via « + Série ». Le champ Poids accepte « 0 ». **Pas de suppression manuelle de série en séance active** : une série **non validée n'est jamais comptée** (volume + export), ce qui rend un « ✕ » superflu. Le bouton **« Fait » (✓)** marque la série comme réellement effectuée.

**Écran de Fin de Séance (Bilan) :**
- Durée totale, **modifiable manuellement** (`durationOverrideMin`).
- Volume total soulevé, **calculé automatiquement** (§6.3).
- **Bouton d'export (crucial) :** gros bouton « Partager vers AI Coach Google Health » → Share Intent natif **et** copie presse-papier du texte généré (§7).

### Onglet 3 — Historique

- Liste de toutes les séances `completed`, triées par date décroissante.
- Détail d'une séance au clic.
- **Mode édition complet** (bouton « Modifier ») : nom de la séance, poids/reps de chaque série, (dé)validation, **ajout/suppression de série**, **ignorer/réactiver un exercice**, correction de la durée — le **volume se recalcule en direct**.
- **Suppression d'une séance** de l'historique (avec confirmation).
- Bouton « Partager vers AI Coach Google Health » disponible aussi ici (export par séance, voir §7).

---

## 6. Règles métier (à respecter strictement)

### 6.1 Intégrité référentielle
- La **suppression** d'un exercice utilisé dans une routine ou un historique est un **soft delete** (`isArchived: true`) : il disparaît des listes de sélection mais reste lisible dans l'historique passé.
- Le **renommage** d'un exercice n'affecte pas les séances déjà enregistrées (grâce à la copie figée du nom).
- Supprimer une routine n'affecte pas les séances passées qui l'ont utilisée.
- Une routine peut être **archivée** (`Routine.isArchived = true`) : masquée de l'écran Entraînement et de la liste active de la Bibliothèque, consultable via « Voir les archives », **réversible** (Désarchiver). La **suppression** définitive reste disponible et n'affecte pas les séances passées.

### 6.2 Ghost data (« dernière perf »)
Pour un `exerciseId` donné : prendre la **dernière `WorkoutSession` `completed`** (par `endTime` décroissant) contenant ce `exerciseId` avec au moins une série `completed`, puis afficher ses séries validées. Si aucune : ne rien afficher (ou « Première fois »).

### 6.3 Calcul du volume total
- Volume = Σ (`weight` × `reps`) sur **toutes les séries `completed` des exercices `active`** (les exercices `skipped` et les séries non validées sont exclus).
- **Poids de corps (`weight = 0`)** : contribue 0 au volume (comportement attendu, pas un bug). Le détail de l'exercice reste exporté.

### 6.4 Persistance temps réel
- L'état de la séance active est persisté en continu : après un **kill** de l'app, la séance reprend exactement dans le même état.
- Pour éviter une écriture à chaque frappe, appliquer un **debounce (~300 ms)** sur la persistance des saisies, tout en garantissant la reprise après kill.

### 6.5 Validations de saisie
- `reps` : entier ≥ 0. `weight` : nombre ≥ 0, décimales autorisées.
- Rejeter / nettoyer les entrées non numériques. Une série ne peut être `completed` que si `reps > 0`.
- **Suppression de série :** interdite en séance active (une série non validée est simplement exclue du calcul) ; **autorisée en édition d'historique**.

### 6.6 Confirmations
- « Terminer la séance » et tout abandon de séance active → boîte de confirmation.

---

## 7. Génération du texte d'export

Concaténer les données de **la séance concernée** (active à sa clôture, ou séance sélectionnée dans l'historique) dans le string ci-dessous.

- **Date** : date de `startTime` de la séance, format `JJ/MM/AAAA` (locale FR).
- **Durée** : `durationOverrideMin` si renseigné, sinon `(endTime − startTime)` en minutes.
- **N'inclure que** les exercices `active` et leurs séries `completed`. Séparateur décimal cohérent.

```
Coach, voici ma séance de musculation à consigner.
Règle absolue : associe chaque exercice ci-dessous à sa nomenclature standard dans ta base de données Google Health pour éviter les doublons dans mon historique.

- Date : [JJ/MM/AAAA]
- Durée totale : [Durée] minutes
- Volume total soulevé : [X] kg

Détail des exercices (Poids x Répétitions) :

1. [Nom Exercice 1] : [Poids]kg x [Reps], [Poids]kg x [Reps]...
2. [Nom Exercice 2] : [Poids]kg x [Reps], [Poids]kg x [Reps]...
```

---

## 8. Priorisation (build incrémental)

> **Statut prototype :** tout le périmètre **P0 + P1** ci-dessous est **démontré** dans `Commit & Push.dc.html`. Ajouts par rapport au cahier initial, également maquettés : **recherche transverse** dans les bibliothèques, **archivage/désarchivage de routines** + vue archives, **édition complète et suppression** des séances d'historique. Le prototype simule la persistance via l'état applicatif ; *Claude Code* doit la réaliser avec Zustand + `persist` (§6.4).

**MVP (P0)**
- Onglet Bibliothèque (CRUD Exercices + Routines).
- Onglet Entraînement : démarrer une séance, cartes d'exercice, saisie/validation de séries, chrono, terminer la séance.
- Persistance temps réel + reprise après kill.
- Écran Bilan + génération et partage du texte d'export.
- Onglet Historique (liste + détail).

**V1.1 (P1)**
- Ghost data (dernière perf).
- Drag & drop de réorganisation, « Ignorer » un exercice.
- FAB « + Ajouter un exercice » en séance.
- Édition des séances passées + export depuis l'historique.
- Correction manuelle de la durée.

**Nice-to-have (P2, hors périmètre initial)**
- Minuteur de repos entre séries, RPE, statistiques/graphes de progression.

---

## 9. Critères d'acceptation (Definition of Done)

- **Persistance :** je démarre une séance, saisis 2 séries, je kill l'app → à la réouverture la séance active est identique (exercices, séries, chrono cohérent).
- **Volume :** une séance avec 3×10 @ 80 kg + 1 exercice ignoré → le volume n'inclut pas l'exercice ignoré ; un exercice à 0 kg n'augmente pas le volume mais apparaît à l'export.
- **Intégrité :** j'archive un exercice présent dans une séance passée → la séance passée reste lisible avec l'ancien nom ; l'exercice n'apparaît plus dans la sélection de routine.
- **Export :** le texte généré respecte le template au caractère près, exclut exercices ignorés et séries non validées, et est à la fois copié et partagé.
- **Ghost data :** un exercice déjà réalisé affiche sa dernière perf validée ; un exercice jamais fait n'en affiche pas.
- **Ergonomie :** le clavier ne masque jamais le champ actif ; toutes les cibles tactiles principales ≥ 48 dp.

**Tests demandés (a minima, logique pure) :**
- Calcul du volume (cas ignoré / non validé / poids 0).
- Génération du texte d'export (formatage date, filtres, séparateurs).
- Résolution de la ghost data.

---

## 10. Livrables attendus

1. Arborescence des fichiers proposée **et validée** avant génération des vues.
2. Code source TypeScript Expo, structuré, typé, commenté.
3. Store Zustand avec `persist` versionné (+ squelette `migrate`).
4. Tests unitaires sur les 3 logiques métier ci-dessus.
