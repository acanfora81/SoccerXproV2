import React, { useMemo, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { feature } from "topojson-client";
import world110m from "world-atlas/countries-110m.json";

// Nota: usiamo un topojson leggero inline se disponibile via import dinamico
// Per semplicità cerchiamo di caricare world-atlas se presente in node_modules

export default function NationalityWorldMap({ players }) {
  const [hover, setHover] = useState(null);
  const [position, setPosition] = useState({ coordinates: [0, 0], zoom: 1 });
  const [activeTab, setActiveTab] = useState('world');
  const containerRef = useRef(null);

  const continentViews = {
    world: { 
      name: 'Mondo', 
      center: [0, 0], 
      zoom: 1, 
      scale: 140,
      countries: [] // Tutti i paesi
    },
    europe: { 
      name: 'Europa', 
      center: [15, 55], 
      zoom: 2.5, 
      scale: 300,
      countries: ['Italy', 'France', 'Spain', 'Germany', 'Portugal', 'Belgium', 'Netherlands', 'United Kingdom', 'Ireland', 'Switzerland', 'Austria', 'Denmark', 'Norway', 'Sweden', 'Finland', 'Poland', 'Czechia', 'Slovakia', 'Slovenia', 'Croatia', 'Serbia', 'Bosnia and Herzegovina', 'Greece', 'Turkey', 'Romania', 'Bulgaria', 'Albania', 'North Macedonia', 'Russia', 'Ukraine', 'Belarus', 'Lithuania', 'Latvia', 'Estonia', 'Moldova', 'Hungary', 'Slovenia', 'Slovakia', 'Czech Republic', 'Poland', 'Germany', 'Austria', 'Switzerland', 'Liechtenstein', 'Luxembourg', 'Belgium', 'Netherlands', 'France', 'Monaco', 'Andorra', 'Spain', 'Portugal', 'Italy', 'San Marino', 'Vatican City', 'Malta', 'Cyprus', 'Iceland', 'Norway', 'Sweden', 'Finland', 'Denmark', 'Faroe Islands', 'Greenland']
    },
    americas: { 
      name: 'Americhe', 
      center: [-80, 20], 
      zoom: 1.8, 
      scale: 200,
      countries: ['United States of America', 'Canada', 'Mexico', 'Guatemala', 'Belize', 'El Salvador', 'Honduras', 'Nicaragua', 'Costa Rica', 'Panama', 'Cuba', 'Jamaica', 'Haiti', 'Dominican Republic', 'Puerto Rico', 'Trinidad and Tobago', 'Barbados', 'Brazil', 'Argentina', 'Chile', 'Uruguay', 'Paraguay', 'Bolivia', 'Peru', 'Ecuador', 'Colombia', 'Venezuela', 'Guyana', 'Suriname', 'French Guiana']
    },
    africa: { 
      name: 'Africa', 
      center: [20, 0], 
      zoom: 2, 
      scale: 250,
      countries: ['Morocco', 'Algeria', 'Tunisia', 'Libya', 'Egypt', 'Sudan', 'South Sudan', 'Ethiopia', 'Eritrea', 'Djibouti', 'Somalia', 'Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Burundi', 'Democratic Republic of the Congo', 'Republic of the Congo', 'Central African Republic', 'Chad', 'Cameroon', 'Nigeria', 'Niger', 'Mali', 'Burkina Faso', 'Ghana', 'Togo', 'Benin', 'Ivory Coast', 'Liberia', 'Sierra Leone', 'Guinea', 'Guinea-Bissau', 'Senegal', 'Gambia', 'Mauritania', 'Cape Verde', 'Sao Tome and Principe', 'Equatorial Guinea', 'Gabon', 'Angola', 'Zambia', 'Zimbabwe', 'Botswana', 'Namibia', 'South Africa', 'Lesotho', 'Swaziland', 'Madagascar', 'Mauritius', 'Seychelles', 'Comoros', 'Malawi', 'Mozambique']
    },
    asia: { 
      name: 'Asia', 
      center: [100, 30], 
      zoom: 1.5, 
      scale: 180,
      countries: ['China', 'Japan', 'South Korea', 'North Korea', 'Mongolia', 'Russia', 'Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Tajikistan', 'Kyrgyzstan', 'Afghanistan', 'Pakistan', 'India', 'Nepal', 'Bhutan', 'Bangladesh', 'Sri Lanka', 'Maldives', 'Myanmar', 'Thailand', 'Laos', 'Vietnam', 'Cambodia', 'Malaysia', 'Singapore', 'Indonesia', 'Philippines', 'Brunei', 'East Timor', 'Taiwan', 'Hong Kong', 'Macau']
    },
    oceania: { 
      name: 'Oceania', 
      center: [140, -25], 
      zoom: 3, 
      scale: 400,
      countries: ['Australia', 'New Zealand', 'Papua New Guinea', 'Fiji', 'Solomon Islands', 'Vanuatu', 'New Caledonia', 'French Polynesia', 'Samoa', 'Tonga', 'Kiribati', 'Tuvalu', 'Nauru', 'Palau', 'Marshall Islands', 'Micronesia', 'Cook Islands', 'Niue', 'Tokelau', 'Pitcairn Islands', 'Norfolk Island', 'Christmas Island', 'Cocos Islands', 'Heard Island and McDonald Islands', 'Bouvet Island', 'South Georgia and the South Sandwich Islands', 'French Southern and Antarctic Lands', 'British Indian Ocean Territory', 'American Samoa', 'Guam', 'Northern Mariana Islands', 'Wake Island', 'Midway Islands', 'Johnston Atoll', 'Baker Island', 'Howland Island', 'Jarvis Island', 'Kingman Reef', 'Palmyra Atoll']
    }
  };

  const normalizeCountry = (raw) => {
    if (!raw) return '';
    const v = String(raw).trim().toLowerCase();
    const map = {
      'italia': 'Italy', 'italiana': 'Italy', 'italy': 'Italy', 'it': 'Italy',
      'francia': 'France', 'france': 'France',
      'spagna': 'Spain', 'spain': 'Spain',
      'germania': 'Germany', 'germany': 'Germany',
      'portogallo': 'Portugal', 'portugal': 'Portugal',
      'belgio': 'Belgium', 'belgium': 'Belgium',
      'olanda': 'Netherlands', 'paesi bassi': 'Netherlands', 'netherlands': 'Netherlands',
      'inghilterra': 'United Kingdom', 'uk': 'United Kingdom', 'united kingdom': 'United Kingdom', 'regno unito': 'United Kingdom', 'scotland': 'United Kingdom', 'scozia': 'United Kingdom', 'wales': 'United Kingdom', 'galles': 'United Kingdom',
      'irlanda': 'Ireland', 'ireland': 'Ireland',
      'svizzera': 'Switzerland', 'switzerland': 'Switzerland',
      'austria': 'Austria',
      'danimarca': 'Denmark', 'denmark': 'Denmark',
      'norvegia': 'Norway', 'norway': 'Norway',
      'svezia': 'Sweden', 'sweden': 'Sweden',
      'finlandia': 'Finland', 'finland': 'Finland',
      'polonia': 'Poland', 'poland': 'Poland',
      'repubblica ceca': 'Czechia', 'czech republic': 'Czechia', 'czechia': 'Czechia',
      'slovacchia': 'Slovakia', 'slovakia': 'Slovakia',
      'slovenia': 'Slovenia',
      'croazia': 'Croatia', 'croatia': 'Croatia',
      'serbia': 'Serbia',
      'bosnia': 'Bosnia and Herzegovina', 'bosnia ed erzegovina': 'Bosnia and Herzegovina',
      'grecia': 'Greece', 'greece': 'Greece',
      'turchia': 'Turkey', 'turkey': 'Turkey',
      'stati uniti': 'United States of America', 'usa': 'United States of America', 'united states': 'United States of America', 'united states of america': 'United States of America',
      'canada': 'Canada',
      'brasile': 'Brazil', 'brazil': 'Brazil',
      'argentina': 'Argentina',
      'uruguay': 'Uruguay',
      'cile': 'Chile', 'chile': 'Chile',
      'messico': 'Mexico', 'mexico': 'Mexico',
      'colombia': 'Colombia',
      'peru': 'Peru', 'perù': 'Peru',
      'marocco': 'Morocco', 'morocco': 'Morocco',
      'tunisia': 'Tunisia', 'algeria': 'Algeria',
      'egitto': 'Egypt', 'egypt': 'Egypt',
      'nigeria': 'Nigeria', 'ghana': 'Ghana',
      "costa d'avorio": "Côte d'Ivoire", 'ivory coast': "Côte d'Ivoire",
      'russia': 'Russia', 'ukraine': 'Ukraine',
      'romania': 'Romania', 'bulgaria': 'Bulgaria', 'albania': 'Albania',
      'macedonia del nord': 'North Macedonia', 'north macedonia': 'North Macedonia',
      'australia': 'Australia', 'nuova zelanda': 'New Zealand', 'new zealand': 'New Zealand'
    };
    return map[v] || raw;
  };

  const countryCounts = useMemo(() => {
    const acc = new Map();
    players.forEach(p => {
      const n = normalizeCountry(p.nationality);
      if (!n) return;
      acc.set(n, (acc.get(n) || 0) + 1);
    });
    return acc;
  }, [players]);

  const worldData = useMemo(() => feature(world110m, world110m.objects.countries), []);

  // semplice mappa: coloriamo i paesi che hanno almeno un giocatore
  const getFill = (name) => {
    const count = countryCounts.get(name) || 0;
    if (count === 0) return '#1e293b'; // land neutro visibile
    if (count === 1) return '#1D4ED8';
    if (count <= 3) return '#3B82F6';
    if (count <= 6) return '#60A5FA';
    return '#93C5FD';
  };

  // mapping semplificato ISO name -> label presente nei nostri dati (dipende da come salviamo la nazionalità)
  const nameAccessor = (props) => props.properties?.name || props.properties?.NAME || '';

  const currentView = continentViews[activeTab];

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const view = continentViews[tab];
    setPosition({ coordinates: view.center, zoom: view.zoom });
  };

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 mb-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {Object.entries(continentViews).map(([key, view]) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === key
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {view.name}
          </button>
        ))}
      </div>

      {/* Map Container */}
      <div ref={containerRef} className="w-full h-[28rem] relative rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0b1424] overflow-hidden">
        <ComposableMap
          projection="geoNaturalEarth1"
          projectionConfig={{
            scale: currentView.scale,
            center: currentView.center
          }}
          width={800}
          height={450}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveEnd={setPosition}
          >
          <Geographies geography={worldData}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const name = nameAccessor(geo);
                const count = countryCounts.get(name) || 0;
                const isInActiveContinent = currentView.countries.length === 0 || currentView.countries.includes(name);
                
                // Logica colori adattiva per tema light/dark:
                // - Rosso: Paesi con giocatori
                // - Verde chiaro: Paesi del continente attivo (senza giocatori)
                // - Grigio: Altri paesi
                const isDark = document.documentElement.classList.contains('dark');
                let fill = isDark ? '#1e293b' : '#e5e7eb'; // Grigio scuro/chiaro
                
                if (count > 0) {
                  fill = '#EF4444'; // Rosso per paesi con giocatori
                } else if (isInActiveContinent && activeTab !== 'world') {
                  fill = '#10B981'; // Verde chiaro per paesi del continente attivo
                }
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke={isDark ? "#374151" : "#9ca3af"}
                    strokeWidth={0.6}
                    style={{
                      default: { outline: "none" },
                      hover: { 
                        outline: "none", 
                        fill: count > 0 ? '#DC2626' : isInActiveContinent && activeTab !== 'world' ? '#059669' : (isDark ? '#374151' : '#9ca3af')
                      },
                      pressed: { outline: "none" }
                    }}
                    onMouseEnter={() => {
                      if (count > 0) {
                        setHover({ name, count });
                      }
                    }}
                    onMouseLeave={() => setHover(null)}
                  />
                );
              })
            }
          </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {hover && (
          <div className="pointer-events-none absolute z-20 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg border border-gray-700 shadow-xl top-4 left-4">
            <div className="font-semibold text-blue-400 mb-1">{hover.name || 'Sconosciuta'}</div>
            <div>Giocatori: <span className="font-bold">{hover.count}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}


