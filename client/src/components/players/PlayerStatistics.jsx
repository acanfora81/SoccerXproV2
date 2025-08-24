// client/src/components/players/PlayerStatistics.jsx
// Componente statistiche giocatori per SoccerXpro V2 (cookie HttpOnly ready)

import { useState, useEffect, useCallback } from 'react';
import { Users, Calendar, Ruler, Target, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../../styles/statistics.css';

const PlayerStatistics = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChart, setSelectedChart] = useState('positions');

  console.log('🔵 PlayerStatistics renderizzato'); // INFO DEV

  // Carica giocatori (via cookie HttpOnly)
  const fetchPlayers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔵 Recupero dati giocatori per statistiche...');

      const response = await fetch('/api/players', {
        credentials: 'include', // 🔑 usa i cookie HttpOnly
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || data?.message || `Errore ${response.status}: ${response.statusText}`);
      }

      console.log('🟢 Dati giocatori caricati per statistiche:', data.count ?? (data.data?.length ?? 0));

      setPlayers(data.data || data.players || []);
    } catch (err) {
      console.log('🔴 Errore caricamento dati statistiche:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // Utils
  const safePct = (part, total) => (total > 0 ? ((part / total) * 100).toFixed(1) : '0.0');

  // Calcola età
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Calcola BMI
  const calculateBMI = (height, weight) => {
    if (!height || !weight) return null;
    const heightInM = height / 100;
    return (weight / (heightInM * heightInM)).toFixed(1);
  };

  // Statistiche per posizione
  const getPositionStats = () => {
    const positionCounts = {};
    const positionLabels = {
      GOALKEEPER: 'Portiere',
      DEFENDER: 'Difensore',
      MIDFIELDER: 'Centrocampista',
      FORWARD: 'Attaccante'
    };

    players.forEach((player) => {
      const pos = player.position;
      positionCounts[pos] = (positionCounts[pos] || 0) + 1;
    });

    const total = players.length;
    return Object.entries(positionCounts).map(([position, count]) => ({
      name: positionLabels[position] || position,
      value: count,
      percentage: safePct(count, total)
    }));
  };

  // Statistiche per fasce d'età
  const getAgeStats = () => {
    const ageRanges = { 'Under 21': 0, '21-25': 0, '26-30': 0, 'Over 30': 0 };

    players.forEach((player) => {
      const age = calculateAge(player.dateOfBirth);
      if (age < 21) ageRanges['Under 21']++;
      else if (age <= 25) ageRanges['21-25']++;
      else if (age <= 30) ageRanges['26-30']++;
      else ageRanges['Over 30']++;
    });

    const total = players.length;
    return Object.entries(ageRanges).map(([range, count]) => ({
      name: range,
      value: count,
      percentage: safePct(count, total)
    }));
  };

  // Statistiche nazionalità
  const getNationalityStats = () => {
    const nationalityCounts = {};
    players.forEach((player) => {
      const nat = player.nationality;
      nationalityCounts[nat] = (nationalityCounts[nat] || 0) + 1;
    });

    const total = players.length;
    return Object.entries(nationalityCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5) // Top 5
      .map(([nationality, count]) => ({
        name: nationality,
        value: count,
        percentage: safePct(count, total)
      }));
  };

  // Statistiche fisiche per posizione
  const getPhysicalStats = () => {
    const positionLabels = {
      GOALKEEPER: 'Portiere',
      DEFENDER: 'Difensore',
      MIDFIELDER: 'Centrocampista',
      FORWARD: 'Attaccante'
    };

    const physicalData = {};

    players.forEach((player) => {
      const pos = player.position;
      if (!physicalData[pos]) {
        physicalData[pos] = { heights: [], weights: [], bmis: [] };
      }
      if (player.height) physicalData[pos].heights.push(player.height);
      if (player.weight) physicalData[pos].weights.push(player.weight);
      if (player.height && player.weight) {
        physicalData[pos].bmis.push(parseFloat(calculateBMI(player.height, player.weight)));
      }
    });

    return Object.entries(physicalData).map(([position, data]) => ({
      position: positionLabels[position] || position,
      avgHeight:
        data.heights.length > 0 ? (data.heights.reduce((a, b) => a + b, 0) / data.heights.length).toFixed(1) : 0,
      avgWeight:
        data.weights.length > 0 ? (data.weights.reduce((a, b) => a + b, 0) / data.weights.length).toFixed(1) : 0,
      avgBMI: data.bmis.length > 0 ? (data.bmis.reduce((a, b) => a + b, 0) / data.bmis.length).toFixed(1) : 0
    }));
  };

  // Statistiche numeri maglia
  const getShirtNumberStats = () => {
    const usedNumbers = players
      .filter((p) => p.shirtNumber)
      .map((p) => p.shirtNumber)
      .sort((a, b) => a - b);

    const availableNumbers = [];
    for (let i = 1; i <= 99; i++) {
      if (!usedNumbers.includes(i)) availableNumbers.push(i);
    }

    return {
      used: usedNumbers.length,
      available: availableNumbers.length,
      usedNumbers: usedNumbers.slice(0, 10),
      availableNumbers: availableNumbers.slice(0, 10)
    };
  };

  // Colori per i grafici
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (loading) {
    return (
      <div className="statistics-container">
        <div className="loading-state">
          <Activity size={32} />
          <p>Caricamento statistiche...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="statistics-container">
        <div className="error-state">
          <p style={{ color: '#EF4444' }}>Errore: {error}</p>
          <button onClick={fetchPlayers} className="btn btn-secondary">
            Riprova
          </button>
        </div>
      </div>
    );
  }

  const positionStats = getPositionStats();
  const ageStats = getAgeStats();
  const nationalityStats = getNationalityStats();
  const physicalStats = getPhysicalStats();
  const shirtStats = getShirtNumberStats();

  // Statistiche generali
  const totalPlayers = players.length;
  const activePlayers = players.filter((p) => p.isActive).length;
  const avgAge =
    players.length > 0
      ? (players.reduce((sum, p) => sum + calculateAge(p.dateOfBirth), 0) / players.length).toFixed(1)
      : 0;
  const playersWithHeight = players.filter((p) => p.height).length;

  return (
    <div className="statistics-container">
      {/* Header */}
      <div className="statistics-header">
        <h2>Statistiche Giocatori</h2>
        <p>Analisi dettagliata della rosa - {totalPlayers} giocatori totali</p>
      </div>

      {/* Statistiche Generali */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>Giocatori Totali</h3>
            <p className="stat-number">{totalPlayers}</p>
            <span className="stat-detail">{activePlayers} attivi</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <h3>Età Media</h3>
            <p className="stat-number">{avgAge} anni</p>
            <span className="stat-detail">Rosa completa</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Target size={24} />
          </div>
          <div className="stat-content">
            <h3>Maglie Utilizzate</h3>
            <p className="stat-number">{shirtStats.used}/99</p>
            <span className="stat-detail">{shirtStats.available} disponibili</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Ruler size={24} />
          </div>
          <div className="stat-content">
            <h3>Dati Fisici</h3>
            <p className="stat-number">
              {playersWithHeight}/{totalPlayers}
            </p>
            <span className="stat-detail">Altezza registrata</span>
          </div>
        </div>
      </div>

      {/* Selettore grafici */}
      <div className="chart-selector">
        <button className={selectedChart === 'positions' ? 'active' : ''} onClick={() => setSelectedChart('positions')}>
          Ruoli
        </button>
        <button className={selectedChart === 'ages' ? 'active' : ''} onClick={() => setSelectedChart('ages')}>
          Età
        </button>
        <button
          className={selectedChart === 'nationalities' ? 'active' : ''}
          onClick={() => setSelectedChart('nationalities')}
        >
          Nazionalità
        </button>
        <button className={selectedChart === 'physical' ? 'active' : ''} onClick={() => setSelectedChart('physical')}>
          Fisico
        </button>
      </div>

      {/* Grafici */}
      <div className="charts-grid">
        {selectedChart === 'positions' && (
          <div className="chart-container">
            <h3>Distribuzione per Ruolo</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={positionStats}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                >
                  {positionStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {selectedChart === 'ages' && (
          <div className="chart-container">
            <h3>Distribuzione per Fasce d'Età</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [value, 'Giocatori']} />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {selectedChart === 'nationalities' && (
          <div className="chart-container">
            <h3>Top 5 Nazionalità</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={nationalityStats} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip formatter={(value) => [value, 'Giocatori']} />
                <Bar dataKey="value" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {selectedChart === 'physical' && (
          <div className="chart-container">
            <h3>Medie Fisiche per Ruolo</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={physicalStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="position" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgHeight" fill="#F59E0B" name="Altezza (cm)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tabelle dettagliate */}
      <div className="details-grid">
        <div className="detail-card">
          <h3>Dati Fisici per Ruolo</h3>
          <div className="detail-table">
            <table>
              <thead>
                <tr>
                  <th>Ruolo</th>
                  <th>Alt. Media</th>
                  <th>Peso Medio</th>
                  <th>BMI Medio</th>
                </tr>
              </thead>
              <tbody>
                {physicalStats.map((stat, index) => (
                  <tr key={index}>
                    <td>{stat.position}</td>
                    <td>{stat.avgHeight} cm</td>
                    <td>{stat.avgWeight} kg</td>
                    <td>{stat.avgBMI}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="detail-card">
          <h3>Numeri Maglia</h3>
          <div className="shirt-numbers">
            <div className="number-group">
              <h4>Utilizzati (primi 10)</h4>
              <div className="number-tags">
                {getShirtNumberStats().usedNumbers.map((num) => (
                  <span key={num} className="number-tag used">
                    {num}
                  </span>
                ))}
                {getShirtNumberStats().used > 10 && (
                  <span className="more">+{getShirtNumberStats().used - 10}</span>
                )}
              </div>
            </div>
            <div className="number-group">
              <h4>Disponibili (primi 10)</h4>
              <div className="number-tags">
                {getShirtNumberStats().availableNumbers.map((num) => (
                  <span key={num} className="number-tag available">
                    {num}
                  </span>
                ))}
                {getShirtNumberStats().available > 10 && (
                  <span className="more">+{getShirtNumberStats().available - 10}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerStatistics;
