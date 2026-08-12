import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ContractForm } from "./contract-form";

export default function NewContractPage() {
  const t = useTranslations("contractNew");

  return (
    <div className="new-contract-page">
      <header className="new-contract-page__hero">
        <Link className="new-contract-page__back" href="/">
          {t("back")}
        </Link>
        <span className="kicker">{t("kicker")}</span>
        <h1>{t("title")}</h1>
        <p className="tagline">{t("tagline")}</p>
      </header>

      <ContractForm />
    </div>
  );
}
