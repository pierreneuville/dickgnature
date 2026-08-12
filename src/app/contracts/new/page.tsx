import Link from "next/link";
import { ContractForm } from "./contract-form";

export default function NewContractPage() {
  return (
    <div className="new-contract-page">
      <header className="new-contract-page__hero">
        <Link className="new-contract-page__back" href="/">← Back home</Link>
        <span className="kicker">Your deal, minus the ordeal</span>
        <h1>Make an agreement</h1>
        <p className="tagline">
          Pick a plain-English template, fill in the blanks, then tweak every
          word until it sounds like you.
        </p>
      </header>

      <ContractForm />
    </div>
  );
}
