import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

function NotFound() {
  const location = useLocation();
  const { user } = useAuthStore();

  // Messaggio professionale con possibile mancanza permessi
  const suspectedPermissionIssue = location?.pathname?.startsWith('/dashboard');

  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1>Accesso non disponibile</h1>
        <h2>Questa pagina non è accessibile</h2>
        <p>
          {suspectedPermissionIssue
            ? 'Potresti non avere i permessi necessari per visualizzare questa sezione oppure il link non è più valido.'
            : 'Il link potrebbe essere errato oppure la pagina non è più disponibile.'}
        </p>
        {user?.role && (
          <p style={{ opacity: 0.8 }}>Utente: {user.first_name || user.email} · Ruolo: {user.role}</p>
        )}
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <Link to="/dashboard" className="btn-primary">
            Torna alla Dashboard
          </Link>
          <Link to="/dashboard" className="btn-secondary" style={{ textDecoration: 'none' }}>
            Contatta l’amministratore
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
