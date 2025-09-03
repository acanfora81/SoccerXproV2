import React from 'react';
import PerformancePlayersList from '../../components/analytics/PerformancePlayersList';

const PerformancePlayersListPage = () => {
  return (
    <div className="performance-players-list">
      <div className="page-header">
        <h1>Schede Giocatori - Performance</h1>
        <p>Visualizza e analizza le performance dei giocatori della squadra</p>
      </div>
      
      <PerformancePlayersList />
    </div>
  );
};

export default PerformancePlayersListPage;
