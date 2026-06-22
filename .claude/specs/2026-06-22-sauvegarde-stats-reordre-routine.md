# Cadrage — Sauvegarde des données, onglet Stats & réordonnancement des routines

> Statut : validé · Date : 2026-06-22

Trois besoins regroupés car demandés ensemble, mais **indépendants** et livrables
séparément. Ordre de valeur/risque conseillé : **Réordre routine** (simple) →
**Sauvegarde** (filet de sécurité, le plus important) → **Stats** (le plus large).

---

## 1. Contexte & objectif métier

- **Problème / besoin** :
  1. L'app est **100 % offline, sans backend** : les données ne vivent que dans le
     stockage local. **Désinstaller l'app = tout perdre.** Aucun filet de sécurité.
  2. L'utilisateur ne peut pas **visualiser sa progression** (poids, régularité,
     répartition) : l'historique existe mais reste une liste de séances.
  3. À la création d'une routine, **l'ordre des exercices = l'ordre où on les coche**,
     impossible à corriger sans tout décocher/recocher.
- **Valeur attendue** :
  1. Pouvoir **réinstaller l'app (ou changer de tél) sans perdre son historique**.
  2. **Motivation & pilotage** : voir que ça progresse, repérer les trous de régularité.
  3. Composer une routine **propre du premier coup**, dans l'ordre voulu.
- **Parties prenantes** : utilisateur unique (app perso, mono-appareil). Pas de rôles.
- **Indicateurs de succès** :
  - Une sauvegarde exportée puis réimportée sur une install neuve restitue **à
    l'identique** exercices + routines + historique complet.
  - L'onglet Stats répond aux 3 questions nommées sans calcul mental.
  - Réordonner un exercice dans une routine se fait **sans le retirer**.

## 2. Périmètre

### Dans le périmètre

**A. Sauvegarde / restauration complète**
- **Exporter** un fichier de sauvegarde unique contenant **toutes les données métier
  persistées** : exercices (archivés inclus), routines (archivées incluses),
  historique complet des séances, et la séance active éventuelle.
- **Importer** un fichier de sauvegarde → **remplace intégralement** les données
  actuelles (snapshot), **après confirmation explicite**.
- Le fichier porte une **version de schéma** pour rester restaurable après une mise à
  jour de l'app (réutilise le `version`/`migrate` existant du store).
- Distinct de l'**export-coach texte** existant (par séance, partiel) — celui-ci est
  **conservé tel quel**.
