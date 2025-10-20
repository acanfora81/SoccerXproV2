// client_v3/src/modules/scouting/components/FormationSection.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import SoccerField from './SoccerField';
import Button from '@/design-system/ds/Button';
import ConfirmDialog from '@/design-system/ds/ConfirmDialog';
import { apiFetch } from '@/utils/apiClient';

const FORMATIONS = {
  '4-3-3': [
    { role: 'GK', x: 8, y: 50 },
    { role: 'RB', x: 22, y: 82 },
    { role: 'RCB', x: 22, y: 62 },
    { role: 'LCB', x: 22, y: 38 },
    { role: 'LB', x: 22, y: 18 },
    { role: 'RCM', x: 42, y: 62 },
    { role: 'CM', x: 42, y: 50 },
    { role: 'LCM', x: 42, y: 38 },
    { role: 'RW', x: 64, y: 82 },
    { role: 'ST', x: 70, y: 50 },
    { role: 'LW', x: 64, y: 18 },
  ],
  '4-4-2': [
    { role: 'GK', x: 8, y: 50 },
    { role: 'RB', x: 22, y: 82 },
    { role: 'RCB', x: 22, y: 62 },
    { role: 'LCB', x: 22, y: 38 },
    { role: 'LB', x: 22, y: 18 },
    { role: 'RM', x: 42, y: 82 },
    { role: 'RCM', x: 42, y: 62 },
    { role: 'LCM', x: 42, y: 38 },
    { role: 'LM', x: 42, y: 18 },
    { role: 'RS', x: 58, y: 58 },
    { role: 'LS', x: 58, y: 42 },
  ],
  '3-5-2': [
    { role: 'GK', x: 8, y: 50 },
    { role: 'RCB', x: 22, y: 65 },
    { role: 'CB', x: 22, y: 50 },
    { role: 'LCB', x: 22, y: 35 },
    { role: 'RWB', x: 42, y: 80 },
    { role: 'RCM', x: 42, y: 60 },
    { role: 'CM', x: 50, y: 50 },
    { role: 'LCM', x: 42, y: 40 },
    { role: 'LWB', x: 42, y: 20 },
    { role: 'RS', x: 66, y: 56 },
    { role: 'LS', x: 66, y: 44 },
  ],
  '3-4-3': [
    { role: 'GK', x: 8, y: 50 },
    { role: 'RCB', x: 22, y: 65 },
    { role: 'CB', x: 22, y: 50 },
    { role: 'LCB', x: 22, y: 35 },
    { role: 'RWB', x: 42, y: 75 },
    { role: 'CM', x: 42, y: 55 },
    { role: 'CM', x: 42, y: 45 },
    { role: 'LWB', x: 42, y: 25 },
    { role: 'RW', x: 70, y: 70 },
    { role: 'ST', x: 70, y: 50 },
    { role: 'LW', x: 70, y: 30 },
  ],
  '3-4-2-1': [
    { role: 'GK', x: 8, y: 50 },
    { role: 'RCB', x: 22, y: 65 },
    { role: 'CB', x: 22, y: 50 },
    { role: 'LCB', x: 22, y: 35 },
    { role: 'RWB', x: 42, y: 75 },
    { role: 'CM', x: 42, y: 55 },
    { role: 'CM', x: 42, y: 45 },
    { role: 'LWB', x: 42, y: 25 },
    { role: 'RAM', x: 58, y: 58 },
    { role: 'LAM', x: 58, y: 42 },
    { role: 'ST', x: 70, y: 50 },
  ],
  '4-2-3-1': [
    { role: 'GK', x: 8, y: 50 },
    { role: 'RB', x: 22, y: 82 },
    { role: 'RCB', x: 22, y: 62 },
    { role: 'LCB', x: 22, y: 38 },
    { role: 'LB', x: 22, y: 18 },
    { role: 'RDM', x: 36, y: 58 },
    { role: 'LDM', x: 36, y: 42 },
    { role: 'RAM', x: 52, y: 62 },
    { role: 'CAM', x: 52, y: 50 },
    { role: 'LAM', x: 52, y: 38 },
    { role: 'ST', x: 70, y: 50 },
  ],
  '4-3-2-1': [
    { role: 'GK', x: 8, y: 50 },
    { role: 'RB', x: 22, y: 82 },
    { role: 'RCB', x: 22, y: 62 },
    { role: 'LCB', x: 22, y: 38 },
    { role: 'LB', x: 22, y: 18 },
    { role: 'RCM', x: 42, y: 62 },
    { role: 'CM', x: 42, y: 50 },
    { role: 'LCM', x: 42, y: 38 },
    { role: 'RAM', x: 56, y: 56 },
    { role: 'LAM', x: 56, y: 44 },
    { role: 'ST', x: 70, y: 50 },
  ],
  '5-3-2': [
    { role: 'GK', x: 8, y: 50 },
    { role: 'RWB', x: 22, y: 82 },
    { role: 'RCB', x: 22, y: 66 },
    { role: 'CB', x: 22, y: 50 },
    { role: 'LCB', x: 22, y: 34 },
    { role: 'LWB', x: 22, y: 18 },
    { role: 'RCM', x: 42, y: 62 },
    { role: 'CM', x: 42, y: 50 },
    { role: 'LCM', x: 42, y: 38 },
    { role: 'RS', x: 66, y: 56 },
    { role: 'LS', x: 66, y: 44 },
  ],
};

