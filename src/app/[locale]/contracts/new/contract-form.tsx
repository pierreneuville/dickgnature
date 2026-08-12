"use client";

import { type ChangeEvent, useActionState, useState } from "react";
import { useMessages, useTranslations } from "next-intl";
import { Badge, Button, Card, InputField, SelectField, TextareaField } from "@/components/ui";
import {
  buildContractTemplate,
  CONTRACT_TEMPLATE_SHAPES,
  renderContractTemplate,
  type ContractTemplate,
  type ContractTemplateMessages,
} from "@/lib/contract-templates";
import { DEFAULT_TONE, type Tone } from "@/lib/tone";
import { createContractAction, type CreateContractState } from "./actions";

const initialState: CreateContractState = {};

function emptyValues(template: ContractTemplate) {
  return Object.fromEntries(template.variables.map(({ key }) => [key, ""]));
}

export function ContractForm() {
  const t = useTranslations("contractForm");
  const messages = useMessages();
  const [state, formAction, pending] = useActionState(
    createContractAction,
    initialState,
  );
  const [templateId, setTemplateId] = useState("");
  const [tone, setTone] = useState<Tone>(DEFAULT_TONE);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  // Templates localisés dans la langue active : les chaînes viennent du catalogue i18n, la
  // structure (ordre, ton suggéré) reste indépendante de la langue.
  const templates = CONTRACT_TEMPLATE_SHAPES.map((shape) =>
    buildContractTemplate(shape, messages.templates[shape.id] as ContractTemplateMessages),
  );
  const template = templates.find((item) => item.id === templateId);

  function applyTemplate(
    nextTemplate: ContractTemplate,
    nextTone: Tone,
    nextVariables: Record<string, string>,
  ) {
    const rendered = renderContractTemplate(nextTemplate, nextTone, nextVariables);
    setTitle(rendered.title);
    setBody(rendered.body);
  }

  function handleTemplateChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextId = event.target.value;
    setTemplateId(nextId);

    const nextTemplate = templates.find((item) => item.id === nextId);
    if (!nextTemplate) return;

    const nextVariables = emptyValues(nextTemplate);
    setVariables(nextVariables);
    setTone(nextTemplate.suggestedTone);
    applyTemplate(nextTemplate, nextTemplate.suggestedTone, nextVariables);
  }

  function handleToneChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextTone = event.target.value as Tone;
    setTone(nextTone);
    if (template) applyTemplate(template, nextTone, variables);
  }

  function handleVariableChange(key: string, value: string) {
    if (!template) return;

    const nextVariables = { ...variables, [key]: value };
    setVariables(nextVariables);
    applyTemplate(template, tone, nextVariables);
  }

  return (
    <form action={formAction} className="contract-editor">
      <Card as="section" className="template-picker" aria-labelledby="template-title">
        <div className="template-picker__heading">
          <div>
            <Badge tone="brand">{t("easyMode")}</Badge>
            <h2 id="template-title">{t("pickStart")}</h2>
          </div>
          <p>{t("templatesBlurb")}</p>
        </div>

        <SelectField
          id="template"
          label={t("typeLabel")}
          hint={t("typeHint")}
          value={templateId}
          onChange={handleTemplateChange}
        >
          <option value="">{t("customOption")}</option>
          {templates.map((item) => (
            <option key={item.id} value={item.id}>{item.title}</option>
          ))}
        </SelectField>

        {template ? (
          <div className="template-picker__details" aria-live="polite">
            <div className="template-picker__summary">
              <p>{template.description}</p>
              <Badge>
                {t("suggestedVibe", {
                  vibe:
                    template.suggestedTone === "fun"
                      ? t("vibeFun")
                      : t("vibeSerious"),
                })}
              </Badge>
            </div>
            <fieldset className="template-variables">
              <legend>{t("fillBlanks")}</legend>
              <p>{t("fillBlanksBlurb")}</p>
              <div className="template-variables__grid">
                {template.variables.map((variable) => (
                  <InputField
                    key={variable.key}
                    id={`template-${variable.key}`}
                    label={variable.label}
                    type="text"
                    placeholder={variable.placeholder}
                    value={variables[variable.key] ?? ""}
                    onChange={(event) => handleVariableChange(variable.key, event.target.value)}
                  />
                ))}
              </div>
            </fieldset>
          </div>
        ) : null}
      </Card>

      <Card as="section" className="contract-fields" aria-labelledby="contract-fields-title">
        <div className="contract-fields__heading">
          <div>
            <Badge>{t("fullyEditable")}</Badge>
            <h2 id="contract-fields-title">{t("makeItYours")}</h2>
          </div>
          <span className="template-picker__counter">
            {t("counter", { count: body.length })}
          </span>
        </div>

        <InputField
          id="title"
          name="title"
          label={t("titleLabel")}
          type="text"
          required
          maxLength={200}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <TextareaField
          id="body"
          name="body"
          label={t("agreementLabel")}
          hint={t("agreementHint")}
          required
          maxLength={20000}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />

        <SelectField
          id="tone"
          name="tone"
          label={t("toneLabel")}
          hint={t("toneHint")}
          value={tone}
          onChange={handleToneChange}
        >
          <option value="fun">{t("toneFun")}</option>
          <option value="serious">{t("toneSerious")}</option>
        </SelectField>

        {state.error ? <p className="ui-field__error" role="alert">{state.error}</p> : null}

        <div className="contract-editor__submit">
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? t("submitPending") : t("submit")}
          </Button>
          <p>{t("submitNote")}</p>
        </div>
      </Card>
    </form>
  );
}
