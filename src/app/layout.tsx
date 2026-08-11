import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "dickgnature",
  description: "Signer des contrats sérieux entre amis, en moins de 60 secondes.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