// 🟥 Squadra CASA (a sinistra)
const getHomeFormation = (formationKey) => {
  const base = FORMATIONS[formationKey] || FORMATIONS['4-3-3'];
  return base.map(pos => {
    // Scala la formazione nella metà sinistra (0–50)
    let scaledX = (pos.x / 100) * 50;
    
    // Aggiungi offset orizzontale per avanzare le linee
    let offset = 0;
    if (pos.role.includes('GK')) {
      offset = 0; // GK invariato
    } else if (pos.role.includes('B') || pos.role.includes('CB')) {
      offset = 5; // Difensori: +5%
    } else if (pos.role.includes('M') || pos.role.includes('CM') || pos.role.includes('DM')) {
      offset = 10; // Centrocampisti: +10%
    } else if (pos.role.includes('AM') || pos.role.includes('W')) {
      // Per il 3-4-3, posiziona le ali più indietro per evitare sovrapposizioni
      if (formationKey === '3-4-3' && (pos.role.includes('LW') || pos.role.includes('RW'))) {
        offset = 10; // Ali nel 3-4-3: +10% (più indietro)
      } else {
        offset = 15; // Altri trequartisti e ali: +15%
      }
    } else if (pos.role.includes('S') || pos.role.includes('T')) {
      // Per il 3-4-3, posiziona gli attaccanti più indietro per evitare sovrapposizioni
      if (formationKey === '3-4-3') {
        offset = 8; // Attaccanti nel 3-4-3: +8% (molto più indietro)
      } else {
        offset = 12; // Altri moduli: +12%
      }
    }
    
    scaledX = Math.min(scaledX + offset, 50); // Limita a X ≤ 50
    
    // Fattore di stretch verticale (1.25) per distribuire i giocatori in altezza
    let stretchedY = 50 + (pos.y - 50) * 1.25;
    
    // Rendi gli attaccanti più stretti, specialmente per moduli con 3 attaccanti
    if (pos.role.includes('S') || pos.role.includes('T')) {
      const isThreeAttackers = formationKey.includes('3') && (formationKey.includes('3-4-3') || formationKey.includes('4-3-3'));
      if (isThreeAttackers) {
        // Per moduli con 3 attaccanti, riduci la distanza verticale
        stretchedY = 50 + (pos.y - 50) * 0.8;
      } else {
        // Per altri moduli, riduci leggermente
        stretchedY = 50 + (pos.y - 50) * 1.0;
      }
    }
    
    return { ...pos, x: scaledX, y: stretchedY };
  });
};

