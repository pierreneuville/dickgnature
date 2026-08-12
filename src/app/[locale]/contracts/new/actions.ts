"use server";

import { redirect } from "next/navigation";
import { createContract } from "@/lib/contracts";
import type { ErrorMessageKey } from "@/lib/error-codes";
import { DEFAULT_TONE, isTone } from "@/lib/tone";

export type CreateContractState = { error?: ErrorMessageKey };

export async function createContractAction(
  _prevState: CreateContractState,
  formData: FormData,
): Promise<CreateContractState> {
  const rawTone = formData.get("tone");
  const parsed = {
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    tone: isTone(rawTone) ? rawTone : DEFAULT_TONE,
  };

  let id: string;
  try {
    const contract = await createContract(parsed);
    id = contract.id;
  } catch {
    return { error: "createContractFailed" };
  }

  redirect(`/contracts/${id}`);
}
