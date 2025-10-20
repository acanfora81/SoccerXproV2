// client_v3/src/modules/scouting/components/SoccerField.jsx
import React from 'react';

const SoccerField = ({ tokens = [], onClickToken, prospectTeamSide = 'HOME', prospectRole = null, readOnly = false }) => {
  return (
    <div className="relative w-full aspect-[3/2] bg-gradient-to-b from-green-700 to-green-600 rounded-xl shadow-inner overflow-hidden">
      {/* Outer rectangle */}
      <div className="absolute inset-3 border-2 border-white/70 rounded-lg"></div>
      
      {/* Halfway line */}
      <div className="absolute left-1/2 top-3 bottom-3 w-[2px] bg-white/60 -translate-x-1/2"></div>
      
      {/* Center circle */}
      <div className="absolute left-1/2 top-1/2 w-20 h-20 border-2 border-white/70 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      
      {/* Center spot */}
      <div className="absolute left-1/2 top-1/2 w-2 h-2 bg-white/80 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      
      {/* Left penalty area */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-20 h-40 border-2 border-white/60"></div>
      {/* Left goal area */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-16 border-2 border-white/60"></div>
      {/* Left goal */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-16 border-2 border-white/80"></div>
      {/* Left goal posts */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-white/90"></div>
      {/* Left goal line marker */}
      <div className="absolute left-0 top-1/2 w-2 h-8 bg-white/60 -translate-y-1/2"></div>
      
      {/* Right penalty area */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-20 h-40 border-2 border-white/60"></div>
      {/* Right goal area */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-16 border-2 border-white/60"></div>
      {/* Right goal */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-16 border-2 border-white/80"></div>
      {/* Right goal posts */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-white/90"></div>
      {/* Right goal line marker */}
      <div className="absolute right-0 top-1/2 w-2 h-8 bg-white/60 -translate-y-1/2"></div>
      
      {/* Corner arcs */}
      <div className="absolute left-3 top-3 w-4 h-4 border-2 border-white/50 rounded-full border-r-0 border-b-0"></div>
      <div className="absolute right-3 top-3 w-4 h-4 border-2 border-white/50 rounded-full border-l-0 border-b-0"></div>
      <div className="absolute left-3 bottom-3 w-4 h-4 border-2 border-white/50 rounded-full border-r-0 border-t-0"></div>
      <div className="absolute right-3 bottom-3 w-4 h-4 border-2 border-white/50 rounded-full border-l-0 border-t-0"></div>

      {tokens.map((p, i) => {
        // Determina se questo token è del prospect specifico
        const isProspect = (prospectTeamSide === 'HOME' && p.teamSide === 'HOME') || 
                          (prospectTeamSide === 'AWAY' && p.teamSide === 'AWAY');
        
        // Se abbiamo il ruolo del prospect, evidenzia solo quello specifico
        const isSpecificProspect = prospectRole && p.role === prospectRole && isProspect;
        
        return (
          <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            <button
              type="button"
              onClick={() => !readOnly && onClickToken?.(i, p)}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold shadow ${
                readOnly 
                  ? 'cursor-default' 
                  : 'hover:ring-2 hover:ring-yellow-400 cursor-pointer'
              } ${
                p.observed
                  ? 'ring-4 ring-amber-400 shadow-lg shadow-amber-400/50'
                  : (isSpecificProspect 
                      ? 'ring-3 ring-yellow-400 shadow-lg shadow-yellow-400/50' 
                      : 'ring-1 ring-white/50')
              }`}
              style={{ 
                backgroundColor: p.teamSide === 'HOME' ? '#dc2626' : '#2563eb'  // Casa = rosso, Trasferta = blu
              }}
              title={`${p.role}${p.number ? ' #' + p.number : ''}${p.name ? ' - ' + p.name : ''}${p.observed ? ' (VISIONATO)' : (isSpecificProspect ? ' (PROSPECT)' : '')}`}
            >
              {p.number || p.role}
            </button>
            {p.name && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold text-white bg-black/70 px-1 py-0.5 rounded whitespace-nowrap">
                {p.name}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SoccerField;
