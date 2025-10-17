import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '@/store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Context per condividere stato tra step
const FiscalSetupContext = createContext();

export const useFiscalSetup = () => {
  const context = useContext(FiscalSetupContext);
  if (!context) {
    throw new Error('useFiscalSetup must be used within FiscalSetupProvider');
  }
  return context;
};

export const FiscalSetupProvider = ({ children }) => {
  const { user } = useAuthStore();
  const [teamId, setTeamId] = useState(null);
  const [year, setYear] = useState(null);
  const [contractType, setContractType] = useState('PROFESSIONAL');
  const [region, setRegion] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [activeTab, setActiveTab] = useState('rates');
  const [status, setStatus] = useState({
    rates: false,
    contributions: false,
    irpef: false,
    detractions: false,
    regional: null,
    municipal: null,
    l207: false
  });
  const [loading, setLoading] = useState(false);
  
  // Gestione scenari multipli
  const [availableScenarios, setAvailableScenarios] = useState([]);
  const [currentScenarioId, setCurrentScenarioId] = useState(null);
  const [isNewScenario, setIsNewScenario] = useState(false);

  // Load teamId from user context
  useEffect(() => {
    if (user?.teamId) {
      setTeamId(user.teamId);
    } else {
      // Fallback temporaneo per testing
      if (!user && !teamId) {
        setTeamId('test-team-id');
      }
    }
  }, [user, teamId]);

  // Carica scenari quando cambia teamId o year (se year è null, carica comunque per popolare la lista anni)
  useEffect(() => {
    if (teamId) {
      fetchAvailableScenarios();
    }
  }, [teamId, year]);

  // Fetch status quando cambiano i parametri
  useEffect(() => {
    const hasActiveScenario = Boolean(currentScenarioId) || Boolean(isNewScenario);
    if (!hasActiveScenario) {
      // Nessuno scenario selezionato: azzera lo stato visivo
      setStatus({
        rates: false,
        contributions: false,
        irpef: false,
        detractions: false,
        regional: null,
        municipal: null,
        l207: false
      });
      return;
    }
    if (teamId && year && contractType) {
      fetchStatus();
    }
  }, [teamId, year, contractType, region, municipality, currentScenarioId, isNewScenario]);

  // Carica scenari disponibili
  const fetchAvailableScenarios = async () => {
    if (!teamId) return;
    
    try {
      const params = { teamId };
      if (year) params.year = year;
      const response = await axios.get(`${API_BASE_URL}/api/fiscal-setup/scenarios`, { params, withCredentials: true });
      setAvailableScenarios(response.data || []);
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      setAvailableScenarios([]);
    }
  };

  // Carica scenario specifico
  const loadScenario = (scenario) => {
    setContractType(scenario.contractType);
    setRegion(scenario.region || '');
    setMunicipality(scenario.municipality || '');
    if (scenario.year) setYear(scenario.year);
    setCurrentScenarioId(scenario.id);
    setIsNewScenario(false);
  };

  // Crea nuovo scenario
  const createNewScenario = () => {
    setContractType('PROFESSIONAL');
    setRegion('');
    setMunicipality('');
    setCurrentScenarioId(null);
    setIsNewScenario(true);
    setStatus({
      rates: false,
      contributions: false,
      irpef: false,
      detractions: false,
      regional: null,
      municipal: null,
      l207: false
    });
  };

  // Persisti nuovo scenario con nome
  const persistNewScenario = async (name, overrides = {}) => {
    if (!teamId || !year || !name) return null;
    try {
      const payload = {
        teamId,
        year: overrides.year ?? year,
        contractType: overrides.contractType ?? contractType,
        region: (overrides.region ?? region) || null,
        municipality: (overrides.municipality ?? municipality) || null,
        name,
        isDefault: false
      };
      const res = await axios.post(`${API_BASE_URL}/api/fiscal-setup/scenarios`, payload, { withCredentials: true });
      await fetchAvailableScenarios();
      setCurrentScenarioId(res.data?.data?.id || null);
      setIsNewScenario(false);
      return res.data?.data || null;
    } catch (e) {
      console.error('Error creating scenario:', e);
      return null;
    }
  };

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        teamId,
        year: year.toString(),
        contractType
      });
      if (region) params.append('region', region);
      if (municipality) params.append('municipality', municipality);

      const response = await axios.get(
        `${API_BASE_URL}/api/fiscal-setup/status?${params}`,
        { withCredentials: true }
      );

      setStatus(response.data);
    } catch (error) {
      console.error('Error fetching status:', error);
      // Non bloccare l'UI se c'è un errore di status
    } finally {
      setLoading(false);
    }
  };

  const contextValue = {
    teamId: teamId || null,
    year,
    contractType,
    region,
    municipality,
    setYear,
    setContractType,
    setRegion,
    setMunicipality,
    status,
    fetchStatus,
    activeTab,
    setActiveTab,
    // Gestione scenari multipli
    availableScenarios,
    currentScenarioId,
    isNewScenario,
    loadScenario,
    createNewScenario,
    fetchAvailableScenarios,
    persistNewScenario
  };


  return (
    <FiscalSetupContext.Provider value={contextValue}>
      {children}
    </FiscalSetupContext.Provider>
  );
};
