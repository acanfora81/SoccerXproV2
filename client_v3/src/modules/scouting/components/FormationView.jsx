// client_v3/src/modules/scouting/components/FormationView.jsx
import React, { useState, useEffect } from 'react';
import SoccerField from './SoccerField';
import { apiFetch } from '@/utils/apiClient';

const FormationView = ({ sessionId, prospectTeamSide = 'HOME' }) => {
  const [homeFormation, setHomeFormation] = useState('4-3-3');
  const [awayFormation, setAwayFormation] = useState('4-3-3');
  const [homeTokens, setHomeTokens] = useState([]);
  const [awayTokens, setAwayTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasFormations, setHasFormations] = useState(false);

  // Carica le formazioni esistenti
  useEffect(() => {
    if (sessionId) {
      loadExistingFormations();
    }
  }, [sessionId]);

  const loadExistingFormations = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    try {
      const response = await apiFetch(`/scouting/sessions/${sessionId}/formations`);
      const formations = response.data || [];
      
      if (formations.length === 0) {
        setHasFormations(false);
        return;
      }
      
      setHasFormations(true);
      
      // Trova le formazioni per PROSPECT e OPPONENT
      const prospectFormation = formations.find(f => f.teamSide === 'PROSPECT');
      const opponentFormation = formations.find(f => f.teamSide === 'OPPONENT');
      
      // Determina quale formazione è HOME e quale è AWAY
      const isProspectHome = prospectTeamSide === 'HOME';
      
      if (isProspectHome) {
        // PROSPECT è HOME, OPPONENT è AWAY
        if (prospectFormation) {
          setHomeFormation(prospectFormation.formation);
          setHomeTokens((prospectFormation.positions || []).map(token => ({ ...token, teamSide: 'HOME' })));
        }
        if (opponentFormation) {
          setAwayFormation(opponentFormation.formation);
          setAwayTokens((opponentFormation.positions || []).map(token => ({ ...token, teamSide: 'AWAY' })));
        }
      } else {
        // PROSPECT è AWAY, OPPONENT è HOME
        if (prospectFormation) {
          setAwayFormation(prospectFormation.formation);
          setAwayTokens((prospectFormation.positions || []).map(token => ({ ...token, teamSide: 'AWAY' })));
        }
        if (opponentFormation) {
          setHomeFormation(opponentFormation.formation);
          setHomeTokens((opponentFormation.positions || []).map(token => ({ ...token, teamSide: 'HOME' })));
        }
      }
    } catch (e) {
      console.error('Error loading existing formations:', e);
      setHasFormations(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-gray-500 dark:text-gray-400">Caricamento formazioni...</div>
        </div>
      </div>
    );
  }

  if (!hasFormations) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-gray-500 dark:text-gray-400">Nessuna formazione salvata per questa sessione</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Formazioni */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Squadra HOME */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 rounded-full"></div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {prospectTeamSide === 'HOME' ? 'Squadra del Prospect' : 'Squadra Casa'} - {homeFormation}
            </h4>
          </div>
        </div>

        {/* Squadra AWAY */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {prospectTeamSide === 'AWAY' ? 'Squadra del Prospect' : 'Squadra Trasferta'} - {awayFormation}
            </h4>
          </div>
        </div>
      </div>

      {/* Campo di calcio */}
      <div className="bg-green-100 dark:bg-green-900 rounded-lg p-4">
        <SoccerField 
          tokens={[...homeTokens, ...awayTokens]} 
          prospectTeamSide={prospectTeamSide}
          prospectRole={null}
          onClickToken={() => {}} // Disabilitato in modalità view
          readOnly={true}
        />
      </div>
    </div>
  );
};

export default FormationView;
