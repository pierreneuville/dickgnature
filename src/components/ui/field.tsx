import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

type FieldCopy = {
  label: string;
  hint?: string;
  error?: string;
};

function FieldMessages({ id, hint, error }: FieldCopy & { id: string }) {
  return (
    <>
      {hint ? (
        <span className="ui-field__hint" id={`${id}-hint`}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className="ui-field__error" id={`${id}-error`} role="alert">
          {error}
        </span>
      ) : null}
    </>
  );
}

function describedBy(id: string, hint?: string, error?: string) {
  return [hint && `${id}-hint`, error && `${id}-error`]
    .filter(Boolean)
    .join(" ") || undefined;
}

type InputFieldProps = FieldCopy &
  Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & { id: string };

export function InputField({ label, hint, error, id, ...props }: InputFieldProps) {
  return (
    <div className="ui-field">
      <label className="ui-field__label" htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, hint, error)}
        {...props}
      />
      <FieldMessages id={id} label={label} hint={hint} error={error} />
    </div>
  );
}

type TextareaFieldProps = FieldCopy &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & { id: string };

export function TextareaField({
  label,
  hint,
  error,
  id,
  ...props
}: TextareaFieldProps) {
  return (
    <div className="ui-field">
      <label className="ui-field__label" htmlFor={id}>{label}</label>
      <textarea
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, hint, error)}
        {...props}
      />
      <FieldMessages id={id} label={label} hint={hint} error={error} />
    </div>
  );
}

type SelectFieldProps = FieldCopy &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> & { id: string };

export function SelectField({
  label,
  hint,
  error,
  id,
  children,
  ...props
}: SelectFieldProps) {
  return (
    <div className="ui-field">
      <label className="ui-field__label" htmlFor={id}>{label}</label>
      <select
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, hint, error)}
        {...props}
      >
        {children}
      </select>
      <FieldMessages id={id} label={label} hint={hint} error={error} />
    </div>
  );
}
