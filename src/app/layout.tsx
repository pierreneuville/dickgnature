import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "dickgnature — Two people, one agreement, zero fuss",
  description:
    "Create and sign a two-person agreement in under 60 seconds, with no signer account and a clear proof trail.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <main className="container" id="main-content">{children}</main>
      </body>
    </html>
  );
}
