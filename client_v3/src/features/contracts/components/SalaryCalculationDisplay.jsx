// client_v3/src/features/contracts/components/SalaryCalculationDisplay.jsx
// Componente per visualizzazione chiara dei calcoli stipendio

import React from 'react';
import { Euro, TrendingUp, TrendingDown, Calculator, Loader2 } from 'lucide-react';
import Card, { CardContent, CardHeader } from "@/design-system/ds/Card";

const SalaryCalculationDisplay = ({ calculation, calculationMode, inputAmount, totalCalculation = null, calculating = false }) => {
  if (!calculation) {
    return (
      <Card>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calculator size={48} className="text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Inserisci un valore per vedere i calcoli automatici</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 mb-4">
          <Calculator size={20} className="text-blue-600 dark:text-blue-400" />
          <h4 className="text-lg font-semibold">Calcolo Completo Stipendio</h4>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {calculationMode === 'net' ? (
            <>
              <span className="text-sm text-gray-600 dark:text-gray-400">Netto inserito:</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-sm font-semibold">
                €{inputAmount}
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">→</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Lordo calcolato:</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded text-sm font-semibold">
                €{calculation.grossSalary?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </>
          ) : (
            <>
              <span className="text-sm text-gray-600 dark:text-gray-400">Lordo inserito:</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded text-sm font-semibold">
                €{inputAmount}
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">→</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Netto calcolato:</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-sm font-semibold">
                €{calculation.netSalary?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Barra di Loading */}
        {calculating && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-6">
            <Loader2 size={16} className="animate-spin text-blue-600" />
            <span className="text-sm text-blue-700 dark:text-blue-300">Calcolo in corso...</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* SEZIONE GIOCATORE */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingDown size={18} className="text-green-600 dark:text-green-400" />
                <h5 className="text-base font-semibold text-green-700 dark:text-green-300">👤 Dettaglio Lavoratore</h5>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    INPS Worker ({(calculation?._rawRates?.inpsWorker ?? 9.19).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%):
                  </span>
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                    €{calculation.inpsWorker?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    FFC Worker ({(calculation?._rawRates?.ffcWorker ?? 1.25).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%):
                  </span>
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                    €{calculation.ffcWorker?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Solidarietà Worker ({(calculation?._rawRates?.solidarityWorker ?? 0.5).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%):
                  </span>
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                    €{calculation.solidarityWorker?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-semibold">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Totale Contributi Worker:</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">
                    €{calculation.totaleContributiWorker?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Imponibile Fiscale:</span>
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                    €{calculation.taxableIncome?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                  <span className="text-sm text-gray-600 dark:text-gray-400">IRPEF:</span>
                  <span className="font-mono font-semibold text-red-600 dark:text-red-400">
                    €{calculation.irpef?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Addizionali (1,73%):</span>
                  <span className="font-mono font-semibold text-yellow-600 dark:text-yellow-400">
                    €{calculation.addizionali?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg font-bold">
                  <span className="text-sm text-green-800 dark:text-green-200">✅ Netto Giocatore:</span>
                  <span className="font-mono text-lg text-green-700 dark:text-green-300">
                    €{calculation.netSalary?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEZIONE SOCIETÀ */}
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-yellow-600 dark:text-yellow-400" />
                <h5 className="text-base font-semibold text-yellow-700 dark:text-yellow-300">🏢 Dettaglio Società</h5>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    INPS Employer ({(calculation?._rawRates?.inpsEmployer ?? 30).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%):
                  </span>
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                    €{calculation.inpsEmployer?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    INAIL Employer ({(calculation?._rawRates?.inailEmployer ?? 1.5).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%):
                  </span>
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                    €{calculation.inailEmployer?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    FFC Employer ({(calculation?._rawRates?.ffcEmployer ?? 5).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%):
                  </span>
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                    €{calculation.ffcEmployer?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Solidarietà Employer (0,50%):</span>
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                    €{calculation.solidarityEmployer?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-semibold">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Totale Contributi Datore:</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">
                    €{calculation.totaleContributiEmployer?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg font-bold">
                  <span className="text-sm text-yellow-800 dark:text-yellow-200">💸 Costo Totale Società:</span>
                  <span className="font-mono text-lg text-yellow-700 dark:text-yellow-300">
                    €{calculation.companyCost?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                  </span>
                </div>
              </div>
              
              {/* Breakdown Costo */}
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Stipendio Lordo:</span>
                    <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">
                      €{calculation.grossSalary?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">+ Contributi Datore:</span>
                    <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">
                      €{calculation.totaleContributiEmployer?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                    </span>
                  </div>
                  <div className="border-t border-gray-300 dark:border-gray-600 my-2"></div>
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-gray-800 dark:text-gray-200">= Costo Società:</span>
                    <span className="font-mono text-lg text-gray-900 dark:text-white">
                      €{calculation.companyCost?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Footer */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Rapporto Netto/Lordo</div>
              <div className="font-mono font-bold text-lg text-gray-900 dark:text-white">
                {calculation.netSalary && calculation.grossSalary ? 
                  `${((calculation.netSalary / calculation.grossSalary) * 100).toFixed(1)}%` : 
                  'N/A'
                }
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Incidenza Contributi Totali</div>
              <div className="font-mono font-bold text-lg text-gray-900 dark:text-white">
                {calculation.grossSalary && calculation.totaleContributiEmployer ? 
                  `${(((calculation.totaleContributiWorker || 0) + calculation.totaleContributiEmployer) / calculation.grossSalary * 100).toFixed(1)}%` : 
                  'N/A'
                }
              </div>
            </div>
          </div>
          
          {/* Riepilogo Totale con Bonus (se disponibile) */}
          {totalCalculation && (
            <Card className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20">
              <CardHeader>
                <h5 className="text-center text-lg font-semibold text-gray-900 dark:text-white">📊 Riepilogo Totale Contratto</h5>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-700 rounded border">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Totale Lordo:</span>
                    <span className="font-mono font-semibold text-yellow-600 dark:text-yellow-400">
                      €{totalCalculation.total.gross?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-700 rounded border">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Totale Netto:</span>
                    <span className="font-mono font-semibold text-green-600 dark:text-green-400">
                      €{totalCalculation.total.net?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-700 rounded border">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Contributi Datore:</span>
                    <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                      €{totalCalculation.total.totaleContributiEmployer?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 border-2 border-yellow-300 dark:border-yellow-700 rounded font-bold">
                    <span className="text-sm text-yellow-800 dark:text-yellow-200">💸 Costo Totale Società:</span>
                    <span className="font-mono text-lg text-yellow-700 dark:text-yellow-300">
                      €{totalCalculation.total.companyCost?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SalaryCalculationDisplay;
