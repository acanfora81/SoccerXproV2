import React from 'react';
import { ICONS, ICON_SIZES } from '../../config/icons-map';

export function IconTest() {
  return (
    <div style={{ padding: '2rem' }}>
      <h2>Test Icone - Verifica Import</h2>
      
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ICONS.add size={ICON_SIZES.md} />
          <span>Dossier (add)</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ICONS.compare size={ICON_SIZES.md} />
          <span>Confronta (compare)</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ICONS.training size={ICON_SIZES.md} />
          <span>Allenamenti (training)</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ICONS.matches size={ICON_SIZES.md} />
          <span>Partite (matches)</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ICONS.speed size={ICON_SIZES.md} />
          <span>Velocità (speed)</span>
        </div>
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--color-surface)', borderRadius: '8px' }}>
        <h3>Test Pulsanti con Icone</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary btn-sm">
            <ICONS.add size={ICON_SIZES.sm} />
            Dossier
          </button>
          <button className="btn btn-secondary btn-sm">
            <ICONS.compare size={ICON_SIZES.sm} />
            Confronta
          </button>
        </div>
      </div>
    </div>
  );
}