// 🟦 Squadra TRASFERTA (a destra)
const getAwayFormation = (formationKey) => {
  const base = FORMATIONS[formationKey] || FORMATIONS['4-3-3'];
  return base.map(pos => {
    // Riflette la formazione e la sposta nella metà destra (50–100)
    const mirroredX = 100 - pos.x;
    let scaledX = 50 + (mirroredX / 100) * 50;
    
    // Aggiungi offset orizzontale per avanzare le linee (negativo per AWAY)
    let offset = 0;
    if (pos.role.includes('GK')) {
      offset = 0; // GK invariato
    } else if (pos.role.includes('B') || pos.role.includes('CB')) {
      offset = -5; // Difensori: -5%
    } else if (pos.role.includes('M') || pos.role.includes('CM') || pos.role.includes('DM')) {
      offset = -10; // Centrocampisti: -10%
    } else if (pos.role.includes('AM') || pos.role.includes('W')) {
      // Per il 3-4-3, posiziona le ali più indietro per evitare sovrapposizioni
      if (formationKey === '3-4-3' && (pos.role.includes('LW') || pos.role.includes('RW'))) {
        offset = -10; // Ali nel 3-4-3: -10% (più indietro)
      } else {
        offset = -15; // Altri trequartisti e ali: -15%
      }
    } else if (pos.role.includes('S') || pos.role.includes('T')) {
      // Per il 3-4-3, posiziona gli attaccanti più indietro per evitare sovrapposizioni
      if (formationKey === '3-4-3') {
        offset = -8; // Attaccanti nel 3-4-3: -8% (molto più indietro)
      } else {
        offset = -12; // Altri moduli: -12%
      }
    }
    
    scaledX = Math.max(scaledX + offset, 50); // Limita a X ≥ 50
    
    // Fattore di stretch verticale (1.25) per distribuire i giocatori in altezza
    let stretchedY = 50 + (pos.y - 50) * 1.25;
    
    // Rendi gli attaccanti più stretti, specialmente per moduli con 3 attaccanti
    if (pos.role.includes('S') || pos.role.includes('T')) {
      const isThreeAttackers = formationKey.includes('3') && (formationKey.includes('3-4-3') || formationKey.includes('4-3-3'));
      if (isThreeAttackers) {
        // Per moduli con 3 attaccanti, riduci la distanza verticale
        stretchedY = 50 + (pos.y - 50) * 0.8;
      } else {
        // Per altri moduli, riduci leggermente
        stretchedY = 50 + (pos.y - 50) * 1.0;
      }
    }
    
    return { ...pos, x: scaledX, y: stretchedY };
  });
};

const defaultTokens = (formationKey, teamSide = 'HOME') => {
  const formation = teamSide === 'HOME' 
    ? getHomeFormation(formationKey)
    : getAwayFormation(formationKey);
  
  return formation.map(pos => ({ ...pos, number: '', name: '', teamSide }));
};

