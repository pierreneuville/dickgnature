import type { HTMLAttributes } from "react";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "brand" | "success" | "neutral";
};

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={["ui-badge", `ui-badge--${tone}`, className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export function SesBadge() {
  return (
    <Badge tone="success" aria-label="Signature électronique simple, niveau SES">
      <span aria-hidden="true">✓</span> Niveau SES
    </Badge>
  );
}
