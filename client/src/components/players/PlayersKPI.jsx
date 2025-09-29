// client/src/components/players/PlayersKPI.jsx
import { ICONS, ICON_SIZES } from '../../config/icons-map';

function calcAge(dob) {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

const PlayersKPI = ({ players }) => {
  const totalPlayers = players?.length || 0;
  const ages = players.map(p => calcAge(p.dateOfBirth)).filter(a => typeof a === 'number');
  const avgAge = ages.length ? (ages.reduce((s, a) => s + a, 0) / ages.length) : 0;

  const heights = players.map(p => p.height).filter(h => typeof h === 'number' && h > 0);
  const weights = players.map(p => p.weight).filter(w => typeof w === 'number' && w > 0);
  const avgHeight = heights.length ? (heights.reduce((s, h) => s + h, 0) / heights.length) : 0;
  const avgWeight = weights.length ? (weights.reduce((s, w) => s + w, 0) / weights.length) : 0;

  const cards = [
    { id: 'players', title: 'Giocatori Totali', value: totalPlayers, subtitle: 'Attivi/rosa', icon: ICONS.players, color: 'success' },
    { id: 'avgAge', title: 'Età Media', value: `${avgAge.toFixed(1)} anni`, subtitle: 'Rosa completa', icon: ICONS.date, color: 'primary' },
    { id: 'shirts', title: 'Maglie Utilizzate', value: `${players.filter(p => p.shirtNumber != null).length}/99`, subtitle: 'Disponibili', icon: ICONS.target, color: 'info' },
    { id: 'phys', title: 'Dati Fisici', value: `${players.filter(p => p.height).length}/${totalPlayers}`, subtitle: 'Altezza registrata', icon: ICONS.training, color: 'warning' },
  ];

  return (
    <div className="kpi-cards-grid" style={{ marginBottom: 16 }}>
      {cards.map(card => {
        const Icon = card.icon;
        return (
          <div key={card.id} className={`kpi-card kpi-card--${card.color}`}>
            <div className="kpi-card__header">
              <div className="kpi-card__icon">
                <Icon size={ICON_SIZES.md} />
              </div>
              <span className="kpi-card__title">{card.title}</span>
            </div>
            <div className="kpi-card__content">
              <div className="kpi-card__value">{card.value}</div>
              <div className="kpi-card__subtitle">{card.subtitle}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlayersKPI;
