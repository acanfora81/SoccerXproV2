import React from 'react';

export function AvatarTest() {
  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2>Test Avatar - SoccerXpro V2</h2>
      
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <h3>Avatar Standard:</h3>
        <div className="player-avatar">MR</div>
        <div className="player-avatar">AB</div>
        <div className="player-avatar">CD</div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <h3>Avatar Circle:</h3>
        <div className="avatar-circle">MR</div>
        <div className="avatar-circle">AB</div>
        <div className="avatar-circle">CD</div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <h3>Avatar Placeholder:</h3>
        <div className="avatar-placeholder">MR</div>
        <div className="avatar-placeholder">AB</div>
        <div className="avatar-placeholder">CD</div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <h3>Avatar Small:</h3>
        <div className="player-avatar-small">MR</div>
        <div className="player-avatar-small">AB</div>
        <div className="player-avatar-small">CD</div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3>Istruzioni per il test:</h3>
        <ul>
          <li>Tutti gli avatar dovrebbero avere <strong>sfondo blu</strong> (tema chiaro) o <strong>viola</strong> (tema scuro)</li>
          <li>Tutti gli avatar dovrebbero avere <strong>testo bianco</strong> sempre leggibile</li>
          <li>Cambia tema (chiaro/scuro) per verificare che i colori si adattino</li>
          <li>Se vedi ancora cerchi bianchi con testo bianco, ci sono ancora conflitti CSS</li>
        </ul>
      </div>
    </div>
  );
}
