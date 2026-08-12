// Glue navigateur pure : déclenche l'animation de confettis via canvas-confetti, importé en
// dynamique pour rester hors du bundle serveur. Non testé en jsdom (pas de canvas 2D) — exclu de
// la couverture ; le garde-fou prefers-reduced-motion vit côté composant.
export async function burstConfetti(): Promise<void> {
  const { default: confetti } = await import("canvas-confetti");
  const shared = { particleCount: 80, spread: 70, startVelocity: 45, zIndex: 2000 };
  confetti({ ...shared, origin: { x: 0.2, y: 0.3 } });
  confetti({ ...shared, origin: { x: 0.8, y: 0.3 } });
}
