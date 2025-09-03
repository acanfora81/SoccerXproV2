import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/http';

export const useSessionTypes = () => {
  const [sessionTypes, setSessionTypes] = useState([
    { value: "all", label: "Tutte" }
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSessionTypes = async () => {
      try {
        console.log('🔵 useSessionTypes: Caricamento da API...'); 
        
        const response = await apiFetch('/api/session-types');
        
        if (!response.ok) {
          throw new Error(`Errore ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('🟢 useSessionTypes: Dati API ricevuti:', data);
        
        // Costruisci array per il filtro
        const dynamicTypes = [
          { value: "all", label: "Tutte" },
          ...data.sessionTypes.map(sessionName => ({
            value: sessionName.toLowerCase(),
            label: sessionName
          }))
        ];

        setSessionTypes(dynamicTypes);
        setError(null);
      } catch (err) {
        console.log('🔴 useSessionTypes: Errore:', err.message);
        setError(err.message);
        
        // Fallback ai valori fissi in caso di errore
        setSessionTypes([
          { value: "all", label: "Tutte" },
          { value: "allenamento", label: "Allenamento" },
          { value: "partita", label: "Partita" }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionTypes();
  }, []);

  return { sessionTypes, isLoading, error };
};