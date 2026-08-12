// Easter egg « clin d'œil » : quand un participant ou signataire porte un nom réservé, on affiche
// un bandeau chaleureux + confettis. La liste est centralisée ici pour rester extensible sans
// toucher aux pages. Toute la détection est pure et testée ; l'effet visuel vit dans confetti.ts.

// Liste des noms déclencheurs. Ajouter une entrée ici suffit à étendre le clin d'œil.
export const EASTER_EGG_NAMES = ["SSSB", "Pierre 184", "Racoon"] as const;

// Normalise un nom pour comparaison : espaces de bord retirés, espaces internes réduits à un
// seul, casse ignorée. « pierre   184 » et «  Pierre 184 » matchent donc tous les deux.
export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

const NORMALIZED_TRIGGERS = new Set(EASTER_EGG_NAMES.map(normalizeName));

// Vrai si le nom (après normalisation) fait partie des déclencheurs.
export function matchesEasterEggName(name: string | null | undefined): boolean {
  if (!name) {
    return false;
  }
  return NORMALIZED_TRIGGERS.has(normalizeName(name));
}

// Renvoie le PREMIER nom original d'une liste qui déclenche le clin d'œil (pour personnaliser le
// message avec l'orthographe réellement saisie), ou null si aucun.
export function findEasterEggName(
  names: ReadonlyArray<string | null | undefined>,
): string | null {
  for (const name of names) {
    if (matchesEasterEggName(name)) {
      return name as string;
    }
  }
  return null;
}
