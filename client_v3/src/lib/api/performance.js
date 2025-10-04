// API per Performance - collegata al backend
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
  if (endpoint === '/performance/dashboard') {
    return {
      data: [
        {
          id: 1,
          name: "Alessandro Rossi",
          position: "FORWARD",
          matches: 12,
          goals: 8,
          assists: 3,
          rating: 8.2,
          status: "Attivo"
        },
        {
          id: 2,
          name: "Marco Bianchi",
          position: "MIDFIELDER",
          matches: 11,
          goals: 2,
          assists: 7,
          rating: 7.8,
          status: "Attivo"
        },
        {
          id: 3,
          name: "Giuseppe Verdi",
          position: "DEFENDER",
          matches: 10,
          goals: 1,
          assists: 1,
          rating: 7.5,
          status: "Attivo"
        },
        {
          id: 4,
          name: "Francesco Neri",
          position: "GOALKEEPER",
          matches: 12,
          goals: 0,
          assists: 0,
          rating: 7.9,
          status: "Attivo"
        },
        {
          id: 5,
          name: "Luca Rossi",
          position: "FORWARD",
          matches: 9,
          goals: 5,
          assists: 2,
          rating: 7.2,
          status: "Attivo"
        },
        {
          id: 6,
          name: "Antonio Bianchi",
          position: "MIDFIELDER",
          matches: 8,
          goals: 1,
          assists: 4,
          rating: 6.8,
          status: "Attivo"
        }
      ]
    };
  }
  
  if (endpoint === '/performance/players') {
    return {
      data: [
        {
          id: 1,
          name: "Alessandro Rossi",
          position: "FORWARD",
          matches: 12,
          goals: 8,
          assists: 3,
          rating: 8.2,
          status: "Attivo",
          minutesPlayed: 1080,
          shotsOnTarget: 15,
          passesCompleted: 89,
          tackles: 12,
          interceptions: 8
        },
        {
          id: 2,
          name: "Marco Bianchi",
          position: "MIDFIELDER",
          matches: 11,
          goals: 2,
          assists: 7,
          rating: 7.8,
          status: "Attivo",
          minutesPlayed: 990,
          shotsOnTarget: 8,
          passesCompleted: 156,
          tackles: 18,
          interceptions: 12
        },
        {
          id: 3,
          name: "Giuseppe Verdi",
          position: "DEFENDER",
          matches: 10,
          goals: 1,
          assists: 1,
          rating: 7.5,
          status: "Attivo",
          minutesPlayed: 900,
          shotsOnTarget: 3,
          passesCompleted: 134,
          tackles: 25,
          interceptions: 18
        },
        {
          id: 4,
          name: "Francesco Neri",
          position: "GOALKEEPER",
          matches: 12,
          goals: 0,
          assists: 0,
          rating: 7.9,
          status: "Attivo",
          minutesPlayed: 1080,
          shotsOnTarget: 0,
          passesCompleted: 45,
          tackles: 2,
          interceptions: 1,
          saves: 28,
          cleanSheets: 4
        }
      ]
    };
  }
  
  if (endpoint === '/performance/analytics') {
    return {
      data: {
        teamStats: {
          totalGoals: 24,
          totalAssists: 18,
          avgRating: 7.6,
          totalMatches: 12
        },
        positionStats: {
          FORWARD: { avgRating: 7.7, totalGoals: 13, totalAssists: 5 },
          MIDFIELDER: { avgRating: 7.3, totalGoals: 3, totalAssists: 11 },
          DEFENDER: { avgRating: 7.5, totalGoals: 1, totalAssists: 1 },
          GOALKEEPER: { avgRating: 7.9, totalGoals: 0, totalAssists: 0 }
        },
        trends: [
          { date: '2024-01-01', rating: 7.2, goals: 2 },
          { date: '2024-01-08', rating: 7.5, goals: 3 },
          { date: '2024-01-15', rating: 7.8, goals: 1 },
          { date: '2024-01-22', rating: 7.6, goals: 4 }
        ]
      }
    };
  }
  
  return { data: [] };
};

export const PerformanceAPI = {
  // Dashboard principale - usa endpoint reale
  async getDashboardData(teamId = 1) {
    const response = await apiCall(`/performance?teamId=${teamId}&aggregation=team`);
    return response.data;
  },

  // Lista giocatori con performance - usa endpoint reale
  async getPlayersPerformance(teamId = 1, filters = {}) {
    const queryParams = new URLSearchParams({
      teamId: teamId.toString(),
      ...filters
    });
    const response = await apiCall(`/performance/stats/players?${queryParams}`);
    return response.data;
  },

  // Analytics avanzate - usa endpoint reale
  async getAnalytics(teamId = 1, filters = {}) {
    const queryParams = new URLSearchParams({
      teamId: teamId.toString(),
      ...filters
    });
    const response = await apiCall(`/performance?${queryParams}`);
    return response.data;
  },

  // Export report
  async exportReport(format = 'excel') {
    const response = await apiCall(`/performance/export?format=${format}`, {
      method: 'GET',
    });
    return response;
  },

  // Import dati performance
  async importData(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiCall('/performance/import', {
      method: 'POST',
      body: formData,
    });
    return response.data;
  },

  // Download template
  async downloadTemplate() {
    const response = await apiCall('/performance/template', {
      method: 'GET',
    });
    return response;
  },

  // Aggiorna performance giocatore
  async updatePlayerPerformance(playerId, performanceData) {
    const response = await apiCall(`/performance/players/${playerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(performanceData),
    });
    return response.data;
  },

  // Crea nuova analisi
  async createAnalysis(analysisData) {
    const response = await apiCall('/performance/analyses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analysisData),
    });
    return response.data;
  },

  // Ottieni analisi esistenti
  async getAnalyses() {
    const response = await apiCall('/performance/analyses');
    return response.data;
  },

  // Elimina analisi
  async deleteAnalysis(analysisId) {
    const response = await apiCall(`/performance/analyses/${analysisId}`, {
      method: 'DELETE',
    });
    return response.data;
  }
};
