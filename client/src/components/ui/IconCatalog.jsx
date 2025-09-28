import React from 'react';
import { ICONS, ICON_SIZES } from '../../config/icons-map';

export function IconCatalog() {
  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <h2>Catalogo Icone SoccerXpro V2</h2>
      
      {/* Azioni Generiche */}
      <div>
        <h3>Azioni Generiche</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ICONS.add size={ICON_SIZES.md} />
            <span>Dossier</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ICONS.compare size={ICON_SIZES.md} />
            <span>Confronta</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ICONS.export size={ICON_SIZES.md} />
            <span>Esporta</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ICONS.import size={ICON_SIZES.md} />
            <span>Importa</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ICONS.selectAll size={ICON_SIZES.md} />
            <span>Seleziona Tutti</span>
          </div>
        </div>
      </div>

      {/* KPI Performance */}
      <div>
        <h3>KPI Performance</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ICONS.sessions size={ICON_SIZES.lg} />
            <span>Sessioni</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ICONS.training size={ICON_SIZES.lg} />
            <span>Allenamenti</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ICONS.matches size={ICON_SIZES.lg} />
            <span>Partite</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ICONS.speed size={ICON_SIZES.lg} />
            <span>Velocità</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ICONS.load size={ICON_SIZES.lg} />
            <span>Player Load</span>
          </div>
        </div>
      </div>

      {/* Analytics Avanzate */}
      <div>
        <h3>Analytics Avanzate</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ICONS.volumes size={ICON_SIZES.lg} />
            <span>Carico & Volumi</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ICONS.intensity size={ICON_SIZES.lg} />
            <span>Intensità</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ICONS.sprints size={ICON_SIZES.lg} />
            <span>Sprint</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ICONS.accelDecel size={ICON_SIZES.lg} />
            <span>Accel/Decel</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ICONS.cardio size={ICON_SIZES.lg} />
            <span>Cardio</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ICONS.readiness size={ICON_SIZES.lg} />
            <span>Readiness</span>
          </div>
        </div>
      </div>

      {/* Dimensioni Standard */}
      <div>
        <h3>Dimensioni Standard</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ICONS.add size={ICON_SIZES.xs} />
            <span>XS (12px)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ICONS.add size={ICON_SIZES.sm} />
            <span>SM (14px)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ICONS.add size={ICON_SIZES.md} />
            <span>MD (16px)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ICONS.add size={ICON_SIZES.lg} />
            <span>LG (18px)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ICONS.add size={ICON_SIZES.xl} />
            <span>XL (20px)</span>
          </div>
        </div>
      </div>

      {/* Esempi di Utilizzo */}
      <div>
        <h3>Esempi di Utilizzo</h3>
        <div style={{ backgroundColor: 'var(--color-surface)', padding: '1rem', borderRadius: '8px' }}>
          <h4>Pulsanti Card Giocatori:</h4>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <button className="btn btn-primary btn-sm">
              <ICONS.add size={ICON_SIZES.sm} />
              Dossier
            </button>
            <button className="btn btn-secondary btn-sm">
              <ICONS.compare size={ICON_SIZES.sm} />
              Confronta
            </button>
          </div>
          
          <h4>KPI Cards:</h4>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--color-bg)', borderRadius: '4px' }}>
              <ICONS.matches size={ICON_SIZES.lg} />
              <span>Partite Giocate</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--color-bg)', borderRadius: '4px' }}>
              <ICONS.speed size={ICON_SIZES.lg} />
              <span>Velocità Max</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
