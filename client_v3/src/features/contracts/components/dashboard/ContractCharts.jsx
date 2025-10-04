// client_v3/src/features/contracts/components/dashboard/ContractCharts.jsx
// Componente per i grafici della dashboard contratti

import { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, DollarSign } from 'lucide-react';
import CustomTooltip from '../CustomTooltip';
import ValueTooltip from '../ValueTooltip';
import CountTooltip from '../CountTooltip';
import { formatItalianCurrency } from '@/lib/utils/italianNumbers';
import Card, { CardContent, CardHeader } from "@/design-system/ds/Card";
import Button from "@/design-system/ds/Button";
import EmptyState from "@/design-system/ds/EmptyState";

const ContractCharts = ({ trends, distributions, topPlayers, monthlyExpenses }) => {
  const [activeChart, setActiveChart] = useState('trend');
  const [hiddenSeries, setHiddenSeries] = useState(new Set());

  // Colori moderni per i grafici
  const colors = {
    primary: '#4f46e5',      // Indigo
    secondary: '#10b981',    // Emerald
    accent: '#f59e0b',       // Amber
    danger: '#ef4444',       // Red
    purple: '#9333ea',       // Violet
    pink: '#ec4899',         // Pink
    teal: '#14b8a6',         // Teal
    orange: '#f97316'        // Orange
  };

  // Colori per il pie chart
  const pieColors = [
    colors.primary,
    colors.secondary,
    colors.accent,
    colors.danger,
    colors.purple,
    colors.pink,
    colors.teal,
    colors.orange
  ];

  // Funzione per tradurre le posizioni dei giocatori in italiano (singolare)
  const getRoleLabel = (position) => {
    const positionLabels = {
      'GOALKEEPER': 'Portiere',
      'DEFENDER': 'Difensore',
      'MIDFIELDER': 'Centrocampista',
      'FORWARD': 'Attaccante',
      'STRIKER': 'Attaccante',
      'WINGER': 'Centrocampista',
      'CENTER_BACK': 'Difensore',
      'FULL_BACK': 'Difensore',
      'DEFENSIVE_MIDFIELDER': 'Centrocampista',
      'ATTACKING_MIDFIELDER': 'Centrocampista',
      'Non specificato': 'Non specificato'
    };
    return positionLabels[position] || position || 'Non specificato';
  };

  // Funzione per tradurre le posizioni dei giocatori in italiano (plurale)
  const getRoleLabelPlural = (position) => {
    const positionLabels = {
      'GOALKEEPER': 'Portieri',
      'DEFENDER': 'Difensori',
      'MIDFIELDER': 'Centrocampisti',
      'FORWARD': 'Attaccanti',
      'STRIKER': 'Attaccanti',
      'WINGER': 'Centrocampisti',
      'CENTER_BACK': 'Difensori',
      'FULL_BACK': 'Difensori',
      'DEFENSIVE_MIDFIELDER': 'Centrocampisti',
      'ATTACKING_MIDFIELDER': 'Centrocampisti',
      'Non specificato': 'Non specificato'
    };
    return positionLabels[position] || position || 'Non specificato';
  };

  // Funzione per ordinare i dati per ruolo nell'ordine specificato
  const sortDataByRole = (data) => {
    const roleOrder = ['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD', 'STRIKER', 'WINGER', 'CENTER_BACK', 'FULL_BACK', 'DEFENSIVE_MIDFIELDER', 'ATTACKING_MIDFIELDER'];
    return data.sort((a, b) => {
      const aIndex = roleOrder.indexOf(a.role);
      const bIndex = roleOrder.indexOf(b.role);
      return aIndex - bIndex;
    });
  };

  // Formatta valuta per tooltip
  const formatCurrency = (value) => {
    return formatItalianCurrency(value);
  };

  // Gestisce click sulla legenda
  const handleLegendClick = (data) => {
    const newHiddenSeries = new Set(hiddenSeries);
    if (newHiddenSeries.has(data.value)) {
      newHiddenSeries.delete(data.value);
    } else {
      newHiddenSeries.add(data.value);
    }
    setHiddenSeries(newHiddenSeries);
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <Button
          variant={activeChart === 'trend' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveChart('trend')}
          className="flex items-center gap-2"
        >
          <TrendingUp size={16} />
          Trend Valore
        </Button>
        <Button
          variant={activeChart === 'distribution' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveChart('distribution')}
          className="flex items-center gap-2"
        >
          <BarChart3 size={16} />
          Distribuzioni
        </Button>
        <Button
          variant={activeChart === 'topPlayers' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveChart('topPlayers')}
          className="flex items-center gap-2"
        >
          <PieChartIcon size={16} />
          Top Giocatori
        </Button>
        <Button
          variant={activeChart === 'expenses' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveChart('expenses')}
          className="flex items-center gap-2"
        >
          <DollarSign size={16} />
          Uscite Mensili
        </Button>
      </div>

      {/* Trend Chart */}
      {activeChart === 'trend' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Trend Valore Contratti (Ultimi 12 Mesi)</h3>
          </CardHeader>
          <CardContent>
            {trends && trends.length > 0 ? (
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorValore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#9333ea" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="colorStipendio" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12, fill: '#666' }}
                      tickFormatter={(value) => value.substring(0, 3)}
                      axisLine={{ stroke: '#e0e0e0' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#666' }}
                      tickFormatter={(value) => formatCurrency(value)}
                      axisLine={{ stroke: '#e0e0e0' }}
                    />
                    <Tooltip content={<ValueTooltip />} />
                    <Legend 
                      onClick={handleLegendClick}
                      wrapperStyle={{ paddingTop: '20px', cursor: 'pointer' }}
                      iconType="circle"
                    />
                    <Line
                      type="monotone"
                      dataKey="totalValue"
                      stroke="url(#colorValore)"
                      strokeWidth={3}
                      name="Valore Totale"
                      dot={{ r: 6, strokeWidth: 2, stroke: "#4f46e5", fill: "#fff" }}
                      activeDot={{ r: 8, stroke: "#9333ea", strokeWidth: 2 }}
                      isAnimationActive={true}
                      animationBegin={200}
                      animationDuration={1200}
                      animationEasing="ease-out"
                      hide={hiddenSeries.has('totalValue')}
                    />
                    <Line
                      type="monotone"
                      dataKey="averageSalary"
                      stroke="url(#colorStipendio)"
                      strokeWidth={2}
                      name="Stipendio Medio"
                      dot={{ r: 5, strokeWidth: 2, stroke: "#10b981", fill: "#fff" }}
                      activeDot={{ r: 7, stroke: "#14b8a6", strokeWidth: 2 }}
                      isAnimationActive={true}
                      animationBegin={400}
                      animationDuration={1200}
                      animationEasing="ease-out"
                      hide={hiddenSeries.has('averageSalary')}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                icon={TrendingUp}
                title="Nessun dato disponibile"
                description="Non ci sono dati per visualizzare il trend dei contratti"
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Distribution Charts */}
      {activeChart === 'distribution' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribuzione per Ruolo */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Distribuzione per Ruolo</h3>
            </CardHeader>
            <CardContent>
              {distributions?.byRole && distributions.byRole.length > 0 ? (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sortDataByRole([...distributions.byRole]).map(item => ({
                          name: getRoleLabelPlural(item.role),
                          value: item.count,
                          originalRole: item.role
                        }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={40}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="#fff"
                        strokeWidth={2}
                        isAnimationActive={true}
                        animationBegin={0}
                        animationDuration={800}
                        animationEasing="ease-out"
                      >
                        {sortDataByRole([...distributions.byRole]).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={<CountTooltip />}
                        formatter={(value, name) => [value, name]}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value) => value}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  icon={PieChartIcon}
                  title="Nessun dato disponibile"
                  description="Non ci sono dati per la distribuzione per ruolo"
                />
              )}
            </CardContent>
          </Card>

          {/* Distribuzione Valore per Posizione */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Distribuzione Valore per Posizione</h3>
            </CardHeader>
            <CardContent>
              {distributions?.byRole && distributions.byRole.length > 0 ? (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributions.byRole.map(item => ({
                      role: getRoleLabel(item.role),
                      value: item.totalSalary,
                      count: item.count,
                      originalRole: item.role
                    }))} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <defs>
                        <linearGradient id="valueByRoleGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0.4}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="role" 
                        tick={{ fontSize: 12, fill: '#666' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        axisLine={{ stroke: '#e0e0e0' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#666' }}
                        tickFormatter={(value) => formatCurrency(value)}
                        axisLine={{ stroke: '#e0e0e0' }}
                      />
                      <Tooltip content={<ValueTooltip />} />
                      <Bar 
                        dataKey="value" 
                        fill="url(#valueByRoleGradient)"
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={true}
                        animationBegin={200}
                        animationDuration={1200}
                        animationEasing="ease-out"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  title="Nessun dato disponibile"
                  description="Non ci sono dati per la distribuzione valore per posizione"
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Players Chart */}
      {activeChart === 'topPlayers' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Top 5 Giocatori per Stipendio</h3>
          </CardHeader>
          <CardContent>
            {topPlayers && topPlayers.length > 0 ? (
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={topPlayers.slice(0, 5).map(player => {
                      const salary = parseFloat(player.salary) || 0;
                      return {
                        name: player.playerName,
                        salary: salary,
                        role: player.role,
                        status: player.status
                      };
                    })} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <defs>
                      <linearGradient id="topPlayersGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.4}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name"
                      tick={{ fontSize: 12, fill: '#666' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      axisLine={{ stroke: '#e0e0e0' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#666' }}
                      tickFormatter={(value) => formatCurrency(value)}
                      axisLine={{ stroke: '#e0e0e0' }}
                      domain={[0, 'dataMax']}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                              <p className="font-medium text-gray-900 dark:text-white">{label}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {formatCurrency(payload[0].value)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="salary" 
                      fill="url(#topPlayersGradient)"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={true}
                      animationBegin={(index) => index * 100}
                      animationDuration={1200}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                title="Nessun dato disponibile"
                description="Non ci sono dati per i top giocatori"
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Monthly Expenses Chart */}
      {activeChart === 'expenses' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Uscite Mensili (Ultimi 12 Mesi)</h3>
          </CardHeader>
          <CardContent>
            {monthlyExpenses && monthlyExpenses.length > 0 ? (
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyExpenses} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.4}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12, fill: '#666' }}
                      tickFormatter={(value) => value.substring(0, 3)}
                      axisLine={{ stroke: '#e0e0e0' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#666' }}
                      tickFormatter={(value) => formatCurrency(value)}
                      axisLine={{ stroke: '#e0e0e0' }}
                    />
                    <Tooltip content={<ValueTooltip />} />
                    <Bar 
                      dataKey="totalExpenses" 
                      fill="url(#expensesGradient)"
                      radius={[4, 4, 0, 0]}
                      name="Uscite Totali"
                      isAnimationActive={true}
                      animationBegin={(index) => index * 150}
                      animationDuration={1200}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                title="Nessun dato disponibile"
                description="Non ci sono dati per le uscite mensili"
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContractCharts;
