// client/src/components/players/PlayersList.jsx
// Componente lista giocatori per SoccerXpro V2

import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Search, Filter } from 'lucide-react';
import PlayerFormModal from './PlayerFormModal';
import '../../styles/players.css';

const PlayersList = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosition, setFilterPosition] = useState('all');
  
  // Stati per il modale
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);

  console.log('🔵 PlayersList renderizzato'); // INFO DEV - rimuovere in produzione

  // Carica giocatori - usa useCallback per evitare ricreare la funzione ad ogni render
  const fetchPlayers = useCallback(async () => {
    

    try {
      setLoading(true);
      setError(null);

      console.log('🔵 Recupero lista giocatori...'); // INFO DEV - rimuovere in produzione

     const response = await fetch('/api/players', {
    credentials: 'include',
    headers: {
   'Content-Type': 'application/json'
      }
      });

      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('🟢 Giocatori caricati:', data.count); // INFO - rimuovere in produzione
      
      setPlayers(data.data || []);

    } catch (err) {
      console.log('🔴 Errore caricamento giocatori:', err.message); // ERROR - mantenere essenziali
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []); // Dipende solo da token

  // Carica giocatori al mount - ora fetchPlayers è stabile grazie a useCallback
  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // Handler per aprire modale nuovo giocatore
  const handleAddPlayer = () => {
    console.log('🔵 Apertura modale nuovo giocatore'); // INFO DEV - rimuovere in produzione
    setEditingPlayer(null);
    setIsModalOpen(true);
  };

  // Handler per aprire modale modifica giocatore
  const handleEditPlayer = (player) => {
    console.log('🔵 Apertura modale modifica giocatore:', player.firstName, player.lastName); // INFO DEV - rimuovere in produzione
    setEditingPlayer(player);
    setIsModalOpen(true);
  };

  // Handler per chiudere modale
  const handleCloseModal = () => {
    console.log('🔵 Chiusura modale giocatore'); // INFO DEV - rimuovere in produzione
    setIsModalOpen(false);
    setEditingPlayer(null);
  };

  // Handler per successo operazione (crea/modifica)
  const handleSuccess = (savedPlayer) => {
    console.log('🟢 Operazione giocatore completata con successo:', savedPlayer.firstName, savedPlayer.lastName); // INFO - rimuovere in produzione
    
    if (editingPlayer) {
      // Aggiorna giocatore esistente
      setPlayers(prev => prev.map(p => 
        p.id === savedPlayer.id ? savedPlayer : p
      ));
      console.log('🟢 Giocatore aggiornato nella lista'); // INFO - rimuovere in produzione
    } else {
      // Aggiungi nuovo giocatore
      setPlayers(prev => [savedPlayer, ...prev]);
      console.log('🟢 Nuovo giocatore aggiunto alla lista'); // INFO - rimuovere in produzione
    }
    
    // Ricarica lista per avere dati completi
    fetchPlayers();
  };

  // Filtra giocatori in base a ricerca e posizione
  const filteredPlayers = players.filter(player => {
    const matchesSearch = searchTerm === '' || 
      player.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.nationality.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPosition = filterPosition === 'all' || player.position === filterPosition;
    
    return matchesSearch && matchesPosition;
  });

  // Log dei risultati filtro quando cambiano
  useEffect(() => {
    console.log('🔵 Filtri applicati - Risultati:', filteredPlayers.length, 'di', players.length); // INFO DEV - rimuovere in produzione
  }, [filteredPlayers.length, players.length]);

  // Traduzione posizioni
  const getPositionLabel = (position) => {
    const positions = {
      'GOALKEEPER': 'Portiere',
      'DEFENDER': 'Difensore', 
      'MIDFIELDER': 'Centrocampista',
      'FORWARD': 'Attaccante'
    };
    return positions[position] || position;
  };

  // Calcola età
  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  // Formato data italiana
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  if (loading) {
    return (
      <div className="players-list">
        <div className="players-header">
          <h2>Gestione Giocatori</h2>
        </div>
        <div className="loading-state">
          <Users size={32} />
          <p>Caricamento giocatori...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="players-list">
        <div className="players-header">
          <h2>Gestione Giocatori</h2>
        </div>
        <div className="error-state">
          <p style={{ color: '#EF4444' }}>Errore: {error}</p>
          <button onClick={fetchPlayers} className="btn btn-secondary">
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="players-list">
      {/* Header */}
      <div className="players-header">
        <div className="header-left">
          <h2>Gestione Giocatori</h2>
          <p>{filteredPlayers.length} giocatori trovati</p>
        </div>
        <div className="header-right">
          <button 
            onClick={handleAddPlayer}
            className="btn btn-primary"
          >
            <Plus size={20} />
            Aggiungi Giocatore
          </button>
        </div>
      </div>

      {/* Filtri */}
      <div className="players-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Cerca giocatori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-box">
          <Filter size={20} />
          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tutte le posizioni</option>
            <option value="GOALKEEPER">Portiere</option>
            <option value="DEFENDER">Difensore</option>
            <option value="MIDFIELDER">Centrocampista</option>
            <option value="FORWARD">Attaccante</option>
          </select>
        </div>
      </div>

      {/* Lista giocatori */}
      {filteredPlayers.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <h3>Nessun giocatore trovato</h3>
          <p>
            {players.length === 0 
              ? 'Inizia aggiungendo il primo giocatore alla rosa'
              : 'Prova a modificare i filtri di ricerca'
            }
          </p>
          {players.length === 0 && (
            <button 
              onClick={handleAddPlayer}
              className="btn btn-primary"
            >
              <Plus size={20} />
              Aggiungi Primo Giocatore
            </button>
          )}
        </div>
      ) : (
        <div className="players-grid">
          {filteredPlayers.map(player => (
            <div key={player.id} className="player-card">
              <div className="player-card-header">
                <div className="player-name">
                  <h3>{player.firstName} {player.lastName}</h3>
                  <span className="player-position">
                    {getPositionLabel(player.position)}
                  </span>
                </div>
                {player.shirtNumber && (
                  <div className="shirt-number">
                    {player.shirtNumber}
                  </div>
                )}
              </div>

              <div className="player-card-body">
                <div className="player-info">
                  <div className="info-item">
                    <span className="label">Età:</span>
                    <span className="value">{calculateAge(player.dateOfBirth)} anni</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Nazionalità:</span>
                    <span className="value">{player.nationality}</span>
                  </div>
                  {player.height && (
                    <div className="info-item">
                      <span className="label">Altezza:</span>
                      <span className="value">{player.height} cm</span>
                    </div>
                  )}
                  {player.weight && (
                    <div className="info-item">
                      <span className="label">Peso:</span>
                      <span className="value">{player.weight} kg</span>
                    </div>
                  )}
                </div>

                <div className="player-status">
                  <span className={`status-badge ${player.isActive ? 'active' : 'inactive'}`}>
                    {player.isActive ? 'Attivo' : 'Non Attivo'}
                  </span>
                </div>
              </div>

              <div className="player-card-footer">
                <small>Aggiunto il {formatDate(player.createdAt)}</small>
                <button 
                  onClick={() => handleEditPlayer(player)}
                  className="btn btn-outline"
                >
                  Modifica
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modale Form */}
      <PlayerFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        player={editingPlayer}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default PlayersList;