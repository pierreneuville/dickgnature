"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import {
  addParticipantsAction,
  type ParticipantsState,
} from "./participants-actions";

const initialState: ParticipantsState = {};

type Row = { key: number; name: string; email: string };

let nextKey = 0;
function emptyRow(): Row {
  nextKey += 1;
  return { key: nextKey, name: "", email: "" };
}

// Glue navigateur : gestion des lignes name/email dynamiques + soumission de l'action serveur déjà
// liée au contractId. La validation (email, non-vide) et la génération de tokens vivent côté serveur
// (participants-actions → src/lib/participants). Exclue du coverage comme les autres formulaires.
export function ParticipantsForm({ contractId }: { contractId: string }) {
  const t = useTranslations("participants");
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const action = addParticipantsAction.bind(null, contractId);
  const [state, formAction, pending] = useActionState(action, initialState);

  const update = (key: number, field: "name" | "email", value: string) => {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    );
  };

  const removeRow = (key: number) => {
    setRows((current) =>
      current.length > 1 ? current.filter((row) => row.key !== key) : current,
    );
  };

  return (
    <form action={formAction} className="participants-form">
      {rows.map((row) => (
        <div key={row.key} className="participant-row">
          <input
            type="text"
            name="name"
            placeholder={t("namePlaceholder")}
            aria-label={t("nameAria")}
            value={row.name}
            onChange={(event) => update(row.key, "name", event.target.value)}
          />
          <input
            type="email"
            name="email"
            placeholder={t("emailPlaceholder")}
            aria-label={t("emailAria")}
            value={row.email}
            onChange={(event) => update(row.key, "email", event.target.value)}
          />
          {rows.length > 1 ? (
            <button
              type="button"
              className="ghost"
              onClick={() => removeRow(row.key)}
              aria-label={t("removeAria")}
            >
              ✕
            </button>
          ) : null}
        </div>
      ))}

      <div className="participants-form-actions">
        <button
          type="button"
          className="ghost"
          onClick={() => setRows((current) => [...current, emptyRow()])}
        >
          {t("addAnother")}
        </button>
        <button type="submit" disabled={pending}>
          {pending ? t("invitePending") : t("invite")}
        </button>
      </div>

      {state.error ? <p className="error">{state.error}</p> : null}
    </form>
  );
}
