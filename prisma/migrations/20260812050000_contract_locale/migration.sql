-- Langue du contrat pour le rendu des emails de complétion et du PDF signé.
-- NOT NULL DEFAULT 'en' : les contrats existants basculent sur l'anglais (comportement documenté
-- jusqu'ici). Attribut de rendu uniquement — sans impact sur l'empreinte SHA-256 figée.
ALTER TABLE "Contract" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en';
