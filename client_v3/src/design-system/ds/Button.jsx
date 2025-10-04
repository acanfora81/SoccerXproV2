import { cn } from "../../lib/utils/cn";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}) {
  // Usa le classi CSS personalizzate invece di Tailwind per evitare conflitti
  const base = "btn";

  const variants = {
    primary: "btn-primary",
    secondary: "btn-outline", 
    ghost: "btn-ghost",
    destructive: "btn-danger",
  };

  const sizes = {
    sm: "btn-sm",
    md: "", // default size
    lg: "btn-lg",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
