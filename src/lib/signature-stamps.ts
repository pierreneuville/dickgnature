import type { Tone } from "@/lib/tone";

// Galerie de motifs « signature dickgnature » : des gribouillis cartoon, bon enfant et jamais
// explicites, posables en un tap comme signature-gag. Chaque motif est décrit par des tracés
// (polylignes) en coordonnées normalisées 0..1, exactement comme le tampon historique du canvas
// (cf. signature-canvas.tsx) : ils sont ré-échelonnés à la taille du canvas puis injectés dans
// signature_pad, d'où un export PNG identique aux autres signatures — aucune régression sur la
// persistance ni sur l'empreinte de preuve.
//
// Fun-only par domaine : `stampsForTone` ne renvoie ces motifs qu'en ton "fun". En "serious" la
// galerie est vide (aucun humour imposé au signataire), au même titre que le mode "pattern".

export type StampPoint = readonly [number, number];
export type StampStroke = ReadonlyArray<StampPoint>;

// Union figée des motifs livrés : sert de clé i18n littérale (`signatureStamps.labels.<id>`),
// ce qui permet à next-intl de valider les clés au type-check (cf. `t(\`labels.${stamp.id}\`)`).
export type StampId = "classic" | "lean" | "southpaw" | "grand" | "petite" | "curvy";

export type SignatureStamp = {
  /** Identifiant stable, sert de clé i18n (`signatureStamps.labels.<id>`) et de valeur de sélection. */
  readonly id: StampId;
  /** Tracés normalisés (0..1). Le premier tracé sert aussi de pochoir guide dans le canvas. */
  readonly strokes: ReadonlyArray<StampStroke>;
};

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

// Approxime un cercle par une polyligne fermée (les « bases » du gribouillis).
function circle(cx: number, cy: number, r: number, segments = 14): StampStroke {
  const pts: StampPoint[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push([clamp01(cx + r * Math.cos(a)), clamp01(cy + r * Math.sin(a))]);
  }
  return pts;
}

// Construit un motif paramétré : une hampe à bout arrondi (tracé-contour) + deux bases circulaires.
// `tiltDeg` incline le motif (0 = vertical), `length` sa hauteur, `girth` sa demi-largeur.
function makeDoodle(params: {
  id: StampId;
  tiltDeg: number;
  length: number;
  girth: number;
}): SignatureStamp {
  const { id, tiltDeg, length, girth: g } = params;
  const cx = 0.5;
  const cy = 0.62;
  const th = (tiltDeg * Math.PI) / 180;
  // Direction « vers le haut » inclinée (l'axe y de l'écran descend, d'où le -cos).
  const dir: StampPoint = [Math.sin(th), -Math.cos(th)];
  const perp: StampPoint = [Math.cos(th), Math.sin(th)];

  const p = (bx: number, by: number, ax: number, ay: number, s: number): StampPoint => [
    clamp01(bx + ax * s),
    clamp01(by + ay * s),
  ];

  const tipx = cx + dir[0] * length;
  const tipy = cy + dir[1] * length;

  const leftBase = p(cx, cy, perp[0], perp[1], g);
  const rightBase = p(cx, cy, perp[0], perp[1], -g);

  // Calotte arrondie du bout : balaie un demi-tour de +perp (gauche) vers -perp (droite) en
  // passant par la direction sortante `dir`.
  const capSegments = 8;
  const cap: StampPoint[] = [];
  for (let i = 0; i <= capSegments; i++) {
    const phi = th - (Math.PI * i) / capSegments;
    cap.push([clamp01(tipx + g * Math.cos(phi)), clamp01(tipy + g * Math.sin(phi))]);
  }

  // Contour continu : base gauche → flanc gauche → calotte → flanc droit → base droite.
  const outline: StampStroke = [leftBase, ...cap, rightBase];

  // Deux bases circulaires, décalées sous la hampe de part et d'autre.
  const ballR = g * 0.95;
  const ballL = circle(
    cx + perp[0] * g * 1.15 - dir[0] * g * 0.8,
    cy + perp[1] * g * 1.15 - dir[1] * g * 0.8,
    ballR,
  );
  const ballRr = circle(
    cx - perp[0] * g * 1.15 - dir[0] * g * 0.8,
    cy - perp[1] * g * 1.15 - dir[1] * g * 0.8,
    ballR,
  );

  return { id, strokes: [outline, ballL, ballRr] };
}

// Le set proposé (6 motifs distincts par inclinaison / hauteur / largeur). Le premier reprend
// l'esprit du tampon historique (vertical, taille moyenne).
export const SIGNATURE_STAMPS: ReadonlyArray<SignatureStamp> = [
  makeDoodle({ id: "classic", tiltDeg: 0, length: 0.34, girth: 0.075 }),
  makeDoodle({ id: "lean", tiltDeg: 18, length: 0.32, girth: 0.07 }),
  makeDoodle({ id: "southpaw", tiltDeg: -18, length: 0.32, girth: 0.07 }),
  makeDoodle({ id: "grand", tiltDeg: 0, length: 0.4, girth: 0.085 }),
  makeDoodle({ id: "petite", tiltDeg: 0, length: 0.24, girth: 0.06 }),
  makeDoodle({ id: "curvy", tiltDeg: 8, length: 0.36, girth: 0.082 }),
];

// Fun-only : aucun motif en ton "serious".
export function stampsForTone(tone: Tone): ReadonlyArray<SignatureStamp> {
  return tone === "fun" ? SIGNATURE_STAMPS : [];
}

export function findStamp(id: string): SignatureStamp | undefined {
  return SIGNATURE_STAMPS.find((s) => s.id === id);
}

// Groupe de points au format signature_pad (mêmes réglages que le tampon historique), prêt à
// être passé à `pad.fromData`. Les coordonnées normalisées sont mises à l'échelle du canvas.
export type StampPointGroup = {
  penColor: string;
  dotSize: number;
  minWidth: number;
  maxWidth: number;
  velocityFilterWeight: number;
  compositeOperation: "source-over";
  // Tableau mutable : signature_pad `fromData` attend des `PointGroup[]` mutables.
  points: Array<{ x: number; y: number; time: number; pressure: number }>;
};

export function stampToPointGroups(
  stamp: SignatureStamp,
  width: number,
  height: number,
): StampPointGroup[] {
  return stamp.strokes.map((stroke) => ({
    penColor: "#e11d8f",
    dotSize: 0,
    minWidth: 1.5,
    maxWidth: 3.5,
    velocityFilterWeight: 0.7,
    compositeOperation: "source-over",
    points: stroke.map(([x, y]) => ({
      x: x * width,
      y: y * height,
      time: 0,
      pressure: 0,
    })),
  }));
}
