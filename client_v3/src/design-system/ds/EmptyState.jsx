export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center p-10 border-2 border-dashed rounded-2xl dark:border-white/10">
      {Icon && <Icon className="mx-auto h-12 w-12 text-gray-400 mb-4" />}
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
