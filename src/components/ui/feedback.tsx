import type { ReactNode } from "react";
import { ButtonLink } from "./button";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: { href: string; label: string };
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section className="ui-empty" aria-labelledby="empty-state-title">
      <span className="ui-empty__mark" aria-hidden="true">✦</span>
      <h2 id="empty-state-title">{title}</h2>
      <p>{description}</p>
      {action ? <ButtonLink href={action.href}>{action.label}</ButtonLink> : null}
    </section>
  );
}

type ToastProps = {
  children: ReactNode;
  kind?: "success" | "error" | "info";
};

export function Toast({ children, kind = "info" }: ToastProps) {
  return (
    <div
      className={`ui-toast ui-toast--${kind}`}
      role={kind === "error" ? "alert" : "status"}
      aria-live={kind === "error" ? "assertive" : "polite"}
    >
      {children}
    </div>
  );
}
