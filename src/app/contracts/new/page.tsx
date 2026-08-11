import Link from "next/link";
import { ContractForm } from "./contract-form";

export default function NewContractPage() {
  return (
    <div className="new-contract-page">
      <header className="new-contract-page__hero">
        <Link className="new-contract-page__back" href="/">← Retour à l’accueil</Link>
        <span className="kicker">Un accord en quelques minutes</span>
        <h1>Nouveau contrat</h1>
        <p className="tagline">
          Pars d’un modèle clair, remplace les quelques variables, puis ajuste le
          texte jusqu’à ce qu’il vous ressemble.
        </p>
      </header>

      <ContractForm />
    </div>
  );
}
