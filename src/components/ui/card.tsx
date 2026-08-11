import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "section" | "div";
  elevated?: boolean;
};

export function Card({
  as: Element = "div",
  elevated = false,
  className,
  ...props
}: CardProps) {
  return (
    <Element
      className={["ui-card", elevated && "ui-card--elevated", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
