import Link from "next/link";
import { notFound } from "next/navigation";
import { getContract } from "@/lib/contracts";
import { themeFor } from "@/lib/tone";
import { SignForm } from "./sign-form";

export const dynamic = "force-dynamic";

export default async function SignContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contract = await getContract(id);

  if (!contract) {
    notFound();
  }

  const theme = themeFor(contract.tone);

  return (
    <>
      <p>
        <span className="brand-badge" style={{ background: theme.accent }}>
          {theme.brand}
        </span>
      </p>
      <h1>Signer : {contract.title}</h1>
      <p className="tagline">{theme.tagline}</p>

      <SignForm contractId={contract.id} tone={contract.tone} />

      <p className="back-link">
        <Link href={`/contracts/${contract.id}`}>← Revenir au contrat</Link>
      </p>
    </>
  );
}
