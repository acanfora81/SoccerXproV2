import React from 'react';
import PageHeader from '@/design-system/ds/PageHeader';
import Card, { CardContent } from '@/design-system/ds/Card';
import { BarChart3 } from 'lucide-react';
import TeamDashboard from '../components/dashboard/TeamDashboard';

export default function PerformanceDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Performance"
        subtitle="Panoramica completa delle performance della squadra"
      />
      
      <Card>
        <CardContent className="p-0">
          <TeamDashboard />
        </CardContent>
      </Card>
    </div>
  );
}
