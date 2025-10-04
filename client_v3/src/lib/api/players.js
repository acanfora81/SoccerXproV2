// API reale per Players - collegata al backend
const API_BASE_URL = 'http://localhost:3001/api';

// Helper per gestire le chiamate API
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

export const PlayersAPI = {
  async list() {
    const response = await apiCall('/players');
    return response.data || [];
  },

  async create(player) {
    // Mappa i campi dal frontend al backend
    const playerData = {
      firstName: player.firstName,
      lastName: player.lastName,
      dateOfBirth: player.dateOfBirth || new Date().toISOString(),
      nationality: player.nationality || 'Italia',
      position: player.role, // role -> position
      shirtNumber: player.shirtNumber,
      height: player.height,
      weight: player.weight,
      preferredFoot: player.preferredFoot,
      placeOfBirth: player.placeOfBirth,
      taxCode: player.taxCode,
      passportNumber: player.passportNumber,
    };

    const response = await apiCall('/players', {
      method: 'POST',
      body: JSON.stringify(playerData),
    });
    
    return response.data;
  },

  async update(id, player) {
    // Mappa i campi dal frontend al backend
    const playerData = {
      firstName: player.firstName,
      lastName: player.lastName,
      dateOfBirth: player.dateOfBirth,
      nationality: player.nationality,
      position: player.role, // role -> position
      shirtNumber: player.shirtNumber,
      height: player.height,
      weight: player.weight,
      preferredFoot: player.preferredFoot,
      placeOfBirth: player.placeOfBirth,
      taxCode: player.taxCode,
      passportNumber: player.passportNumber,
      isActive: player.isActive !== false,
    };

    const response = await apiCall(`/players/${id}`, {
      method: 'PUT',
      body: JSON.stringify(playerData),
    });
    
    return response.data;
  },

  async remove(id) {
    await apiCall(`/players/${id}`, {
      method: 'DELETE',
    });
    
    return { success: true };
  },

  async exportExcel() {
    const response = await fetch(`${API_BASE_URL}/players/export-excel`);
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    return { data: blob };
  },

  async fixEncoding() {
    // Questa funzionalità non è implementata nel backend
    // Potrebbe essere aggiunta in futuro
    console.log("Fix encoding not implemented in backend yet");
    return { success: true };
  },
};
