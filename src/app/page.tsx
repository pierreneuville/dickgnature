import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <h1>dickgnature</h1>
      <p className="tagline">
        Un contrat sérieux entre deux amis, signé en moins de 60 secondes.
      </p>
      <Link className="button" href="/contracts/new">
        Créer un contrat
      </Link>
    </>
  );
}
