import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Wrappers de navigation conscients de la locale : Link/redirect/usePathname/useRouter gèrent le
// préfixe automatiquement. À utiliser à la place de next/link et next/navigation dans l'UI.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
