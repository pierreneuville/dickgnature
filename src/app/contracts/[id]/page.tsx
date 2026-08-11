import Link from "next/link";
import { notFound } from "next/navigation";
import { getContract } from "@/lib/contracts";
import { listSignatures } from "@/lib/signatures";
import { ContractView } from "./contract-view";
import { SignaturesList } from "./signatures-list";

// Lecture en base : rendu dynamique, jamais pré-généré au build.
export const dynamic = "force-dynamic";

export default async function ContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contract = await getContract(id);

  if (!contract) {
    notFound();
  }

  const signatures = await listSignatures(contract.id);

  return (
    <>
      <ContractView contract={contract} />

      <section className="signatures" aria-label="Signatures">
        <h2>Signatures</h2>
        <SignaturesList signatures={signatures} />
        <Link className="button" href={`/contracts/${contract.id}/sign`}>
          Signer le contrat
        </Link>
      </section>
    </>
  );
}
