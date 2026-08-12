"use client";

import { type ChangeEvent, useActionState, useState } from "react";
import { Badge, Button, Card, InputField, SelectField, TextareaField } from "@/components/ui";
import {
  CONTRACT_TEMPLATES,
  getContractTemplate,
  renderContractTemplate,
  type ContractTemplate,
} from "@/lib/contract-templates";
import { DEFAULT_TONE, type Tone } from "@/lib/tone";
import { createContractAction, type CreateContractState } from "./actions";

const initialState: CreateContractState = {};

function emptyValues(template: ContractTemplate) {
  return Object.fromEntries(template.variables.map(({ key }) => [key, ""]));
}

export function ContractForm() {
  const [state, formAction, pending] = useActionState(
    createContractAction,
    initialState,
  );
  const [templateId, setTemplateId] = useState("");
  const [tone, setTone] = useState<Tone>(DEFAULT_TONE);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const template = getContractTemplate(templateId);

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

    const nextTemplate = getContractTemplate(nextId);
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
            <Badge tone="brand">Easy mode</Badge>
            <h2 id="template-title">Pick your starting point</h2>
          </div>
          <p>Seven plain-English templates. Nothing is set in stone yet.</p>
        </div>

        <SelectField
          id="template"
          label="Agreement type"
          hint="Or go gloriously off-script with a blank page."
          value={templateId}
          onChange={handleTemplateChange}
        >
          <option value="">Custom agreement</option>
          {CONTRACT_TEMPLATES.map((item) => (
            <option key={item.id} value={item.id}>{item.title}</option>
          ))}
        </SelectField>

        {template ? (
          <div className="template-picker__details" aria-live="polite">
            <div className="template-picker__summary">
              <p>{template.description}</p>
              <Badge>Suggested vibe: {template.suggestedTone === "fun" ? "Fun" : "Serious"}</Badge>
            </div>
            <fieldset className="template-variables">
              <legend>Fill in the blanks</legend>
              <p>Your answers jump straight into the agreement below.</p>
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
            <Badge>Fully editable</Badge>
            <h2 id="contract-fields-title">Make it sound like you</h2>
          </div>
          <span className="template-picker__counter">{body.length.toLocaleString("en-US")} / 20,000</span>
        </div>

        <InputField
          id="title"
          name="title"
          label="Title"
          type="text"
          required
          maxLength={200}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <TextareaField
          id="body"
          name="body"
          label="Agreement"
          hint="This template is just a launchpad. Rewrite anything you like."
          required
          maxLength={20000}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />

        <SelectField
          id="tone"
          name="tone"
          label="Tone"
          hint="Serious stays neutral. Fun gets to loosen its tie."
          value={tone}
          onChange={handleToneChange}
        >
          <option value="fun">Fun (playful)</option>
          <option value="serious">Serious (neutral)</option>
        </SelectField>

        {state.error ? <p className="ui-field__error" role="alert">{state.error}</p> : null}

        <div className="contract-editor__submit">
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Making it official-ish…" : "Create the agreement"}
          </Button>
          <p>You&apos;ll get one more look before you share it. No trapdoors.</p>
        </div>
      </Card>
    </form>
  );
}
