// client_v3/src/pages/market/components/OffersTable.jsx
import React from 'react';
import { formatItalianNumber } from '@/lib/utils/italianNumbers';

export default function OffersTable({ data, loading, error, negotiationId }) {
  if (loading) return <div className="p-6 text-sm text-gray-500">Caricamento…</div>;
  if (error) return <div className="p-6 text-sm text-red-500">{error}</div>;
  if (!data?.length) return <div className="p-6 text-sm text-gray-500">Nessuna offerta trovata</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trattativa ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee (€)</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stipendio offerto (€)</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data invio</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-4 py-3 whitespace-nowrap text-sm">{row.negotiationId}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">{row.type}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                {row.fee != null ? formatItalianNumber(Number(row.fee)) : '-'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                {row.salary_offer != null ? formatItalianNumber(Number(row.salary_offer)) : '-'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">{row.status}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                {row.sent_date ? new Date(row.sent_date).toLocaleString('it-IT') : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


