import { cn } from "../../lib/utils/cn";

export default function DataTable({ data, columns, className }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 dark:border-white/10">
            {columns.map((column, index) => (
              <th
                key={index}
                className="px-4 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={cn(
                    "px-4 py-3 text-sm text-gray-900 dark:text-gray-100",
                    column.align === 'left' ? 'text-left' : 'text-center'
                  )}
                >
                  {typeof column.accessor === 'function' 
                    ? column.accessor(row, rowIndex) 
                    : row[column.accessor]
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
