/* Generateur du logo Commit&Push (dumbbell + fleche).
 * Rasteriseur maison : supersampling pour un anti-aliasing net.
 * Aucun moteur SVG requis (node + pngjs uniquement). */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

// ---- Couleurs (echantillonnees sur l'original) ----
const GREEN = [26, 55, 35];     // #1A3723
const CREAM = [247, 243, 232];  // #F7F3E8

// ---- Parametres geometriques (en px @1024, relatifs au centre barre) ----
const SIZE = 1024;
const CX = SIZE / 2;
const S = 1.08;               // echelle globale de l'artwork

// Disques : [offset centre depuis CX, hauteur, largeur]  (croissants vers le centre)
const PLATE_W = 44;
const PLATES = [
  { off: 198, h: 270, w: PLATE_W }, // interne (le plus haut)
  { off: 252, h: 210, w: PLATE_W }, // milieu
  { off: 305, h: 150, w: PLATE_W }, // externe
];
const CAP = { off: 346, h: 64, w: 28 }; // embout arrondi
const BAR_H = 46;                        // epaisseur barre
const PLATE_R = 14;                      // rayon coins disques

// Fleche
const ARROW = {
  tip: 252,        // hauteur de la pointe au-dessus du centre
  headH: 116,      // hauteur de la tete (triangle)
  headHalf: 70,    // demi-largeur base de tete
  shaftHalf: 24,   // demi-largeur du fut
  flareStart: 84,  // hauteur ou commence l'evasement
  flareHalf: 64,   // demi-largeur a la base (sur la barre)
};

// ---- Mise en page verticale : on centre la bbox de l'artwork ----
const topOff = ARROW.tip;                  // au-dessus du centre
const botOff = Math.max(...PLATES.map(p => p.h / 2)); // en-dessous du centre
// echelle effective + centre vertical (recalcules selon le facteur de marge)
let EFF = S;
let YC = SIZE / 2 - (botOff - topOff) * EFF / 2;       // centre barre (bbox centree)

// ---- Helpers geometrie (coordonnees ecran, y vers le bas) ----
function insideRoundRect(x, y, cx, cy, w, h, r) {
  const hw = w / 2, hh = h / 2;
  const dx = Math.abs(x - cx) - (hw - r);
  const dy = Math.abs(y - cy) - (hh - r);
  if (dx <= 0 && Math.abs(y - cy) <= hh) return true;
  if (dy <= 0 && Math.abs(x - cx) <= hw) return true;
  if (dx > 0 && dy > 0) return dx * dx + dy * dy <= r * r;
  return false;
}

function insidePolygon(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0], yi = pts[i][1];
    const xj = pts[j][0], yj = pts[j][1];
    if (((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

// ---- Construction des formes (en px @1024) ----
function buildShapes() {
  const yc = YC;
  // applique echelle EFF autour du centre vertical 512 et horizontal CX
  const sy = off => yc - off * EFF;            // offset au-dessus centre -> y
  const syd = off => yc + off * EFF;           // offset en-dessous centre -> y

  const rects = [];
  // Barre centrale (pleine largeur entre disques internes), derriere tout
  const innerEdge = (198) * EFF;
  rects.push({ cx: CX, cy: yc, w: innerEdge * 2 + PLATE_W * EFF, h: BAR_H * EFF, r: BAR_H * EFF / 2 });

  // Disques (gauche + droite)
  for (const p of [...PLATES, CAP]) {
    const r = p === CAP ? p.w / 2 * EFF : PLATE_R * EFF;
    for (const sign of [-1, 1]) {
      rects.push({ cx: CX + sign * p.off * EFF, cy: yc, w: p.w * EFF, h: p.h * EFF, r });
    }
  }

  // Fleche : polygone (moitie droite generee puis miroir)
  const A = ARROW;
  const yTip = sy(A.tip);
  const yHeadBase = sy(A.tip - A.headH);
  const yFlareStart = sy(A.flareStart);
  const yBarBottom = syd(BAR_H / 2);
  const headHalf = A.headHalf * EFF;
  const shaftHalf = A.shaftHalf * EFF;
  const flareHalf = A.flareHalf * EFF;

  // moitie droite, de la pointe vers le bas
  const right = [];
  right.push([CX, yTip]);                       // pointe
  right.push([CX + headHalf, yHeadBase]);       // barbe droite tete
  right.push([CX + shaftHalf, yHeadBase]);      // rentre vers le fut
  // fut droit jusqu'au debut de l'evasement
  right.push([CX + shaftHalf, yFlareStart]);
  // evasement concave (quart d'ellipse) du fut vers la barre
  const N = 24;
  for (let i = 1; i <= N; i++) {
    const t = i / N;                  // 0 -> haut(fut), 1 -> bas(barre)
    const x = CX + shaftHalf + (flareHalf - shaftHalf) * (1 - Math.cos(t * Math.PI / 2));
    const y = yFlareStart + (yBarBottom - yFlareStart) * Math.sin(t * Math.PI / 2);
    right.push([x, y]);
  }
  right.push([CX + flareHalf, yBarBottom]);

  // miroir gauche
  const left = [];
  for (let i = right.length - 1; i >= 0; i--) {
    const [x, y] = right[i];
    left.push([CX - (x - CX), y]);
  }
  const arrow = [...right, ...left];

  return { rects, polys: [arrow] };
}

// ---- Calcul de la couverture (supersampling) pour l'echelle effective courante ----
function coverage(SS = 4) {
  const { rects, polys } = buildShapes();
  const cov = new Float32Array(SIZE * SIZE);
  const inv = 1 / SS;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let hits = 0;
      for (let sy = 0; sy < SS; sy++) {
        const py = y + (sy + 0.5) * inv;
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) * inv;
          let inside = false;
          for (const r of rects) {
            if (insideRoundRect(px, py, r.cx, r.cy, r.w, r.h, r.r)) { inside = true; break; }
          }
          if (!inside) {
            for (const p of polys) { if (insidePolygon(px, py, p)) { inside = true; break; } }
          }
          if (inside) hits++;
        }
      }
      cov[y * SIZE + x] = hits / (SS * SS);
    }
  }
  return cov;
}