- **Rappel de sauvegarde** : quand des séances ont été enregistrées **depuis le dernier
  export**, l'app invite (de façon **non bloquante**) à exporter, et déclenche l'export
  en un geste. Seul « automatique » réaliste sur mobile sans backend (décision du
  2026-06-22 : un auto-export silencieux n'est pas praticable proprement).

**B. Onglet « Stats » (4ᵉ onglet, lecture seule, dérivé de l'historique)**
- **Évolution du poids par exercice** : courbe du **top set** (poids max validé) par
  séance, exercice sélectionnable.
- **Moyenne de séances par semaine** : moyenne glissante sur les **4 dernières
  semaines** (séances des 4 dernières semaines ÷ 4).
- **Répartition des séances par jour de la semaine**.
- **Records (PR) par exercice** : meilleure perf jamais atteinte.
- **Régularité (streak)** : semaines consécutives avec ≥ 1 séance (série en cours +
  meilleure série).
- **Durée moyenne de séance**.

**C. Réordonnancement des exercices d'une routine**
- Pouvoir **changer l'ordre** des exercices sélectionnés, en **création** comme en
  **modification** d'une routine.
- Réutilise le pattern **Monter/Descendre** déjà en place en séance active.
- L'ordre défini = ordre par défaut au démarrage d'une séance depuis cette routine.

### Hors périmètre (explicite)

- **Synchro cloud / compte / multi-appareils continu** → contredit le choix
  offline-first ; évolution future éventuelle.
- **Auto-export silencieux** (écriture périodique d'un fichier vers Drive sans aucun
  geste) → impraticable proprement sur mobile (modèle de permissions) ; remplacé par le
  **rappel** (cf. périmètre A).
- **Sauvegarde cloud de l'OS** (iCloud / Google auto-backup) → non piloté par l'app et
  **ne couvre pas** le simple désinstall→réinstall (surtout iOS). Éventuel **bonus
  gratuit** (vérifier qu'elle n'est pas désactivée), mais **pas** un mécanisme sur lequel
  on s'appuie.
- **Fusion de sauvegardes** (combiner 2 appareils) → import = remplacement seulement.
- **Chiffrement du fichier** de sauvegarde → fichier en clair (données perso non
  sensibles ; l'utilisateur choisit où le ranger).
- **Stat Volume / tonnage dans le temps** → écartée de la v1 (réintégrable plus tard).
- **Édition/saisie depuis l'onglet Stats** → lecture seule.
- **Réordre par glisser-déposer** (`react-native-draggable-flatlist`) → on garde
  Monter/Descendre (prudence Reanimated v4, cohérence app).

### Hypothèses

- App mono-utilisateur, mono-appareil : pas de concurrence ni de conflits d'accès.
- Le rappel s'appuie sur un marqueur persistant **`lastBackupAt`** (date du dernier
  export). « Séances non sauvegardées » = séances terminées après ce marqueur (dérivé de
  l'historique, sans compteur séparé). Seuil de rappel **fixe en v1 (proposé : 5
  séances)**.
- Les jours de la semaine et la notion de « semaine » sont calculés en **heure locale
  de l'appareil** (semaine **lundi→dimanche**, locale FR).
- Le « top set » et le PR se classent par **poids le plus lourd**, puis **reps** en cas
  d'égalité de poids.
- Les stats incluent les **séances libres** (sans routine) et l'historique des
  exercices **archivés** (la donnée reste réelle).
- La progression par poids n'a de sens que pour les exos chargés ; **poids de corps
  (0 kg)** = cas à part (cf. §3).

## 3. Cas limites, erreurs & états dégradés

### A. Sauvegarde / restauration

| Cas | Déclencheur | Comportement attendu |
|-----|-------------|----------------------|
| Export à vide | Aucune donnée encore saisie | Export autorisé (fichier valide, collections vides) ; éventuel toast « rien à sauvegarder pour l'instant ». |
| Fichier invalide / corrompu | Import d'un fichier non-JSON, tronqué ou d'une autre app | **Refus net, données actuelles intactes**, message clair « Fichier de sauvegarde invalide ». |
| Mauvaise structure | JSON valide mais pas le bon format | Idem : refus, aucun remplacement. |
| Version de schéma ancienne | Sauvegarde d'une version antérieure de l'app | **Migration** appliquée (via `migrate`) puis import. |
| Version inconnue / plus récente | Sauvegarde d'une version future | Refus avec message « Sauvegarde trop récente, mets l'app à jour ». |
| Import atomique | Échec en cours d'import | **Tout-ou-rien** : soit le remplacement complet réussit, soit l'état d'origine est conservé. Jamais d'état à moitié écrit. |
| Confirmation avant écrasement | L'utilisateur lance un import | Confirmation explicite « Ceci écrasera toutes tes données actuelles. Continuer ? » avant tout remplacement. |
| Séance en cours pendant l'import | `activeSession` non nulle | **Bloquer l'import** tant qu'une séance est active : « Termine ou abandonne ta séance en cours avant d'importer. » (évite d'écraser silencieusement une séance live). |
| Caractères spéciaux / accents / emoji | Noms d'exos/routines | Préservés à l'identique (UTF-8), aller-retour sans perte. |
| Décimales de poids | 2,5 kg, etc. | Préservées exactement. |
| Annulation système | L'utilisateur annule le sélecteur de fichier / partage | Aucune action, aucun message d'erreur. |
| Rappel : rien à sauvegarder | 0 séance depuis le dernier export (ou app vide) | **Aucun rappel** (rien à perdre). |
| Rappel : seuil atteint | ≥ N séances (proposé 5) enregistrées depuis le dernier export | Invite **non bloquante** à exporter, lance l'export en 1 geste. |
| Rappel ignoré / reporté | L'utilisateur ferme le rappel sans exporter | **Ne pas harceler** : pas de réaffichage à chaque ouverture ; re-déclenchement au palier suivant. |
| Export à l'issue inconnue | La feuille de partage ne signale pas le succès réel | Best-effort : un export **lancé** réinitialise `lastBackupAt` (l'OS ne permet pas de détecter une annulation de partage de façon fiable). |

### B. Stats

| Cas | Déclencheur | Comportement attendu |
|-----|-------------|----------------------|
| Aucune séance | Nouvel utilisateur | **État vide** pédagogique : « Fais ta première séance pour voir tes stats ». |
| Une seule séance | Historique = 1 | Afficher la valeur/point unique, **pas de tendance** ni de courbe trompeuse. |
| Exercice jamais réalisé | Sélection d'un exo sans série validée | Pas de courbe ; message « Pas encore de données pour cet exercice ». |
| Exercice au poids de corps (0 kg) | Top set = 0 kg | La courbe « poids » est plate → **basculer sur la meilleure perf en reps** et l'indiquer « poids de corps ». |
| Séries non validées | Séries saisies mais non « Fait » | **Exclues** de toutes les stats (cohérent avec volume/export existants). |
| Exercices `skipped` | Exo passé dans une séance | Exclus des stats de cet exo pour cette séance. |
| Exercice archivé avec historique | Archivé après usage | Son historique reste comptabilisé ; dans le sélecteur d'exo, le **proposer en second, taggé « archivé »**. |
| Exercice renommé | Renommage après des séances | La progression est **stitchée par identité d'exercice** (pas par nom figé) → continuité ; affichage du nom courant. |
| Égalité de top set | Même poids, reps différentes dans une séance | Retenir la série la plus lourde ; départage par reps. |
| Semaine sans séance | Trou dans la régularité | **Casse le streak** ; la moyenne hebdo est sur une fenêtre fixe de 4 semaines (dénominateur = 4, les semaines creuses tirent la moyenne vers le bas). |
| Séance à cheval sur minuit | startTime/endTime autour de 00h | Rattachée au **jour de `startTime`** (heure locale). |
| Durée corrigée | `durationOverrideMin` renseigné | La durée moyenne utilise la durée corrigée (cohérent avec `computeDurationMin`). |
| Très long historique | Beaucoup de séances | Affichage **lisible** (courbe scrollable / échantillonnée) — confort, non bloquant. |

### C. Réordonnancement routine

| Cas | Déclencheur | Comportement attendu |
|-----|-------------|----------------------|
| Un seul exercice | Routine à 1 exo | Boutons Monter/Descendre désactivés / sans effet. |
| Premier / dernier | Monter le 1ᵉʳ, descendre le dernier | Action désactivée (pas de wrap-around). |
| Désélection après réordre | On retire un exo réordonné | L'ordre relatif des exos restants est **préservé**. |
| Modif de routine | Réordonner une routine existante | Met à jour la routine ; **n'affecte PAS** les séances passées (noms/ordre figés à l'époque — intégrité référentielle §6.1). |
| Texte d'aide obsolète | « l'ordre = ordre de sélection » | À **mettre à jour** : l'ordre est désormais réarrangeable explicitement. |

## 4. Critères d'acceptation

- [ ] Export → désinstallation simulée (purge) → import : exercices, routines et
      historique **identiques** (noms, dates, poids/reps, statuts, archivage).
- [ ] Un fichier invalide n'altère **jamais** les données présentes.
- [ ] Une sauvegarde issue d'une version antérieure du schéma se restaure après mise à
      jour de l'app.
- [ ] L'import demande une confirmation explicite et refuse tant qu'une séance est active.
- [ ] Après N séances sans export, un rappel non bloquant propose de sauvegarder ; après
      un export, le rappel disparaît et ne réapparaît qu'au palier suivant.
- [ ] L'onglet Stats affiche les 6 indicateurs retenus, avec état vide propre à 0 séance.
- [ ] La courbe « poids » d'un exo suit son top set par séance et reste continue malgré
      un renommage.
- [ ] On peut réordonner les exercices d'une routine (création **et** modif) ; l'ordre
      est repris au démarrage d'une séance depuis cette routine.

## 5. Décisions tranchées & question restante

Tranché le 2026-06-22 :
- **Moyenne séances/semaine** : fenêtre glissante **4 dernières semaines** (÷ 4).
- **Poids de corps (0 kg)** : bascule sur **meilleures reps**, labellisé « poids de corps ».
- **Exercices archivés** : **affichés en second, taggés « archivé »** dans le sélecteur.
- **PR** : **poids le plus lourd validé** (départage aux reps) ; pas de PR de volume en v1.

Reste à préciser en **plan technique** (relève du « comment ») :
- [ ] **Format/extension du fichier** de sauvegarde — proposé : un **`.json`** lisible,
      nommé p. ex. `commit-and-push-sauvegarde-AAAA-MM-JJ.json`, partagé via la feuille
      de partage du système (Drive, Fichiers, mail…).

---

> **Suite** : ce cadrage peut alimenter un **plan technique** (modèle inchangé pour A et
> C ; B = logique pure dérivée de l'historique, testable comme `volume.ts`/`ghost.ts`).
> Penser à mettre à jour le catalogue Obsidian (`Projets/Commit & Push.md`) au jalon.
