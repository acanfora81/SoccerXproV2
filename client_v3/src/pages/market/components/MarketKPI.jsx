// client_v3/src/pages/market/components/MarketKPI.jsx
import React from 'react';
import Card, { CardContent } from '@/design-system/ds/Card';
import { Handshake, UserSearch, Send, Wallet } from 'lucide-react';
import { formatItalianNumber } from '@/lib/utils/italianNumbers';

export default function MarketKPI({ data, loading, error }) {
  if (loading) {
    return <div className="py-6 text-sm text-gray-500">Caricamento KPI…</div>;
  }
  if (error) {
    return <div className="py-6 text-sm text-red-500">{error}</div>;
  }
  if (!data) {
    return <div className="py-6 text-sm text-gray-500">Nessun dato disponibile</div>;
  }

  const kpiItems = [
    {
      label: 'Trattative Aperte',
      value: data.openNegotiations ?? 0,
      icon: <Handshake className="h-5 w-5 text-primary" />,
    },
    {
      label: 'Target Osservati',
      value: data.totalTargets ?? 0,
      icon: <UserSearch className="h-5 w-5 text-primary" />,
    },
    {
      label: 'Offerte Inviate',
      value: data.offers?.sent ?? 0,
      icon: <Send className="h-5 w-5 text-primary" />,
    },
    {
      label: 'Budget Residuo (€)',
      value: data.budget ? (Number(data.budget.transferBudgetLeft) ?? 0) : 0,
      icon: <Wallet className="h-5 w-5 text-primary" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiItems.map((k, idx) => (
        <Card key={idx}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{k.label}</div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatItalianNumber(k.value)}
              </div>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">{k.icon}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


