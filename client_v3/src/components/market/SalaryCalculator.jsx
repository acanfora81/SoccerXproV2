// client_v3/src/components/market/SalaryCalculator.jsx
// Componente calcolatore stipendi per il modulo Market

import React, { useState, useEffect, useCallback } from 'react';
import { Calculator, Euro, TrendingUp, TrendingDown, Building2, Loader2 } from 'lucide-react';
import { apiFetch } from '@/utils/apiClient';
import Card, { CardContent, CardHeader } from '@/design-system/ds/Card';

const SalaryCalculator = ({ 
  netSalary, 
  grossSalary, 
  companyCost, 
  onNetChange, 
  onGrossChange, 
  onCompanyChange,
  disabled = false,
  playerData = {}
}) => {
  const [calculating, setCalculating] = useState(false);
  const [calculation, setCalculation] = useState(null);
  const [error, setError] = useState(null);

  // Funzione per tradurre i codici posizione in enum del database
  const translatePosition = (positionCode) => {
    const positionMapping = {
      'GK': 'GOALKEEPER',
      'CB': 'DEFENDER',
      'LB': 'DEFENDER',
      'RB': 'DEFENDER',
      'CDM': 'MIDFIELDER',
      'CM': 'MIDFIELDER',
      'CAM': 'MIDFIELDER',
      'LW': 'FORWARD',
      'RW': 'FORWARD',
      'ST': 'FORWARD'
    };
    return positionMapping[positionCode] || positionCode;
  };

  // Funzione per tradurre gli enum del database in codici frontend
  const translatePositionFromEnum = (positionEnum) => {
    const enumToCodeMapping = {
      'GOALKEEPER': 'GK',
      'DEFENDER': 'CB', // Default per DEFENDER
      'MIDFIELDER': 'CM', // Default per MIDFIELDER
      'FORWARD': 'ST' // Default per FORWARD
    };
    return enumToCodeMapping[positionEnum] || positionEnum;
  };

  // Calcola dal netto al lordo e aziendale
  const calculateFromNet = useCallback(async (netValue) => {
    if (!netValue || netValue <= 0) {
      setCalculation(null);
      return;
    }

    try {
      setCalculating(true);
      setError(null);

      const response = await apiFetch('/api/taxes/v2/gross-from-net', {
        method: 'POST',
        body: JSON.stringify({
          netSalary: parseFloat(netValue),
          year: 2025, // Anno fisso per ora
          region: null,
          municipality: null,
          contractType: 'STANDARD',
          teamId: null, // Simulazione - sarà gestito dal backend
          isSimulation: true, // Flag per indicare che è una simulazione
          playerData: {
            position: translatePosition(playerData.position),
            age: playerData.age ? parseInt(playerData.age) : null,
            dateOfBirth: playerData.dateOfBirth,
            nationality: playerData.nationality
          }
        })
      });

      if (response.success) {
        const calc = response.data;
        setCalculation(calc);
        
        // Aggiorna i campi padre
        onGrossChange?.(calc.grossSalary);
        onCompanyChange?.(calc.companyCost);
      } else {
        setError('Errore nel calcolo dal netto');
      }
    } catch (err) {
      console.error('Errore calcolo dal netto:', err);
      setError('Errore nel calcolo dal netto');
    } finally {
      setCalculating(false);
    }
  }, [onGrossChange, onCompanyChange]);

  // Calcola dal lordo al netto e aziendale
  const calculateFromGross = useCallback(async (grossValue) => {
    if (!grossValue || grossValue <= 0) {
      setCalculation(null);
      return;
    }

    try {
      setCalculating(true);
      setError(null);

      const response = await apiFetch('/api/taxes/v2/complete-salary', {
        method: 'POST',
        body: JSON.stringify({
          grossSalary: parseFloat(grossValue),
          year: 2025, // Anno fisso per ora
          region: null,
          municipality: null,
          contractType: 'STANDARD',
          teamId: null, // Simulazione - sarà gestito dal backend
          isSimulation: true, // Flag per indicare che è una simulazione
          playerData: {
            position: translatePosition(playerData.position),
            age: playerData.age ? parseInt(playerData.age) : null,
            dateOfBirth: playerData.dateOfBirth,
            nationality: playerData.nationality
          }
        })
      });

      if (response.success) {
        const calc = response.data;
        setCalculation(calc);
        
        // Aggiorna i campi padre
        onNetChange?.(calc.netSalary);
        onCompanyChange?.(calc.companyCost);
      } else {
        setError('Errore nel calcolo dal lordo');
      }
    } catch (err) {
      console.error('Errore calcolo dal lordo:', err);
      setError('Errore nel calcolo dal lordo');
    } finally {
      setCalculating(false);
    }
  }, [onNetChange, onCompanyChange]);

  // Effetti per calcoli automatici
  useEffect(() => {
    if (netSalary && netSalary !== calculation?.netSalary) {
      calculateFromNet(netSalary);
    }
  }, [netSalary, calculateFromNet, calculation?.netSalary]);

  useEffect(() => {
    if (grossSalary && grossSalary !== calculation?.grossSalary) {
      calculateFromGross(grossSalary);
    }
  }, [grossSalary, calculateFromGross, calculation?.grossSalary]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          <h4 className="text-lg font-semibold">Calcolatore Stipendi</h4>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Loading State */}
        {calculating && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-700 dark:text-blue-300">Calcolo in corso...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}

        {/* Simulation Notice */}
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              🧮 Modalità Simulazione
            </span>
          </div>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
            I calcoli utilizzano aliquote fiscali standard per scopi dimostrativi
          </p>
        </div>

        {/* Player Data Info */}
        {playerData && (playerData.position || playerData.age || playerData.nationality) && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <h5 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">Dati Giocatore per Calcoli</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {playerData.position && (
                <div>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">Posizione:</span>
                  <span className="ml-1 text-blue-800 dark:text-blue-200">
                    {playerData.position.includes('_') ? 
                      `${translatePositionFromEnum(playerData.position)} (${playerData.position})` :
                      `${playerData.position} (${translatePosition(playerData.position)})`
                    }
                  </span>
                </div>
              )}
              {playerData.age && (
                <div>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">Età:</span>
                  <span className="ml-1 text-blue-800 dark:text-blue-200">{playerData.age} anni</span>
                </div>
              )}
              {playerData.nationality && (
                <div>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">Nazionalità:</span>
                  <span className="ml-1 text-blue-800 dark:text-blue-200">{playerData.nationality}</span>
                </div>
              )}
              {playerData.dateOfBirth && (
                <div>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">Data nascita:</span>
                  <span className="ml-1 text-blue-800 dark:text-blue-200">
                    {new Date(playerData.dateOfBirth).toLocaleDateString('it-IT')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Calculation Display */}
        {calculation && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">Netto</span>
                </div>
                <div className="text-lg font-bold text-green-700 dark:text-green-300">
                  €{calculation.netSalary?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                </div>
              </div>

              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Lordo</span>
                </div>
                <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  €{calculation.grossSalary?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                </div>
              </div>

              <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Aziendale</span>
                </div>
                <div className="text-lg font-bold text-orange-700 dark:text-orange-300">
                  €{calculation.companyCost?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                </div>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Worker Details */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-green-600" />
                  Dettaglio Lavoratore
                </h5>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Contributi Worker:</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      €{calculation.totaleContributiWorker?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">IRPEF:</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      €{calculation.irpef?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Addizionali:</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      €{calculation.addizionali?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Company Details */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-orange-600" />
                  Dettaglio Società
                </h5>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Contributi Datore:</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      €{calculation.totaleContributiEmployer?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Stipendio Lordo:</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      €{calculation.grossSalary?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t border-gray-300 dark:border-gray-600 pt-2">
                    <span className="text-gray-800 dark:text-gray-200">Costo Totale:</span>
                    <span className="text-orange-700 dark:text-orange-300">
                      €{calculation.companyCost?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Rapporto Netto/Lordo
                </div>
                <div className="font-bold text-lg text-gray-900 dark:text-white">
                  {calculation.netSalary && calculation.grossSalary ? 
                    `${((calculation.netSalary / calculation.grossSalary) * 100).toFixed(1)}%` : 
                    'N/A'
                  }
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Incidenza Contributi
                </div>
                <div className="font-bold text-lg text-gray-900 dark:text-white">
                  {calculation.grossSalary && calculation.totaleContributiEmployer ? 
                    `${(((calculation.totaleContributiWorker || 0) + calculation.totaleContributiEmployer) / calculation.grossSalary * 100).toFixed(1)}%` : 
                    'N/A'
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!calculation && !calculating && !error && (
          <div className="text-center py-8">
            <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Inserisci un valore netto o lordo per vedere i calcoli automatici
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalaryCalculator;
