import React, { useEffect, useState } from "react";
import PageHeader from "@/design-system/ds/PageHeader";
import Button from "@/design-system/ds/Button";
import Card, { CardContent, CardHeader } from "@/design-system/ds/Card";
import KPICard from "@/design-system/ds/KPICard";
import EmptyState from "@/design-system/ds/EmptyState";

import { 
  Users, 
  BarChart3, 
  TrendingUp, 
  Calendar,
  RefreshCw,
  Download,
  Target,
  Activity
} from "lucide-react";

import { PlayersAPI } from "@/lib/api/players";
import PhysicalStatsChart from "../components/PhysicalStatsChart";
import ContractDistributionChart from "../components/ContractDistributionChart";
import HeightWeightScatterChart from "../components/HeightWeightScatterChart";
import AgeDistributionChart from "../components/AgeDistributionChart";
import NationalityChart from "../components/NationalityChart";

// Funzione per calcolare l'età dalla data di nascita
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Funzione per tradurre i ruoli
const translateRole = (position) => {
  const roleMap = {
    'GOALKEEPER': 'Portiere',
    'DEFENDER': 'Difensore',
    'MIDFIELDER': 'Centrocampista',
    'FORWARD': 'Attaccante'
  };
  return roleMap[position] || position || '-';
};

export default function PlayersStats() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    // Carica preferenza da localStorage, default "cards"
    return localStorage.getItem('playersStatsViewMode') || 'cards';
  });

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const data = await PlayersAPI.list();
      setPlayers(data);
      
      // Controlla se stiamo usando dati mock
      const isMockData = data.length > 0 && data[0].firstName === "Mario" && data[0].lastName === "Rossi";
      setIsUsingMockData(isMockData);
      
    } catch (err) {
      console.error("Errore fetch players:", err);
      setIsUsingMockData(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  // Calcola statistiche
  const totalPlayers = players.length;
  const ages = players.map(p => calculateAge(p.dateOfBirth)).filter(a => a !== null);
  const avgAge = ages.length ? (ages.reduce((s, a) => s + a, 0) / ages.length).toFixed(1) : 0;
  
  const heights = players.map(p => p.height).filter(h => h && h > 0);
  const avgHeight = heights.length ? (heights.reduce((s, h) => s + h, 0) / heights.length).toFixed(0) : 0;
  
  const weights = players.map(p => p.weight).filter(w => w && w > 0);
  const avgWeight = weights.length ? (weights.reduce((s, w) => s + w, 0) / weights.length).toFixed(0) : 0;

  // Statistiche per ruolo
  const roleStats = players.reduce((acc, player) => {
    const role = translateRole(player.position);
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  // Giocatori con maglia assegnata
  const playersWithShirt = players.filter(p => p.shirtNumber && p.shirtNumber > 0).length;

  // Nazionalità più comuni
  const nationalityStats = players.reduce((acc, player) => {
    const nationality = player.nationality || 'Non specificata';
    acc[nationality] = (acc[nationality] || 0) + 1;
    return acc;
  }, {});

  const topNationalities = Object.entries(nationalityStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const handleExportStats = async () => {
    try {
      // TODO: Implementare export statistiche
      console.log("Export statistiche non ancora implementato");
    } catch (err) {
      console.error("Errore export:", err);
    }
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('playersStatsViewMode', mode);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statistiche Giocatori"
        subtitle="Analisi dettagliata della rosa giocatori"
        actions={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={fetchPlayers} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>
            <Button variant="info" onClick={handleExportStats}>
              <Download className="w-4 h-4 mr-2" />
              Esporta Report
            </Button>
          </div>
        }
      />

      {/* Toggle Vista */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => handleViewModeChange('cards')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              viewMode === 'cards'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Vista Cards
          </button>
          <button
            onClick={() => handleViewModeChange('charts')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              viewMode === 'charts'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Vista Grafici
          </button>
        </div>
      </div>

      {/* Banner di avviso per dati mock */}
      {isUsingMockData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Backend non disponibile
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Il server backend non è raggiungibile. Stai visualizzando statistiche su dati di esempio.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards o Grafici Rapidi */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard 
            icon={Users} 
            value={totalPlayers} 
            label="Giocatori Totali" 
          />
          <KPICard 
            icon={Calendar} 
            value={`${avgAge} anni`} 
            label="Età Media" 
          />
          <KPICard 
            icon={Target} 
            value={`${playersWithShirt}/${totalPlayers}`} 
            label="Maglie Assegnate" 
          />
          <KPICard 
            icon={Activity} 
            value={`${avgHeight} cm`} 
            label="Altezza Media" 
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Distribuzione per Età
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Fasce d'età nella rosa
              </p>
            </CardHeader>
            <CardContent>
              <AgeDistributionChart players={players} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Top Nazionalità
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Mix culturale della squadra
              </p>
            </CardHeader>
            <CardContent>
              <NationalityChart players={players} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grafici Intelligenti - Solo nella vista Charts */}
      {viewMode === 'charts' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Altezza vs Peso per Ruolo */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Altezza vs Peso per Ruolo
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Confronto profili fisici tra reparti
                </p>
              </CardHeader>
              <CardContent>
                <PhysicalStatsChart players={players} />
              </CardContent>
            </Card>

            {/* Distribuzione Contratti */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Distribuzione Contratti
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tipi di contratto nella rosa
                </p>
              </CardHeader>
              <CardContent>
                <ContractDistributionChart players={players} />
              </CardContent>
            </Card>
          </div>

          {/* Mappa Altezza/Peso Singoli Giocatori */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Mappa Altezza/Peso Giocatori
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Visualizzazione singoli giocatori per identificare outlier fisici
              </p>
            </CardHeader>
            <CardContent>
              <HeightWeightScatterChart players={players} />
            </CardContent>
          </Card>
        </>
      )}

      {/* Statistiche Dettagliate - Solo nella vista Cards */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuzione per Ruolo */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Distribuzione per Ruolo
            </h2>
          </CardHeader>
          <CardContent>
            {Object.keys(roleStats).length === 0 ? (
              <EmptyState
                icon={Users}
                title="Nessun dato disponibile"
                description="Non ci sono giocatori con ruoli assegnati"
              />
            ) : (
              <div className="space-y-3">
                {Object.entries(roleStats).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {role}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(count / totalPlayers) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Nazionalità */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top Nazionalità
            </h2>
          </CardHeader>
          <CardContent>
            {topNationalities.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Nessun dato disponibile"
                description="Non ci sono informazioni sulle nazionalità"
              />
            ) : (
              <div className="space-y-3">
                {topNationalities.map(([nationality, count]) => (
                  <div key={nationality} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {nationality}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(count / totalPlayers) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      )}

      {/* Statistiche Fisiche - Solo nella vista Cards */}
      {viewMode === 'cards' && (
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Statistiche Fisiche
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {avgHeight} cm
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Altezza Media
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {heights.length} giocatori con dati
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {avgWeight} kg
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Peso Medio
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {weights.length} giocatori con dati
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {avgAge} anni
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Età Media
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {ages.length} giocatori con età
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
