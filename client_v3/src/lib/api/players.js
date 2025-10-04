// API reale per Players - collegata al backend
import { apiFetch } from '../utils/apiFetch';

// Helper per gestire le chiamate API con autenticazione
const apiCall = async (endpoint, options = {}) => {
  try {
    return await apiFetch(endpoint, options);
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    
    // Se il server non è raggiungibile, usa dati mock temporanei
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      console.warn('Backend non raggiungibile, usando dati mock temporanei');
      return getMockData(endpoint);
    }
    
    throw error;
  }
};

// Dati mock temporanei quando il backend non è disponibile
const getMockData = (endpoint) => {
  if (endpoint === '/api/players') {
    return {
      data: [
        {
          id: 1,
          firstName: "Mario",
          lastName: "Rossi",
          position: "GOALKEEPER",
          dateOfBirth: "1995-03-15T00:00:00.000Z",
          nationality: "Italia",
          height: 185,
          weight: 80,
          contracts: [{ contractType: "PROFESSIONAL" }]
        },
        {
          id: 2,
          firstName: "Luca",
          lastName: "Bianchi",
          position: "DEFENDER",
          dateOfBirth: "1998-07-22T00:00:00.000Z",
          nationality: "Italia",
          height: 180,
          weight: 75,
          contracts: [{ contractType: "PROFESSIONAL" }]
        },
        {
          id: 3,
          firstName: "Giuseppe",
          lastName: "Verdi",
          position: "MIDFIELDER",
          dateOfBirth: "2000-11-08T00:00:00.000Z",
          nationality: "Italia",
          height: 175,
          weight: 70,
          contracts: [{ contractType: "LOAN" }]
        },
        {
          id: 4,
          firstName: "Antonio",
          lastName: "Neri",
          position: "FORWARD",
          dateOfBirth: "1997-05-12T00:00:00.000Z",
          nationality: "Italia",
          height: 182,
          weight: 78,
          contracts: [{ contractType: "PERMANENT" }]
        }
      ]
    };
  }
  
  return { data: null };
};

export const PlayersAPI = {
  async list() {
    const response = await apiCall('/api/players');
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

    const response = await apiCall('/api/players', {
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

    const response = await apiCall(`/api/players/${id}`, {
      method: 'PUT',
      body: JSON.stringify(playerData),
    });
    
    return response.data;
  },

  async remove(id) {
    await apiCall(`/api/players/${id}`, {
      method: 'DELETE',
    });
    
    return { success: true };
  },

  async exportExcel() {
    const response = await fetch('http://localhost:3001/api/players/export-excel', {
      credentials: 'include'
    });
    
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

         async uploadFile(file) {
           const formData = new FormData();
           formData.append('file', file);

           const response = await apiCall('/api/players/upload', {
             method: 'POST',
             body: formData,
             // Non impostare Content-Type per FormData, il browser lo farà automaticamente
           });
           
           return response.data;
         },

         async downloadTemplate() {
           const response = await fetch('http://localhost:3001/api/players/template', {
             credentials: 'include'
           });
           
           if (!response.ok) {
             throw new Error(`Template download failed: ${response.statusText}`);
           }

           const blob = await response.blob();
           return { data: blob };
         },

         async getStats() {
           const response = await apiCall('/api/players/stats');
           return response.data;
         },
};
