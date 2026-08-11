import Link from "next/link";
import { notFound } from "next/navigation";
import { getContractProof } from "@/lib/signed-document";
import { SiteHeader, ToneSurface } from "@/components/ui";
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

  // La page « probant » (SES) reste neutre par principe, quel que soit le ton du contrat.
  return (
    <ToneSurface tone="serious">
      <SiteHeader />

      <ProofView proof={proof} />
      <p className="back-link">
        <Link href={`/contracts/${id}`}>← Revenir au contrat</Link>
      </p>
    </ToneSurface>
  );
}
