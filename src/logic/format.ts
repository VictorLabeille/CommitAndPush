/**
 * Primitives de formatage / parsing — calquées sur le prototype validé
 * (méthodes fmtDate/fmtNum/fmtVol/parseW/parseR de `Commit & Push.dc.html`),
 * mais réimplémentées de façon DÉTERMINISTE (pas de dépendance à `Intl`/locale,
 * ni au moteur Hermes) afin que l'export soit identique partout et que les tests
 * unitaires soient stables quel que soit le runner.
 */

/** Date FR « JJ/MM/AAAA » (heure locale, comme `toLocaleDateString('fr-FR')`). */
export function fmtDate(ts: number): string {
  const d = new Date(ts);
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Valeur numérique avec séparateur décimal virgule (ex: 2.5 -> "2,5", 80 -> "80"). */
export function fmtNum(n: number): string {
  return String(n).replace('.', ',');
}

/** Volume : arrondi à l'entier + séparateur de milliers par espace (ex: 2400 -> "2 400"). */
export function fmtVol(n: number): string {
  const rounded = Math.round(n);
  const sign = rounded < 0 ? '-' : '';
  const digits = Math.abs(rounded).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return sign + grouped;
}

/** Parse un poids depuis une saisie texte. Virgule -> point ; invalide/négatif -> 0. */
export function parseWeight(v: string): number {
  const x = parseFloat(String(v).replace(',', '.'));
  return isNaN(x) || x < 0 ? 0 : x;
}

/** Parse des répétitions (entier). Invalide/négatif -> 0. */
export function parseReps(v: string): number {
  const x = parseInt(String(v), 10);
  return isNaN(x) || x < 0 ? 0 : x;
}

/** Chrono « HH:MM:SS » à partir d'un nombre de secondes écoulées. */
export function fmtChrono(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}
