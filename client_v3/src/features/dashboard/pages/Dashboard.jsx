import React from "react";
import PageHeader from "@/design-system/ds/PageHeader";
import KPICard from "@/design-system/ds/KPICard";
import Card, { CardContent, CardHeader } from "@/design-system/ds/Card";
import EmptyState from "@/design-system/ds/EmptyState";

import { Users, FileText, BarChart3, Stethoscope, RefreshCw } from "lucide-react";
import Button from "@/design-system/ds/Button";

export default function Dashboard() {
  const players = [
    { id: 1, name: "Mario Rossi", role: "GK" },
    { id: 2, name: "Luca Bianchi", role: "DF" },
    { id: 3, name: "Giuseppe Verdi", role: "MF" },
    { id: 4, name: "Antonio Neri", role: "FW" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Panoramica generale della società"
        actions={
          <Button variant="secondary">
            <RefreshCw className="w-4 h-4 mr-2" /> Aggiorna
          </Button>
        }
      />

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard icon={Users} value="24" label="Giocatori Attivi" />
        <KPICard icon={FileText} value="12" label="Contratti in corso" />
        <KPICard icon={BarChart3} value="87%" label="Performance media" />
        <KPICard icon={Stethoscope} value="3" label="Visite mediche prossime" />
      </div>

      {/* DUE COLONNE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ultimi giocatori */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Ultimi Giocatori Inseriti</h2>
          </CardHeader>
          <CardContent>
            {players.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Nessun giocatore"
                description="Inizia ad aggiungere giocatori alla rosa"
              />
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-white/10">
                {players.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {p.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{p.role}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Performance Trend */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Andamento Performance</h2>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-400">
              [Grafico placeholder]
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