function setScale(mul) {
  EFF = S * mul;
  YC = SIZE / 2 - (botOff - topOff) * EFF / 2;
}

function writeOver(cov, bg, file) {
  const png = new PNG({ width: SIZE, height: SIZE });
  for (let i = 0; i < SIZE * SIZE; i++) {
    const a = cov[i], o = i * 4;
    png.data[o]     = Math.round(bg[0] * (1 - a) + GREEN[0] * a);
    png.data[o + 1] = Math.round(bg[1] * (1 - a) + GREEN[1] * a);
    png.data[o + 2] = Math.round(bg[2] * (1 - a) + GREEN[2] * a);
    png.data[o + 3] = 255;
  }
  fs.writeFileSync(file, PNG.sync.write(png));
}

function writeAlpha(cov, file) {
  const png = new PNG({ width: SIZE, height: SIZE });
  for (let i = 0; i < SIZE * SIZE; i++) {
    const a = cov[i], o = i * 4;
    png.data[o] = GREEN[0]; png.data[o + 1] = GREEN[1]; png.data[o + 2] = GREEN[2];
    png.data[o + 3] = Math.round(255 * a);
  }
  fs.writeFileSync(file, PNG.sync.write(png));
}

function main() {
  const outDir = path.join(__dirname, '..', 'assets', 'logo');
  fs.mkdirSync(outDir, { recursive: true });

  // 1) Icone pleine (fond creme) — pour icon.png / iOS
  setScale(1.0);
  const full = coverage(4);
  writeOver(full, CREAM, path.join(outDir, 'logo-1024.png'));
  writeAlpha(full, path.join(outDir, 'logo-foreground-full-1024.png'));

  // 2) Foreground adaptatif (transparent, ~62% de large -> tient dans la safe-zone)
  setScale(0.80);
  const safe = coverage(4);
  writeAlpha(safe, path.join(outDir, 'android-foreground-1024.png'));
  // monochrome themed icon : meme silhouette (le systeme la reteinte selon le theme)
  writeAlpha(safe, path.join(outDir, 'android-monochrome-1024.png'));
  // fond uni creme pour l'adaptive
  const bg = new PNG({ width: SIZE, height: SIZE });
  for (let i = 0; i < SIZE * SIZE; i++) { const o = i * 4; bg.data[o] = CREAM[0]; bg.data[o+1] = CREAM[1]; bg.data[o+2] = CREAM[2]; bg.data[o+3] = 255; }
  fs.writeFileSync(path.join(outDir, 'android-background-1024.png'), PNG.sync.write(bg));

  console.log('wrote: logo-1024.png, android-foreground-1024.png, android-background-1024.png');
}

main();
