// client/src/components/contracts/SalaryCalculationDisplay.jsx
// Componente per visualizzazione chiara dei calcoli stipendio

import React from 'react';
import { Euro, TrendingUp, TrendingDown, Calculator, Loader2 } from 'lucide-react';
import './SalaryCalculationDisplay.css';

const SalaryCalculationDisplay = ({ calculation, calculationMode, inputAmount, totalCalculation = null, calculating = false }) => {
  if (!calculation) {
    return (
      <div className="salary-calculation-display">
        <div className="no-calculation">
          <Calculator size={24} />
          <p>Inserisci un valore per vedere i calcoli automatici</p>
        </div>
      </div>
    );
  }

  return (
    <div className="salary-calculation-display">
      
      {/* Header Riepilogo */}
      <div className="calculation-header">
        <h4 className="calculation-title">
          <Calculator size={20} />
          Calcolo Completo Stipendio
        </h4>
        <div className="input-output-summary">
          {calculationMode === 'net' ? (
            <>
              <span className="input-label">Netto inserito:</span>
              <span className="input-value net">€{inputAmount}</span>
              <span className="arrow">→</span>
              <span className="output-label">Lordo calcolato:</span>
              <span className="output-value gross">€{calculation.grossSalary?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </>
          ) : (
            <>
              <span className="input-label">Lordo inserito:</span>
              <span className="input-value gross">€{inputAmount}</span>
              <span className="arrow">→</span>
              <span className="output-label">Netto calcolato:</span>
              <span className="output-value net">€{calculation.netSalary?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </>
          )}
        </div>
      </div>

      {/* Barra di Loading Minimal */}
      {calculating && (
        <div className="calculation-loading">
          <div className="loading-content">
            <Loader2 size={16} className="loading-spinner" />
            <span>Calcolo in corso...</span>
          </div>
        </div>
      )}

      <div className="calculation-sections">
        
        {/* 🔹 SEZIONE GIOCATORE */}
        <div className="calculation-section player-section">
          <div className="section-header player-header">
            <h5 className="section-title">
              <TrendingDown size={18} />
              👤 Dettaglio Lavoratore
            </h5>
          </div>

          {/* 📊 Dettaglio Lavoratore */}
          <div className="calculation-group">
            <h6 className="group-title">📊 Dettaglio Lavoratore</h6>
            <div className="calculation-grid">
              <div className="calculation-item">
                <span className="calculation-label">INPS Worker ({(calculation?._rawRates?.inpsWorker ?? 9.19).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%):</span>
                <span className="calculation-value inps">
                  €{calculation.inpsWorker?.toLocaleString('it-IT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) || '0,00'}
                </span>
              </div>
              <div className="calculation-item">
                <span className="calculation-label">FFC Worker ({(calculation?._rawRates?.ffcWorker ?? 1.25).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%):</span>
                <span className="calculation-value ffc">
                  €{calculation.ffcWorker?.toLocaleString('it-IT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) || '0,00'}
                </span>
              </div>
              <div className="calculation-item">
                <span className="calculation-label">Solidarietà Worker ({(calculation?._rawRates?.solidarityWorker ?? 0.5).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%):</span>
                <span className="calculation-value solidarity">
                  €{calculation.solidarityWorker?.toLocaleString('it-IT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) || '0,00'}
                </span>
              </div>
              <div className="calculation-item total">
                <span className="calculation-label">Totale Contributi Worker:</span>
                <span className="calculation-value total">
                  €{calculation.totaleContributiWorker?.toLocaleString('it-IT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) || '0,00'}
                </span>
              </div>
              <div className="calculation-item">
                <span className="calculation-label">Imponibile Fiscale:</span>
                <span className="calculation-value taxable">
                  €{calculation.taxableIncome?.toLocaleString('it-IT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) || '0,00'}
                </span>
              </div>
              <div className="calculation-item">
                <span className="calculation-label">IRPEF:</span>
                <span className="calculation-value irpef">
                  €{calculation.irpef?.toLocaleString('it-IT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) || '0,00'}
                </span>
              </div>
              <div className="calculation-item">
                <span className="calculation-label">Addizionali Reg./Com.:</span>
                <span className="calculation-value addizionali">
                  €{calculation.addizionali?.toLocaleString('it-IT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) || '0,00'}
                </span>
              </div>
              <div className="calculation-item result-highlight">
                <span className="calculation-label">✅ Netto Giocatore:</span>
                <span className="calculation-value net-result">
                  €{calculation.netSalary?.toLocaleString('it-IT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) || '0,00'}
                </span>
              </div>
            </div>
          </div>

        </div>

        <div className="section-divider"></div>

        {/* 🔹 SEZIONE SOCIETÀ */}
        <div className="calculation-section company-section">
          <div className="section-header company-header">
            <h5 className="section-title">
              <TrendingUp size={18} />
              🏢 Dettaglio Società
            </h5>
          </div>

          {/* 🏢 Dettaglio Società */}
          <div className="calculation-group">
            <h6 className="group-title">🏢 Dettaglio Società</h6>
            <div className="calculation-grid">
              <div className="calculation-item">
                <span className="calculation-label">INPS Employer ({(calculation?._rawRates?.inpsEmployer ?? 30).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%):</span>
                <span className="calculation-value inps-employer">
                  €{calculation.inpsEmployer?.toLocaleString('it-IT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) || '0,00'}
                </span>
              </div>
              <div className="calculation-item">
                <span className="calculation-label">INAIL Employer ({(calculation?._rawRates?.inailEmployer ?? 1.5).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%):</span>
                <span className="calculation-value inail-employer">
                  €{calculation.inailEmployer?.toLocaleString('it-IT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) || '0,00'}
                </span>
              </div>
              <div className="calculation-item">
                <span className="calculation-label">FFC Employer ({(calculation?._rawRates?.ffcEmployer ?? 5).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%):</span>
                <span className="calculation-value ffc-employer">
                  €{calculation.ffcEmployer?.toLocaleString('it-IT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) || '0,00'}
                </span>
              </div>
              <div className="calculation-item">
                <span className="calculation-label">Solidarietà Employer ({(calculation?._rawRates?.solidarityEmployer ?? 0).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%):</span>
                <span className="calculation-value solidarity-employer">
                  €{calculation.solidarityEmployer?.toLocaleString('it-IT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) || '0,00'}
                </span>
              </div>
              <div className="calculation-item total">
                <span className="calculation-label">Totale Contributi Datore:</span>
                <span className="calculation-value total">
                  €{calculation.totaleContributiEmployer?.toLocaleString('it-IT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) || '0,00'}
                </span>
              </div>
              <div className="calculation-item result-highlight">
                <span className="calculation-label">💸 Costo Totale Società:</span>
                <span className="calculation-value cost-result">
                  €{calculation.companyCost?.toLocaleString('it-IT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) || '0,00'}
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown Costo */}
          <div className="cost-breakdown">
            <div className="breakdown-item">
              <span className="breakdown-label">Stipendio Lordo:</span>
              <span className="breakdown-value">
                €{calculation.grossSalary?.toLocaleString('it-IT', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }) || '0,00'}
              </span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">+ Contributi Datore:</span>
              <span className="breakdown-value">
                €{calculation.totaleContributiEmployer?.toLocaleString('it-IT', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }) || '0,00'}
              </span>
            </div>
            <div className="breakdown-divider"></div>
            <div className="breakdown-item total">
              <span className="breakdown-label">= Costo Società:</span>
              <span className="breakdown-value">
                €{calculation.companyCost?.toLocaleString('it-IT', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }) || '0,00'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="calculation-footer">
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-label">Rapporto Netto/Lordo:</span>
            <span className="stat-value">
              {calculation.netSalary && calculation.grossSalary ? 
                `${((calculation.netSalary / calculation.grossSalary) * 100).toFixed(1)}%` : 
                'N/A'
              }
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Incidenza Contributi Totali:</span>
            <span className="stat-value">
              {calculation.grossSalary && calculation.totaleContributiEmployer ? 
                `${(((calculation.totaleContributiWorker || 0) + calculation.totaleContributiEmployer) / calculation.grossSalary * 100).toFixed(1)}%` : 
                'N/A'
              }
            </span>
          </div>
        </div>
        
        {/* Riepilogo Totale con Bonus (se disponibile) */}
        {totalCalculation && (
          <div className="total-summary-section">
            <h5 className="total-summary-title">Riepilogo Totale Contratto</h5>
            <div className="total-summary-grid">
              <div className="total-summary-item">
                <span className="total-label">Totale Lordo:</span>
                <span className="total-value gross">
                  €{totalCalculation.total.gross?.toLocaleString('it-IT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) || '0,00'}
                </span>
              </div>
              <div className="total-summary-item">
                <span className="total-label">Totale Netto:</span>
                <span className="total-value net">
                  €{totalCalculation.total.net?.toLocaleString('it-IT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) || '0,00'}
                </span>
              </div>
              <div className="total-summary-item">
                <span className="total-label">Contributi Datore:</span>
                <span className="total-value employer">
                  €{totalCalculation.total.totaleContributiEmployer?.toLocaleString('it-IT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) || '0,00'}
                </span>
              </div>
              <div className="total-summary-item highlight">
                <span className="total-label">💸 Costo Totale Società:</span>
                <span className="total-value cost">
                  €{totalCalculation.total.companyCost?.toLocaleString('it-IT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) || '0,00'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaryCalculationDisplay;
