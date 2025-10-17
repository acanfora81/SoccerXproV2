// client/src/components/contracts/SalaryCalculationDisplay.jsx
// Componente per visualizzazione chiara dei calcoli stipendio

import React from 'react';
import { Euro, TrendingUp, TrendingDown, Calculator } from 'lucide-react';
import './SalaryCalculationDisplay.css';

const SalaryCalculationDisplay = ({ calculation, calculationMode, inputAmount, totalCalculation = null }) => {
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

  // Percentuale addizionali effettiva calcolata su imponibile
  const effectiveAdditionalsPct = calculation?.taxableIncome
    ? ((calculation.addizionali || 0) / calculation.taxableIncome) * 100
    : null;

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
                <span className="calculation-label">INPS Worker (9,19%):</span>
                <span className="calculation-value inps">
                  €{calculation.inpsWorker?.toLocaleString('it-IT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) || '0,00'}
                </span>
              </div>
              <div className="calculation-item">
                <span className="calculation-label">FFC Worker (1,25%):</span>
                <span className="calculation-value ffc">
                  €{calculation.ffcWorker?.toLocaleString('it-IT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) || '0,00'}
                </span>
              </div>
              <div className="calculation-item">
                <span className="calculation-label">Solidarietà Worker (0,50%):</span>
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
                <span className="calculation-label">Addizionali ({effectiveAdditionalsPct != null ? effectiveAdditionalsPct.toFixed(2).replace('.', ',') : '—'}%):</span>
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
                <span className="calculation-label">INPS Employer (29,58%):</span>
                <span className="calculation-value inps-employer">
                  €{calculation.inpsEmployer?.toLocaleString('it-IT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) || '0,00'}
                </span>
              </div>
              <div className="calculation-item">
                <span className="calculation-label">INAIL Employer (7,90%):</span>
                <span className="calculation-value inail-employer">
                  €{calculation.inailEmployer?.toLocaleString('it-IT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) || '0,00'}
                </span>
              </div>
              <div className="calculation-item">
                <span className="calculation-label">FFC Employer (6,25%):</span>
                <span className="calculation-value ffc-employer">
                  €{calculation.ffcEmployer?.toLocaleString('it-IT', {
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
                €{calculation.employerContributions?.toLocaleString('it-IT', {
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
              {calculation.grossSalary && calculation.employerContributions ? 
                `${(((calculation.totalContributionsWorker || 0) + calculation.employerContributions) / calculation.grossSalary * 100).toFixed(1)}%` : 
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
                  €{totalCalculation.total.employerContributions?.toLocaleString('it-IT', {
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
