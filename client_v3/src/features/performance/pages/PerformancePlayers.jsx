import React from 'react';
import PageHeader from '@/design-system/ds/PageHeader';
import Card, { CardContent } from '@/design-system/ds/Card';
import { Users } from 'lucide-react';
import PerformancePlayersList from '../components/PerformancePlayersList';

export default function PerformancePlayers() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Lista Giocatori Performance"
        subtitle="Gestione e analisi delle performance dei giocatori"
      />
      
      <Card>
        <CardContent className="p-0">
          <PerformancePlayersList />
        </CardContent>
      </Card>
    </div>
  );
}