const FormationSection = ({ sessionId, initialFormation = '4-3-3', isCreating = false, onSessionCreated, prospectTeamSide = 'HOME', prospectRole = null }) => {
  const [homeFormation, setHomeFormation] = useState(initialFormation);
  const [awayFormation, setAwayFormation] = useState(initialFormation);
  const [homeTokens, setHomeTokens] = useState(() => defaultTokens(initialFormation, 'HOME'));
  const [awayTokens, setAwayTokens] = useState(() => defaultTokens(initialFormation, 'AWAY'));
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);
  const [temp, setTemp] = useState({ number: '', name: '', observed: false });
  const [saving, setSaving] = useState(false);
  const [tempError, setTempError] = useState('');
  const numberInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [feedbackDialog, setFeedbackDialog] = useState({ isOpen: false, message: '', type: 'success' });

  useEffect(() => {
    setHomeTokens(defaultTokens(homeFormation, 'HOME'));
  }, [homeFormation]);

  useEffect(() => {
    setAwayTokens(defaultTokens(awayFormation, 'AWAY'));
  }, [awayFormation]);

  // Carica le formazioni esistenti quando si modifica una sessione
  useEffect(() => {
    if (sessionId && !isCreating) {
      loadExistingFormations();
    }
  }, [sessionId, isCreating]);

  const loadExistingFormations = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    try {
      const response = await apiFetch(`/scouting/sessions/${sessionId}/formations`);
      const formations = response.data || [];
      
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
    } finally {
      setLoading(false);
    }
  };

  const onClickToken = (index, token, team) => {
    setEditingIndex(index);
    setEditingTeam(team);
    setTemp({ number: token.number || '', name: token.name || '', observed: !!token.observed });
    setTempError('');
  };

  useEffect(() => {
    // Quando apro la modale, metto il focus sul campo Numero
    if (editingIndex != null && numberInputRef.current) {
      // timeout breve per garantire che l'input sia nel DOM
      setTimeout(() => {
        try {
          numberInputRef.current.focus();
          numberInputRef.current.select();
        } catch (_) {}
      }, 0);
    }
  }, [editingIndex]);

  const saveToken = () => {
    if (editingIndex == null || !editingTeam) return;
    // Validazione: numero univoco all'interno della stessa squadra
    const targetList = editingTeam === 'HOME' ? homeTokens : awayTokens;
    const normalizedNew = String(temp.number || '').trim();
    if (normalizedNew) {
      const hasDuplicate = targetList.some((t, i) => i !== editingIndex && String(t.number || '').trim() === normalizedNew);
      if (hasDuplicate) {
        setTempError('Numero già presente nella stessa squadra');
        return;
      }
    }
    
    if (editingTeam === 'HOME') {
      setHomeTokens(prev => prev.map((t, i) => (i === editingIndex ? { ...t, ...temp, number: String(temp.number || '').trim() } : t)));
    } else {
      setAwayTokens(prev => prev.map((t, i) => (i === editingIndex ? { ...t, ...temp, number: String(temp.number || '').trim() } : t)));
    }
    
    setEditingIndex(null);
    setEditingTeam(null);
  };

  const handleSaveFormation = async () => {
    if (isCreating) {
      // In fase di creazione, salviamo entrambe le formazioni in localStorage
      // La logica: se prospectTeamSide === 'HOME', allora HOME è la squadra del prospect
      // Se prospectTeamSide === 'AWAY', allora AWAY è la squadra del prospect
      const formationsData = {
        home: {
          teamSide: prospectTeamSide === 'HOME' ? 'PROSPECT' : 'OPPONENT',
          formation: homeFormation,
          positions: homeTokens.map(t => ({ role: t.role, number: t.number ? Number(t.number) : null, name: t.name || null, x: t.x, y: t.y, observed: !!t.observed })),
        },
        away: {
          teamSide: prospectTeamSide === 'AWAY' ? 'PROSPECT' : 'OPPONENT',
          formation: awayFormation,
          positions: awayTokens.map(t => ({ role: t.role, number: t.number ? Number(t.number) : null, name: t.name || null, x: t.x, y: t.y, observed: !!t.observed })),
        }
      };
      localStorage.setItem('pendingFormations', JSON.stringify(formationsData));
      setFeedbackDialog({ isOpen: true, message: 'Formazioni salvate temporaneamente. Verranno applicate dopo la creazione della sessione.', type: 'success' });
      return;
    }

    if (!sessionId) return;
    setSaving(true);
    try {
      // Salva formazione HOME
      const homePayload = {
        teamSide: prospectTeamSide === 'HOME' ? 'PROSPECT' : 'OPPONENT',
        formation: homeFormation,
        positions: homeTokens.map(t => ({ role: t.role, number: t.number ? Number(t.number) : null, name: t.name || null, x: t.x, y: t.y })),
      };
      await apiFetch(`/scouting/sessions/${sessionId}/formation`, {
        method: 'POST',
        body: JSON.stringify(homePayload),
      });

      // Salva formazione AWAY
      const awayPayload = {
        teamSide: prospectTeamSide === 'AWAY' ? 'PROSPECT' : 'OPPONENT',
        formation: awayFormation,
        positions: awayTokens.map(t => ({ role: t.role, number: t.number ? Number(t.number) : null, name: t.name || null, x: t.x, y: t.y })),
      };
      await apiFetch(`/scouting/sessions/${sessionId}/formation`, {
        method: 'POST',
        body: JSON.stringify(awayPayload),
      });

      setFeedbackDialog({ isOpen: true, message: 'Formazioni salvate con successo!', type: 'success' });
      // Pulisci il localStorage per evitare conflitti futuri
      localStorage.removeItem('pendingFormations');
      localStorage.removeItem('newSessionId');
    } catch (e) {
      console.error('Error saving formations', e);
      setFeedbackDialog({ isOpen: true, message: 'Errore nel salvare le formazioni', type: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  // Effetto per applicare le formazioni salvate quando la sessione viene creata
  useEffect(() => {
    const newSessionId = localStorage.getItem('newSessionId');
    const pendingFormations = localStorage.getItem('pendingFormations');
    
    if (newSessionId && pendingFormations) {
      try {
        const formationsData = JSON.parse(pendingFormations);
        
        // Applica entrambe le formazioni alla sessione appena creata
        Promise.all([
          apiFetch(`/scouting/sessions/${newSessionId}/formation`, {
            method: 'POST',
            body: JSON.stringify(formationsData.home),
          }),
          apiFetch(`/scouting/sessions/${newSessionId}/formation`, {
            method: 'POST',
            body: JSON.stringify(formationsData.away),
          })
        ]).then(() => {
          localStorage.removeItem('pendingFormations');
          localStorage.removeItem('newSessionId');
          console.log('Formazioni applicate alla sessione creata');
          // Notifica che la sessione è stata completata
          onSessionCreated?.();
        }).catch(e => {
          console.error('Errore nell\'applicare le formazioni:', e);
        });
      } catch (e) {
        console.error('Errore nel parsing delle formazioni salvate:', e);
      }
    }
  }, [onSessionCreated]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-gray-500 dark:text-gray-400">Caricamento formazioni...</div>
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
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {prospectTeamSide === 'HOME' ? 'Squadra del Prospect (Casa)' : 'Squadra Casa'}
            </label>
          </div>
          <select
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={homeFormation}
            onChange={(e) => setHomeFormation(e.target.value)}
          >
            {Object.keys(FORMATIONS).map(key => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
        </div>

        {/* Squadra AWAY */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {prospectTeamSide === 'AWAY' ? 'Squadra del Prospect (Trasferta)' : 'Squadra Trasferta'}
            </label>
          </div>
          <select
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={awayFormation}
            onChange={(e) => setAwayFormation(e.target.value)}
          >
            {Object.keys(FORMATIONS).map(key => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
        </div>
      </div>

      <SoccerField 
        tokens={[...homeTokens, ...awayTokens]} 
        prospectTeamSide={prospectTeamSide}
        prospectRole={prospectRole}
        onClickToken={(index, token) => {
          // Determina se il token è HOME o AWAY
          const isHome = index < homeTokens.length;
          const team = isHome ? 'HOME' : 'AWAY';
          const tokenIndex = isHome ? index : index - homeTokens.length;
          onClickToken(tokenIndex, token, team);
        }} 
      />

      {/* Player modal */}
      {editingIndex != null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg w-full max-w-sm">
            <h4 className="text-md font-semibold mb-3">
              Imposta giocatore - {editingTeam === 'HOME' 
                ? (prospectTeamSide === 'HOME' ? 'Squadra del Prospect' : 'Squadra Casa')
                : (prospectTeamSide === 'AWAY' ? 'Squadra del Prospect' : 'Squadra Trasferta')
              }
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Numero</label>
                <input
                  type="number"
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${tempError ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  value={temp.number}
                  onChange={(e) => { setTemp(s => ({ ...s, number: e.target.value })); setTempError(''); }}
                  ref={numberInputRef}
                />
                {tempError && (
                  <p className="mt-1 text-xs text-red-600">{tempError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1">Nome (facoltativo)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={temp.name}
                  onChange={(e) => setTemp(s => ({ ...s, name: e.target.value }))}
                />
              </div>
              <div className="flex items-center justify-between gap-2 pt-2">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={!!temp.observed}
                    onChange={(e) => setTemp(s => ({ ...s, observed: e.target.checked }))}
                  />
                  Giocatore visionato
                </label>
                <Button variant="secondary" onClick={() => setEditingIndex(null)}>Annulla</Button>
                <Button variant="primary" onClick={saveToken} disabled={!!tempError}>Salva</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pt-2">
        <Button variant="primary" onClick={handleSaveFormation} disabled={saving}>
          {saving ? 'Salvataggio...' : (isCreating ? 'Salva Formazioni (Temporaneo)' : 'Salva Formazioni')}
        </Button>
        {isCreating && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Le formazioni verranno applicate automaticamente dopo la creazione della sessione
          </p>
        )}
      </div>

      {/* Dialog standardizzato esiti operazioni */}
      <ConfirmDialog
        open={feedbackDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFeedbackDialog({ isOpen: false, message: '', type: 'success' });
          }
        }}
        onConfirm={() => setFeedbackDialog({ isOpen: false, message: '', type: 'success' })}
        title={feedbackDialog.type === 'success' ? 'Operazione completata' : 'Operazione non riuscita'}
        message={feedbackDialog.message}
        type={feedbackDialog.type === 'success' ? 'success' : 'danger'}
      />
    </div>
  );
};

export default FormationSection;
