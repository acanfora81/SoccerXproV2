// client_v3/src/pages/market/ScoutingPage.jsx
import React, { useContext, useMemo, useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import PageHeader from '@/design-system/ds/PageHeader';
import Card, { CardContent } from '@/design-system/ds/Card';
import Button from '@/design-system/ds/Button';
import EmptyState from '@/design-system/ds/EmptyState';
import { AuthContext } from '@/contexts/AuthContext';
import ScoutingModal from '@/components/market/ScoutingModal';

export default function ScoutingPage() {
  const { user } = useContext(AuthContext);
  const canEdit = useMemo(() => ['ADMIN', 'DIRECTOR_SPORT'].includes(user?.role), [user?.role]);
  const [openModal, setOpenModal] = useState(false);

  // Nota: l'API Scouting non è ancora definita sul backend. Qui predisponiamo UI e modale.
  return (
    <div className="space-y-6">
      <PageHeader
        title="Scouting"
        subtitle="Giocatori osservati e shortlist"
        actions={
          canEdit && (
            <Button onClick={() => setOpenModal(true)} variant="primary">
              <Plus size={16} />
              Nuovo Report
            </Button>
          )
        }
      />

      <Card>
        <CardContent>
          <EmptyState
            icon={FileText}
            title="Nessun report di scouting"
            description="In attesa di endpoint backend per caricare i report di scouting"
          >
            {canEdit && (
              <Button onClick={() => setOpenModal(true)} variant="primary">
                <Plus size={16} />
                Crea Primo Report
              </Button>
            )}
          </EmptyState>
        </CardContent>
      </Card>

      <ScoutingModal open={openModal} onClose={() => setOpenModal(false)} onSubmit={() => setOpenModal(false)} />
    </div>
  );
}


