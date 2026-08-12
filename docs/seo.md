# SEO — configuration et vérifications

Le SEO public couvre les pages d’accueil et de création d’accord dans les quatre locales : anglais
sans préfixe, puis `/fr`, `/pt` et `/es`. Les URL d’accord, de preuve et de signature contiennent des
données privées ou des jetons : elles sont volontairement absentes du sitemap, bloquées dans
`robots.txt` et marquées `noindex, nofollow` dans leurs métadonnées.

## Configuration

- `NEXT_PUBLIC_SITE_URL` définit l’origine absolue des canonical, hreflang, Open Graph, sitemap et
  données structurées. Le fallback de production est `https://dickgnature.vercel.app`.
- `src/lib/seo.ts` centralise la construction des URL localisées et `x-default` (anglais).
- `src/app/sitemap.ts`, `src/app/robots.ts` et `src/app/manifest.ts` produisent les routes standard.
- `public/og-dickgnature.png` est l’image sociale 1200 × 630 ; les icônes et le favicon vivent dans
  `public/`.

## Contrôles après déploiement

1. Ouvrir `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` et `/favicon.ico` sur la production.
2. Inspecter une page par locale et vérifier `lang`, canonical et les cinq valeurs hreflang
   (`en`, `fr`, `pt`, `es`, `x-default`).
3. Tester l’aperçu Open Graph/Twitter avec un validateur social, puis le JSON-LD avec le test des
   résultats enrichis Google ou Schema.org.
4. Ajouter la propriété de domaine dans Google Search Console et Bing Webmaster Tools, valider le
   domaine par DNS, puis soumettre `https://dickgnature.vercel.app/sitemap.xml`.
5. Si un domaine personnalisé remplace l’URL Vercel, mettre à jour `NEXT_PUBLIC_SITE_URL`, poser la
   redirection permanente de l’ancien domaine vers le nouveau et soumettre à nouveau le sitemap.

Search Console, Bing Webmaster Tools, la validation DNS et les caches des plateformes sociales
restent des opérations humaines : aucune clé ni aucun compte externe n’est requis au build.
