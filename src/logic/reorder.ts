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

/**
 * Déplace l'élément `id` d'un cran parmi les seuls éléments qui satisfont `inGroup`
 * (ex. les routines actives), en l'échangeant avec son voisin du même groupe. Les
 * éléments hors groupe (routines archivées) gardent leur position dans le tableau.
 */
export function moveInGroup<T extends { id: string }>(
  arr: T[],
  id: string,
  dir: -1 | 1,
  inGroup: (item: T) => boolean,
): T[] {
  const index = arr.findIndex((x) => x.id === id);
  if (index < 0) return arr;
  let target = index + dir;
  while (target >= 0 && target < arr.length && !inGroup(arr[target])) target += dir;
  if (target < 0 || target >= arr.length) return arr;
  const next = [...arr];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
