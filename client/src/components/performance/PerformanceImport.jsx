import React from "react";
import ImportWizard from "./ImportWizard";
import useAuthStore from "../../store/authStore";

const PerformanceImport = () => {
  const { user } = useAuthStore();
  const teamId = user?.teamId;  // 👈 letto direttamente dall’utente loggato

  if (!teamId) {
    return <p>❌ Nessun team associato all'utente corrente</p>;
  }

  return <ImportWizard teamId={teamId} />;
};

export default PerformanceImport;
