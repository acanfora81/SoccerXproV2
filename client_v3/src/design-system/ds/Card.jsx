import { cn } from "../../lib/utils/cn";

export default function Card({ children, className }) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-[#0f1424] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children }) {
  return <div className="px-6 py-4 border-b dark:border-white/10">{children}</div>;
}

export function CardContent({ children }) {
  return <div className="px-6 py-4">{children}</div>;
}

export function CardFooter({ children }) {
  return <div className="px-6 py-4 border-t dark:border-white/10">{children}</div>;
}
