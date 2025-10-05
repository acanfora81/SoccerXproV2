import React from 'react';
import useAuthStore from '@/store/authStore';
import ImportWizard from '../components/ImportWizard';

export default function ImportPage() {
  const { user } = useAuthStore();
  const teamId = user?.teamId;

  if (!teamId) {
    return (
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            ❌ Nessun team associato all'utente corrente
          </div>
        </div>
      </div>
    );
  }

  return <ImportWizard teamId={teamId} />;
}


