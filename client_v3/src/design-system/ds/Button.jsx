// client/src/design-system/ds/Button.jsx
import React from "react";
import clsx from "clsx";

/**
 * Button component - integrato con le classi Tailwind + varianti definite in tailwind.css
 *
 * Varianti disponibili:
 * - primary     → blu
 * - secondary   → grigio neutro
 * - success     → verde
 * - warning     → giallo
 * - info        → azzurro
 * - destructive → rosso
 * - outline     → solo bordo
 *
 * Size disponibili:
 * - sm, md, lg
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}) {
  const base = "btn"; // definito in tailwind.css

  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    success: "btn-success",
    warning: "btn-warning",
    info: "btn-info",
    destructive: "btn-danger",
    outline: "btn-outline",
  };

  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-5 py-3 text-lg",
  };

  return (
    <button
      {...props}
      className={clsx(base, variants[variant], sizes[size], className)}
    >
      {children}
    </button>
  );
}
