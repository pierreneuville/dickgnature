import Link from "next/link";
import { notFound } from "next/navigation";
import { getContractProof } from "@/lib/signed-document";
import { ProofView } from "./proof-view";

export const dynamic = "force-dynamic";

export default async function ContractProofPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proof = await getContractProof(id);
  if (!proof) {
    notFound();
  }

  return (
    <>
      <ProofView proof={proof} />
      <p className="back-link">
        <Link href={`/contracts/${id}`}>← Revenir au contrat</Link>
      </p>
    </>
  );
}
