import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "dickgnature — Le contrat à deux, sans le cirque",
  description:
    "Créez et signez un contrat à deux en moins de 60 secondes, sans compte et avec un dossier de preuve lisible.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <a className="skip-link" href="#main-content">Aller au contenu</a>
        <main className="container" id="main-content">{children}</main>
      </body>
    </html>
  );
}
