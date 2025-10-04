import { cn } from "../../lib/utils/cn";

export default function Card({ children, className }) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-[#0f1424] rounded-2xl shadow-wow border border-gray-200/50 dark:border-white/10",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children }) {
  return <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10">{children}</div>;
}

export function CardContent({ children }) {
  return <div className="px-6 py-4">{children}</div>;
}

export function CardFooter({ children }) {
  return <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10">{children}</div>;
}
