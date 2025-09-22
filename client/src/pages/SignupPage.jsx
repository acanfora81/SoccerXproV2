// client/src/pages/SignupPage.jsx
// Pagina di onboarding per creazione nuovo team

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Users, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { apiFetch } from '../utils/http';
import '../styles/signup.css';

const SignupPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: form, 2: success
  const [selectedPlan, setSelectedPlan] = useState('BASIC');
  const [formData, setFormData] = useState({
    teamName: '',
    email: '',
    firstName: '',
    lastName: '',
    plan: 'BASIC'
  });

  // Gestisci parametri URL
  useEffect(() => {
    const planFromUrl = searchParams.get('plan');
    if (planFromUrl) {
      setSelectedPlan(planFromUrl.toUpperCase());
      setFormData(prev => ({
        ...prev,
        plan: planFromUrl.toUpperCase()
      }));
    }
  }, [searchParams]);

  // Piani disponibili
  const plans = {
    BASIC: {
      name: 'Basic',
      price: 'Gratuito',
      maxUsers: 5,
      maxPlayers: 25,
      features: ['Dashboard base', 'Gestione giocatori', 'Contratti base'],
      popular: false
    },
    PROFESSIONAL: {
      name: 'Professional',
      price: '29€/mese',
      maxUsers: 15,
      maxPlayers: 50,
      features: ['Analytics avanzate', 'Report personalizzati', 'Supporto prioritario'],
      popular: true
    },
    PREMIUM: {
      name: 'Premium',
      price: '59€/mese',
      maxUsers: 30,
      maxPlayers: 100,
      features: ['Tutto Professional', 'Report avanzati', 'Integrazione API'],
      popular: false
    },
    ENTERPRISE: {
      name: 'Enterprise',
      price: 'Su richiesta',
      maxUsers: 100,
      maxPlayers: 250,
      features: ['Tutto Premium', 'API completa', 'Supporto dedicato'],
      popular: false
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Rimuovi errore quando l'utente inizia a digitare
    if (error) setError('');
  };

  const handlePlanSelect = (planKey) => {
    setSelectedPlan(planKey);
    setFormData(prev => ({
      ...prev,
      plan: planKey
    }));
  };

  const validateForm = () => {
    if (!formData.teamName.trim() || formData.teamName.trim().length < 2) {
      setError('Il nome del team deve essere almeno 2 caratteri');
      return false;
    }

    if (!formData.email || !formData.email.includes('@')) {
      setError('Inserisci un indirizzo email valido');
      return false;
    }

    if (!formData.firstName.trim()) {
      setError('Il nome è obbligatorio');
      return false;
    }

    if (!formData.lastName.trim()) {
      setError('Il cognome è obbligatorio');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      console.log('🟢 [SIGNUP] Invio dati onboarding:', {
        teamName: formData.teamName,
        email: formData.email,
        plan: formData.plan
      });

      const response = await apiFetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teamName: formData.teamName.trim(),
          email: formData.email.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          plan: formData.plan
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante la creazione del team');
      }

      if (data.success) {
        console.log('🟢 [SIGNUP] Team creato con successo:', data.data);
        setStep(2);
      } else {
        throw new Error(data.error || 'Errore sconosciuto');
      }

    } catch (err) {
      console.log('🔴 [SIGNUP] Errore:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/');
  };

  if (step === 2) {
    return (
      <div className="signup-page">
        <div className="signup-container">
          <div className="signup-success">
            <div className="success-icon">
              <CheckCircle size={64} />
            </div>
            <h1>Team creato con successo!</h1>
            <p>
              Il team <strong>{formData.teamName}</strong> è stato configurato correttamente.
              <br />
              Piano selezionato: <strong>{plans[selectedPlan].name}</strong>
            </p>
            <div className="success-details">
              <div className="detail-item">
                <Users size={20} />
                <span>Fino a {plans[selectedPlan].maxUsers} utenti</span>
              </div>
              <div className="detail-item">
                <Building2 size={20} />
                <span>Fino a {plans[selectedPlan].maxPlayers} giocatori</span>
              </div>
            </div>
            <p className="success-message">
              Ora puoi accedere al sistema con le credenziali fornite per iniziare a gestire il tuo team.
            </p>
            <button 
              onClick={handleGoToLogin}
              className="btn btn-primary btn-large"
            >
              Vai al Login
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-header">
          <div className="logo-section">
            <Building2 size={40} />
            <h1>Soccer X Pro Suite</h1>
          </div>
          <h2>Crea il tuo Team</h2>
          <p>Inizia a gestire il tuo team sportivo con Soccer X Pro Suite</p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          {/* Informazioni Team */}
          <div className="form-section">
            <h3>Informazioni Team</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="teamName">Nome Team *</label>
                <input
                  type="text"
                  id="teamName"
                  name="teamName"
                  value={formData.teamName}
                  onChange={handleInputChange}
                  placeholder="Es. AC Milan"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Informazioni Amministratore */}
          <div className="form-section">
            <h3>Amministratore Team</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">Nome *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Nome"
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Cognome *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Cognome"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="admin@example.com"
                  required
                  disabled={loading}
                />
                <small>Questa sarà la tua email di accesso come amministratore</small>
              </div>
            </div>
          </div>

          {/* Selezione Piano */}
          <div className="form-section">
            <h3>Scegli il tuo Piano</h3>
            <div className="plans-grid">
              {Object.entries(plans).map(([planKey, plan]) => (
                <div
                  key={planKey}
                  className={`plan-card ${selectedPlan === planKey ? 'selected' : ''} ${plan.popular ? 'popular' : ''}`}
                  onClick={() => handlePlanSelect(planKey)}
                >
                  {plan.popular && <div className="popular-badge">Popolare</div>}
                  <div className="plan-header">
                    <h4>{plan.name}</h4>
                    <div className="plan-price">{plan.price}</div>
                  </div>
                  <div className="plan-features">
                    <div className="plan-limits">
                      <div className="limit-item">
                        <Users size={16} />
                        <span>{plan.maxUsers} utenti</span>
                      </div>
                      <div className="limit-item">
                        <Building2 size={16} />
                        <span>{plan.maxPlayers} giocatori</span>
                      </div>
                    </div>
                    <ul className="feature-list">
                      {plan.features.map((feature, index) => (
                        <li key={index}>
                          <CheckCircle size={14} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Messaggio di errore */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="spinning" />
                  Creazione in corso...
                </>
              ) : (
                <>
                  Crea Team
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>

          <div className="form-footer">
            <p>
              Hai già un account? <button type="button" onClick={handleGoToLogin} className="link-button">Accedi</button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
