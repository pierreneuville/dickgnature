import { notFound } from "next/navigation";
import { getContract } from "@/lib/contracts";
import {
  getParticipantByToken,
  participantLinkState,
} from "@/lib/participants";
import { ContractView } from "@/app/contracts/[id]/contract-view";
import { SignForm } from "@/app/contracts/[id]/sign/sign-form";
import { signViaTokenAction } from "./actions";

// Page de signature PUBLIQUE, ouverte via un lien tokenisé — aucun compte requis (axe #1 : le
// contrat à deux en < 60 s). Rendu dynamique : lecture du token en base à chaque visite.
export const dynamic = "force-dynamic";

export default async function TokenSignPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const resolved = await getParticipantByToken(token);
  if (!resolved) {
    notFound();
  }

  const { participant } = resolved;
  // Contrat complet pour ContractView : rend le document DANS SON TON (jamais d'humour imposé au
  // signataire en "serious" — ModePicker n'expose alors même pas le motif parodique).
  const contract = await getContract(resolved.contract.id);
  if (!contract) {
    notFound();
  }

  const state = participantLinkState(participant);

  return (
    <>
      <ContractView contract={contract} />

      <section className="signing-panel" aria-label="Signature">
        <p className="signer-identity">
          Signataire : <strong>{participant.name}</strong>
        </p>

        {state === "signed" ? (
          <p className="signing-done" role="status">
            Merci {participant.name}, ta signature est bien enregistrée.
          </p>
        ) : state === "expired" ? (
          <p className="signing-expired" role="status">
            Ce lien de signature a expiré. Demande au créateur du contrat de
            t&apos;en renvoyer un nouveau.
          </p>
        ) : (
          <>
            <h2>Ta signature</h2>
            <SignForm
              tone={contract.tone}
              action={signViaTokenAction.bind(null, token)}
              submitLabel="Signer"
            />
          </>
        )}
      </section>
    </>
  );
}
