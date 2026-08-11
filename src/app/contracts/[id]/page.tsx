import { notFound } from "next/navigation";
import { getContract } from "@/lib/contracts";
import { ContractView } from "./contract-view";

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

  return <ContractView contract={contract} />;
}
