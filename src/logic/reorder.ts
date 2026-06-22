/**
 * Réordonnancement pur et immuable d'un tableau.
 *
 * Mutualisé entre l'éditeur de routine (réordonner les exercices sélectionnés) et la
 * séance active (`sessionOps.moveExercise`). Déplace l'élément à `index` d'un cran vers
 * le haut (`dir = -1`) ou le bas (`dir = +1`) par échange avec son voisin.
 *
 * Retourne le **même** tableau (référence) si le déplacement sort des bornes — évite un
 * changement d'état inutile côté React.
 */
export function moveItem<T>(arr: T[], index: number, dir: -1 | 1): T[] {
  const target = index + dir;
  if (index < 0 || index >= arr.length) return arr;
  if (target < 0 || target >= arr.length) return arr;
  const next = [...arr];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
