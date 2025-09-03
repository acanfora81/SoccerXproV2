import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Pagina non trovata</h2>
        <p>La pagina che stai cercando non esiste.</p>
        <Link to="/dashboard" className="btn-primary">
          Torna alla Dashboard
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
