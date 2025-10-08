// client_v3/src/pages/market/components/NegotiationsTable.jsx
import React from 'react';
import Card from '@/design-system/ds/Card';

export default function NegotiationsTable({ data, loading, error }) {
  if (loading) return <div className="p-6 text-sm text-gray-500">Caricamento…</div>;
  if (error) return <div className="p-6 text-sm text-red-500">{error}</div>;
  if (!data?.length) return <div className="p-6 text-sm text-gray-500">Nessuna trattativa trovata</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Controparte</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ultimo aggiornamento</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {row.target?.external_name || `Target #${row.targetId}`}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">{row.stage}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">{row.status}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">{row.counterpart || '-'}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                {row.updatedAt ? new Date(row.updatedAt).toLocaleString('it-IT') : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


