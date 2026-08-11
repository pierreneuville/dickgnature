"use client";

import { useActionState } from "react";
import { createContractAction, type CreateContractState } from "./actions";
import { DEFAULT_TONE } from "@/lib/tone";

const initialState: CreateContractState = {};

export default function NewContractPage() {
  const [state, formAction, pending] = useActionState(
    createContractAction,
    initialState,
  );

  return (
    <>
      <h1>Nouveau contrat</h1>
      <p className="tagline">Rédige ton accord, choisis le ton, et fais-le signer.</p>

      <form action={formAction}>
        <label htmlFor="title">Titre</label>
        <input id="title" name="title" type="text" required maxLength={200} />

        <label htmlFor="body">Contrat</label>
        <textarea id="body" name="body" required maxLength={20000} />

        <label htmlFor="tone">Ton</label>
        <select id="tone" name="tone" defaultValue={DEFAULT_TONE}>
          <option value="fun">Fun (parodique)</option>
          <option value="serious">Serious (neutre)</option>
        </select>

        {state.error ? <p className="error">{state.error}</p> : null}

        <button type="submit" disabled={pending}>
          {pending ? "Création…" : "Créer le contrat"}
        </button>
      </form>
    </>
  );
}
