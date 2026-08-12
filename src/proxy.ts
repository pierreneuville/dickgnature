import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Négociation de locale sur les routes présentielles. On exclut les routes API/binaires (dont le
// PDF signé `/contracts/[id]/pdf`), les assets Next et les fichiers statiques du matcher.
export default createMiddleware(routing);

export const config = {
  matcher: [
    // Toutes les routes sauf /api, /_next, /_vercel et les fichiers avec extension (favicon…).
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
