import { cn } from "../../lib/utils/cn";

export default function KPICard({ icon: Icon, value, label, className }) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-[#0f1424] rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 p-6 flex flex-col items-start",
        className
      )}
    >
      {Icon && <Icon className="w-6 h-6 text-blue-600 mb-2" />}
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}
