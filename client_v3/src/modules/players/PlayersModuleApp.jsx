import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  FileText, 
  Image, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import apiFetch from '../../utils/apiFetch';

const PlayersModuleApp = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Note state
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [showNoteForm, setShowNoteForm] = useState(false);
  
  // Media state
  const [media, setMedia] = useState([]);
  const [newMedia, setNewMedia] = useState({ type: 'IMAGE', url: '', title: '' });
  const [showMediaForm, setShowMediaForm] = useState(false);

  // Load players list
  useEffect(() => {
    loadPlayers();
  }, []);

  // Load player details when selected
  useEffect(() => {
    if (playerId) {
      loadPlayerDetails(playerId);
    }
  }, [playerId]);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/players');
      setPlayers(data.data || data);
      setError(null);
    } catch (err) {
      console.error('Error loading players:', err);
      setError('Errore nel caricamento dei giocatori');
    } finally {
      setLoading(false);
    }
  };

  const loadPlayerDetails = async (id) => {
    try {
      setLoading(true);
      const data = await apiFetch(`/api/players/${id}`);
      setSelectedPlayer(data.data || data);
      
      // Load notes and media
      loadPlayerNotes(id);
      loadPlayerMedia(id);
      
      setError(null);
    } catch (err) {
      console.error('Error loading player details:', err);
      setError('Errore nel caricamento del giocatore');
    } finally {
      setLoading(false);
    }
  };

  const loadPlayerNotes = async (id) => {
    try {
      const data = await apiFetch(`/api/players/notes/${id}`);
      setNotes(data.data || data || []);
    } catch (err) {
      console.error('Error loading notes:', err);
    }
  };

  const loadPlayerMedia = async (id) => {
    try {
      const data = await apiFetch(`/api/players/media/${id}`);
      setMedia(data.data || data || []);
    } catch (err) {
      console.error('Error loading media:', err);
    }
  };

  const handlePlayerSelect = (player) => {
    setSelectedPlayer(player);
    setActiveTab('profile');
    navigate(`/dashboard/players/${player.id}`);
  };

  const handleStatusChange = async (status) => {
    if (!selectedPlayer) return;
    
    try {
      await apiFetch(`/api/players/${selectedPlayer.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      
      // Reload player details
      loadPlayerDetails(selectedPlayer.id);
      loadPlayers();
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Errore nell\'aggiornamento dello stato');
    }
  };

  const handleAddNote = async () => {
    if (!selectedPlayer || !newNote.title || !newNote.content) return;
    
    try {
      await apiFetch(`/api/players/notes/${selectedPlayer.id}`, {
        method: 'POST',
        body: JSON.stringify(newNote)
      });
      
      // Reload notes
      loadPlayerNotes(selectedPlayer.id);
      setNewNote({ title: '', content: '' });
      setShowNoteForm(false);
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Errore nell\'aggiunta della nota');
    }
  };

  const handleAddMedia = async () => {
    if (!selectedPlayer || !newMedia.url) return;
    
    try {
      await apiFetch(`/api/players/media/${selectedPlayer.id}`, {
        method: 'POST',
        body: JSON.stringify(newMedia)
      });
      
      // Reload media
      loadPlayerMedia(selectedPlayer.id);
      setNewMedia({ type: 'IMAGE', url: '', title: '' });
      setShowMediaForm(false);
    } catch (err) {
      console.error('Error adding media:', err);
      setError('Errore nell\'aggiunta del media');
    }
  };

  if (loading && players.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Players List Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Giocatori</h2>
          <p className="text-sm text-gray-500">{players.length} giocatori</p>
        </div>
        
        {error && (
          <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        <div className="p-2">
          {players.map((player) => (
            <button
              key={player.id}
              onClick={() => handlePlayerSelect(player)}
              className={`w-full p-3 mb-2 rounded-lg text-left transition-colors ${
                selectedPlayer?.id === player.id
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {player.shirtNumber || player.firstName?.charAt(0) || '?'}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">
                    {player.firstName} {player.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {player.position} • {player.nationality}
                  </div>
                </div>
                {player.isActive && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {selectedPlayer ? (
          <div className="p-6">
            {/* Player Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {selectedPlayer.shirtNumber || selectedPlayer.firstName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800">
                      {selectedPlayer.firstName} {selectedPlayer.lastName}
                    </h1>
                    <div className="flex items-center gap-4 mt-2 text-gray-600">
                      <span>{selectedPlayer.position}</span>
                      <span>•</span>
                      <span>{selectedPlayer.nationality}</span>
                      <span>•</span>
                      <span>Numero {selectedPlayer.shirtNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange(selectedPlayer.isActive ? 'inactive' : 'active')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedPlayer.isActive
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {selectedPlayer.isActive ? 'Attivo' : 'Inattivo'}
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="border-b border-gray-200">
                <div className="flex gap-4 px-6">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                      activeTab === 'profile'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Profilo</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                      activeTab === 'notes'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>Note ({notes.length})</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('media')}
                    className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                      activeTab === 'media'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      <span>Media ({media.length})</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Informazioni Personali</h3>
                      <dl className="space-y-3">
                        <div>
                          <dt className="text-sm text-gray-500">Data di Nascita</dt>
                          <dd className="text-gray-800">
                            {selectedPlayer.dateOfBirth 
                              ? new Date(selectedPlayer.dateOfBirth).toLocaleDateString('it-IT')
                              : 'N/A'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">Luogo di Nascita</dt>
                          <dd className="text-gray-800">{selectedPlayer.placeOfBirth || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">Nazionalità</dt>
                          <dd className="text-gray-800">{selectedPlayer.nationality || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">Codice Fiscale</dt>
                          <dd className="text-gray-800">{selectedPlayer.taxCode || 'N/A'}</dd>
                        </div>
                      </dl>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Dati Sportivi</h3>
                      <dl className="space-y-3">
                        <div>
                          <dt className="text-sm text-gray-500">Ruolo</dt>
                          <dd className="text-gray-800">{selectedPlayer.position || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">Numero Maglia</dt>
                          <dd className="text-gray-800">{selectedPlayer.shirtNumber || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">Altezza</dt>
                          <dd className="text-gray-800">{selectedPlayer.height ? `${selectedPlayer.height} cm` : 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">Peso</dt>
                          <dd className="text-gray-800">{selectedPlayer.weight ? `${selectedPlayer.weight} kg` : 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">Piede Preferito</dt>
                          <dd className="text-gray-800">{selectedPlayer.preferredFoot || 'N/A'}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                )}

                {/* Notes Tab */}
                {activeTab === 'notes' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Note Giocatore</h3>
                      <button
                        onClick={() => setShowNoteForm(!showNoteForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        {showNoteForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        <span>{showNoteForm ? 'Annulla' : 'Nuova Nota'}</span>
                      </button>
                    </div>

                    {showNoteForm && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <input
                          type="text"
                          placeholder="Titolo nota"
                          value={newNote.title}
                          onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                          className="w-full px-4 py-2 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <textarea
                          placeholder="Contenuto nota"
                          value={newNote.content}
                          onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-2 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={handleAddNote}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          <span>Salva Nota</span>
                        </button>
                      </div>
                    )}

                    <div className="space-y-3">
                      {notes.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          Nessuna nota disponibile
                        </div>
                      ) : (
                        notes.map((note) => (
                          <div key={note.id} className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold text-gray-800 mb-2">{note.title}</h4>
                            <p className="text-gray-600 text-sm">{note.content}</p>
                            <div className="mt-2 text-xs text-gray-500">
                              {note.createdAt && new Date(note.createdAt).toLocaleString('it-IT')}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Media Tab */}
                {activeTab === 'media' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Media Giocatore</h3>
                      <button
                        onClick={() => setShowMediaForm(!showMediaForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        {showMediaForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        <span>{showMediaForm ? 'Annulla' : 'Nuovo Media'}</span>
                      </button>
                    </div>

                    {showMediaForm && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <select
                          value={newMedia.type}
                          onChange={(e) => setNewMedia({ ...newMedia, type: e.target.value })}
                          className="w-full px-4 py-2 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="IMAGE">Immagine</option>
                          <option value="VIDEO">Video</option>
                          <option value="DOCUMENT">Documento</option>
                        </select>
                        <input
                          type="text"
                          placeholder="URL media"
                          value={newMedia.url}
                          onChange={(e) => setNewMedia({ ...newMedia, url: e.target.value })}
                          className="w-full px-4 py-2 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          placeholder="Titolo (opzionale)"
                          value={newMedia.title}
                          onChange={(e) => setNewMedia({ ...newMedia, title: e.target.value })}
                          className="w-full px-4 py-2 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={handleAddMedia}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          <span>Salva Media</span>
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                      {media.length === 0 ? (
                        <div className="col-span-3 text-center py-8 text-gray-500">
                          Nessun media disponibile
                        </div>
                      ) : (
                        media.map((item) => (
                          <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Image className="w-4 h-4 text-gray-500" />
                              <span className="text-xs text-gray-500">{item.type}</span>
                            </div>
                            <h4 className="font-semibold text-gray-800 mb-1">{item.title || 'Senza titolo'}</h4>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-500 hover:underline"
                            >
                              Visualizza
                            </a>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Seleziona un giocatore dalla lista
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayersModuleApp;

