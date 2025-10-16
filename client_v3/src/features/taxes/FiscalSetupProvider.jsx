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
  const [year, setYear] = useState(new Date().getFullYear());
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

  // Fetch status quando cambiano i parametri
  useEffect(() => {
    if (teamId && year && contractType) {
      fetchStatus();
    }
  }, [teamId, year, contractType, region, municipality]);

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
    setActiveTab
  };


  return (
    <FiscalSetupContext.Provider value={contextValue}>
      {children}
    </FiscalSetupContext.Provider>
  );
};
