import React from 'react';
import { ICONS, ICON_SIZES } from '../../config/icons-map';

export function ButtonTest() {
  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2>Test Pulsanti - SoccerXpro V2</h2>
      
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <h3>Pulsanti Base:</h3>
        <button className="btn">Pulsante Base</button>
        <button className="btn btn-primary">Pulsante Primario</button>
        <button className="btn btn-secondary">Pulsante Secondario</button>
        <button className="btn btn-success">Pulsante Successo</button>
        <button className="btn btn-warning">Pulsante Warning</button>
        <button className="btn btn-danger">Pulsante Pericolo</button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <h3>Pulsanti Small (Compatti):</h3>
        <button className="btn btn-sm">Base Small</button>
        <button className="btn btn-primary btn-sm">Primario Small</button>
        <button className="btn btn-secondary btn-sm">Secondario Small</button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <h3>Pulsanti Card Giocatori (Larghezza Uniforme):</h3>
        <button className="btn btn-primary btn-sm">
          <ICONS.add size={ICON_SIZES.sm} /> Dossier
        </button>
        <button className="btn btn-secondary btn-sm">
          <ICONS.compare size={ICON_SIZES.sm} /> Confronta
        </button>
      </div>

      <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--color-surface)', borderRadius: '8px' }}>
        <h4>Test in Card (con larghezza uniforme):</h4>
        <div className="card" style={{ padding: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="btn btn-primary btn-sm">
            <ICONS.add size={ICON_SIZES.sm} /> Dossier
          </button>
          <button className="btn btn-secondary btn-sm">
            <ICONS.compare size={ICON_SIZES.sm} /> Confronta
          </button>
        </div>
        <p><small>Entrambi i pulsanti dovrebbero avere dimensioni identiche: 110px × 34px</small></p>
      </div>

      <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--color-surface)', borderRadius: '8px' }}>
        <h4>Test Dimensioni Fisse (Performance Players List):</h4>
        <div className="card" style={{ padding: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div className="card-footer" style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary btn-sm">
              <ICONS.add size={ICON_SIZES.sm} /> Dossier
            </button>
            <button className="btn btn-secondary btn-sm">
              <ICONS.compare size={ICON_SIZES.sm} /> Confronta
            </button>
          </div>
        </div>
        <p><small>Questi pulsanti usano le regole specifiche di performance-players-list.css con !important</small></p>
        <p><small>Entrambi dovrebbero essere esattamente 110px × 34px con hover effects</small></p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <h3>Pulsanti con Stati:</h3>
        <button className="btn btn-secondary">Normale</button>
        <button className="btn btn-secondary selected">Selezionato</button>
        <button className="btn btn-secondary" disabled>Disabilitato</button>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3>Istruzioni per il test:</h3>
        <ul>
          <li><strong>Pulsante Base</strong> → Bordo blu/viola, testo blu/viola, sfondo bianco/nero</li>
          <li><strong>Pulsante Primario</strong> → Sfondo blu/viola, testo bianco (FORZATO con !important)</li>
          <li><strong>Pulsante Secondario</strong> → Sfondo arancione, testo bianco (sempre visibile!)</li>
          <li><strong>Hover</strong> → Tutti i pulsanti dovrebbero avere stati hover chiari (FORZATI)</li>
          <li><strong>Selezionato</strong> → Pulsante secondario selezionato dovrebbe essere arancione più scuro</li>
          <li><strong>⚠️ IMPORTANTE</strong> → I pulsanti NON dovrebbero "sparire" quando ci clicchi sopra!</li>
        </ul>
      </div>

      <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--color-surface)', borderRadius: '8px' }}>
        <h4>Test Datepicker Actions:</h4>
        <div className="datepicker-actions">
          <button className="btn btn-secondary">Annulla</button>
          <button className="btn btn-primary">Conferma</button>
        </div>
        <p><small>Questi pulsanti dovrebbero usare lo stesso stile arancione/blu</small></p>
      </div>
    </div>
  );
}
